import { describe, it } from "node:test";
import assert from "node:assert";
import {
  ESCROW_PROGRAM_PROGRAM_ADDRESS,
  fetchEscrow,
  getMakeInstructionAsync,
  getRefundInstructionAsync,
  getTakeInstructionAsync,
} from "../src/client/js/generated";
import {
  Address,
  createSolanaClient,
  createTransaction,
  getAddressEncoder,
  getBytesEncoder,
  getProgramDerivedAddress,
  getSignatureFromTransaction,
  getU64Encoder,
  KeyPairSigner,
  lamports,
  signTransactionMessageWithSigners,
  SolanaError,
} from "gill";
import { createAndFundedKeypair } from "@testing";
import { startLocalValidator } from "@testing/localValidator/localValidator";
import { setupFungibleToken } from "@testing";
import { expectTxToFailWith } from "@testing";
import { expectTxToSucceed } from "@testing";
import { expectAccountToExist } from "@testing";
import { ensureAta } from "@testing";
import { listCpiCalls } from "@testing";
import { totalComputeUnits } from "@testing";
import { inspectTransaction } from "@testing";
import { getAssociatedTokenAccountAddress, TOKEN_PROGRAM_ADDRESS } from "gill/programs";

describe("Escrow Tests", async () => {
  const ProgramAddress = ESCROW_PROGRAM_PROGRAM_ADDRESS;
  const { rpcUrl, payer } = await startLocalValidator({
    programAddress: ProgramAddress,
  });
  const { rpc, rpcSubscriptions, sendAndConfirmTransaction } = createSolanaClient({
    urlOrMoniker: rpcUrl,
  });

  // ============================================
  // HELPER FUNCTIONS
  // ============================================

  async function setupTestAccounts() {
    const { fundedKeypair: maker } = await createAndFundedKeypair(rpc, rpcSubscriptions);
    const { fundedKeypair: taker } = await createAndFundedKeypair(rpc, rpcSubscriptions);
    const { fundedKeypair: mintAuthorityA } = await createAndFundedKeypair(rpc, rpcSubscriptions);
    const { fundedKeypair: mintAuthorityB } = await createAndFundedKeypair(rpc, rpcSubscriptions);
    return { maker, taker, mintAuthorityA, mintAuthorityB };
  }

  async function setupTokenPair(
    owner1: KeyPairSigner,
    owner2: KeyPairSigner,
    mintAuthA: KeyPairSigner,
    mintAuthB: KeyPairSigner,
    amount1 = lamports(1_000_000_000n),
    amount2 = lamports(2_000_000_000n),
  ) {
    const { mint: mintA, ata: ata1 } = await setupFungibleToken(rpc, sendAndConfirmTransaction, {
      payer,
      owner: owner1.address,
      mintAuthority: mintAuthA,
      freezeAuthority: mintAuthA,
      decimals: 8,
      amount: amount1,
    });

    const { mint: mintB, ata: ata2 } = await setupFungibleToken(rpc, sendAndConfirmTransaction, {
      payer,
      owner: owner2.address,
      mintAuthority: mintAuthB,
      freezeAuthority: mintAuthB,
      decimals: 8,
      amount: amount2,
    });

    return { mintA, mintB, ata1, ata2 };
  }

  async function getEscrowPda(makerAddress: Address, seed: bigint) {
    const [escrowPda] = await getProgramDerivedAddress({
      programAddress: ESCROW_PROGRAM_PROGRAM_ADDRESS,
      seeds: [
        getBytesEncoder().encode(new Uint8Array([101, 115, 99, 114, 111, 119])),
        getAddressEncoder().encode(makerAddress),
        getU64Encoder().encode(seed),
      ],
    });
    return escrowPda;
  }

  async function buildAndSignTransaction(instructions: any[]) {
    const { value: latestBlockhash } = await rpc.getLatestBlockhash().send();
    const tx = createTransaction({
      feePayer: payer,
      version: "legacy",
      instructions,
      latestBlockhash,
    });
    return await signTransactionMessageWithSigners(tx);
  }

  async function getTokenBalance(ata: Address) {
    const info = await rpc.getAccountInfo(ata, { encoding: "jsonParsed" }).send();
    if (!info.value) return null;
    const data = info.value.data as any;
    return BigInt(data.parsed.info.tokenAmount.amount);
  }

  async function createEscrow(
    maker: KeyPairSigner,
    mintA: Address,
    mintB: Address,
    seed: bigint,
    receive: bigint,
    amount: bigint,
  ) {
    const makeInstruction = await getMakeInstructionAsync({
      maker,
      mintA,
      mintB,
      seed,
      receive,
      amount,
    });
    const signedTx = await buildAndSignTransaction([makeInstruction]);
    const txSignature = getSignatureFromTransaction(signedTx);
    await sendAndConfirmTransaction(signedTx);

    // Inspect transaction and log details
    const txDetails = await inspectTransaction(rpc, txSignature);
    if (txDetails) {
      const computeUnits = totalComputeUnits(txDetails.logs);
      console.log(`  📊 Make operation used ${computeUnits} compute units`);
    }

    return await getEscrowPda(maker.address, seed);
  }

  // ============================================
  // TESTS
  // ============================================

  it("should successfully create and verify escrow", async () => {
    const { maker, mintAuthorityA, mintAuthorityB } = await setupTestAccounts();
    const { mintA, mintB, ata1: makerAta } = await setupTokenPair(maker, payer, mintAuthorityA, mintAuthorityB);

    const seed = 12345n;
    const receive = 1_000_000n;
    const amount = 500_000n;

    const escrowPda = await createEscrow(maker, mintA, mintB, seed, receive, amount);

    // Use expectAccountToExist to verify accounts
    await expectAccountToExist(rpc, escrowPda);

    const vaultAta = await getAssociatedTokenAccountAddress(mintA, escrowPda, TOKEN_PROGRAM_ADDRESS);
    await expectAccountToExist(rpc, vaultAta);

    // Verify escrow data
    const escrowAccount = await fetchEscrow(rpc, escrowPda);
    assert.strictEqual(escrowAccount.data.seed, seed);
    assert.strictEqual(escrowAccount.data.maker, maker.address);
    assert.strictEqual(escrowAccount.data.mintA, mintA);
    assert.strictEqual(escrowAccount.data.mintB, mintB);
    assert.strictEqual(escrowAccount.data.receive, receive);

    // Verify vault balance
    const vaultBalance = await getTokenBalance(vaultAta);
    assert.strictEqual(vaultBalance, amount);

    // Verify maker balance
    const makerBalance = await getTokenBalance(makerAta);
    assert.strictEqual(makerBalance, lamports(1_000_000_000n) - amount);

    console.log("✅ Escrow created successfully");
  });

  it("should fail when receive amount is 0", async () => {
    const { maker, mintAuthorityA, mintAuthorityB } = await setupTestAccounts();
    const { mintA, mintB } = await setupTokenPair(maker, payer, mintAuthorityA, mintAuthorityB);

    const makeInstruction = await getMakeInstructionAsync({
      maker,
      mintA,
      mintB,
      seed: 11111n,
      receive: 0n,
      amount: 500_000n,
    });

    const signedTx = await buildAndSignTransaction([makeInstruction]);
    const txSignature = getSignatureFromTransaction(signedTx);

    try {
      await sendAndConfirmTransaction(signedTx);
      assert.fail("Should have failed with InvalidAmount");
    } catch (err: unknown) {
      if (err instanceof SolanaError && err.context["__code"] === -32002) {
        await expectTxToFailWith(rpc, err.context.logs, {
          code: "6000",
          messageIncludes: "InvalidAmount",
        });
      }
    }
    console.log("✅ Invalid receive amount rejected");
  });

  it("should successfully execute take and complete swap", async () => {
    const { maker, taker, mintAuthorityA, mintAuthorityB } = await setupTestAccounts();
    const { mintA, mintB, ata2: takerAtaB } = await setupTokenPair(maker, taker, mintAuthorityA, mintAuthorityB);

    const seed = 99999n;
    const receive = 1_000_000n;
    const amount = 500_000n;

    const escrowPda = await createEscrow(maker, mintA, mintB, seed, receive, amount);

    const { ata: takerAtaA } = await ensureAta(rpc, sendAndConfirmTransaction, {
      mint: mintA,
      owner: taker.address,
      payer: payer,
    });
    console.log("  📦 Ensured taker's ATA for Token A exists");

    // Execute take
    const takeInstruction = await getTakeInstructionAsync({
      taker,
      maker: maker.address,
      escrow: escrowPda,
      mintA,
      mintB,
    });

    const signedTx = await buildAndSignTransaction([takeInstruction]);
    const txSignature = getSignatureFromTransaction(signedTx);
    await sendAndConfirmTransaction(signedTx);

    await expectTxToSucceed(rpc, txSignature);

    const txDetails = await inspectTransaction(rpc, txSignature);
    if (txDetails) {
      const cpiCalls = listCpiCalls(txDetails.logs);
      console.log(`  🔄 CPI calls during take: ${cpiCalls.length}`);
      cpiCalls.forEach((call, idx) => {
        console.log(`    ${idx + 1}. Program: ${call.programId}, Depth: ${call.depth}`);
      });

      const computeUnits = totalComputeUnits(txDetails.logs);
      console.log(`  📊 Take operation used ${computeUnits} compute units`);
    }

    // Verify escrow closed
    try {
      await fetchEscrow(rpc, escrowPda);
      assert.fail("Escrow should be closed");
    } catch (error) {
      console.log("  ✅ Escrow closed");
    }

    // Verify balances
    const takerABalance = await getTokenBalance(takerAtaA);
    assert.strictEqual(takerABalance, amount);

    const makerAtaB = await getAssociatedTokenAccountAddress(mintB, maker.address, TOKEN_PROGRAM_ADDRESS);
    const makerBBalance = await getTokenBalance(makerAtaB);
    assert.strictEqual(makerBBalance, receive);

    const takerBBalance = await getTokenBalance(takerAtaB);
    assert.strictEqual(takerBBalance, lamports(2_000_000_000n) - receive);

    console.log("✅ Swap completed successfully");
  });

  it("should fail when taker has insufficient Token B", async () => {
    const { maker, taker, mintAuthorityA, mintAuthorityB } = await setupTestAccounts();
    const { mintA, mintB } = await setupTokenPair(
      maker,
      taker,
      mintAuthorityA,
      mintAuthorityB,
      lamports(1_000_000_000n),
      lamports(100n), // Taker has very little
    );

    const seed = 88888n;
    const receive = 10_000_000n; // Requesting more than taker has
    const amount = 500_000n;

    const escrowPda = await createEscrow(maker, mintA, mintB, seed, receive, amount);

    const takeInstruction = await getTakeInstructionAsync({
      taker,
      maker: maker.address,
      escrow: escrowPda,
      mintA,
      mintB,
    });

    const signedTx = await buildAndSignTransaction([takeInstruction]);
    const txSignature = getSignatureFromTransaction(signedTx);

    try {
      await sendAndConfirmTransaction(signedTx, { skipPreflight: true, commitment: "confirmed" });
      assert.fail("Should fail with insufficient funds");
    } catch (error) {
      await expectTxToFailWith(rpc, txSignature, {
        messageIncludes: "insufficient funds",
      });
    }
    console.log("✅ Insufficient funds rejected");
  });

  it("should fail with wrong maker address", async () => {
    const { maker, taker, mintAuthorityA, mintAuthorityB } = await setupTestAccounts();
    const { fundedKeypair: fakeMaker } = await createAndFundedKeypair(rpc, rpcSubscriptions);
    const { mintA, mintB } = await setupTokenPair(maker, taker, mintAuthorityA, mintAuthorityB);

    const seed = 77777n;
    const escrowPda = await createEscrow(maker, mintA, mintB, seed, 1_000_000n, 500_000n);

    const takeInstruction = await getTakeInstructionAsync({
      taker,
      maker: fakeMaker.address, // Wrong maker
      escrow: escrowPda,
      mintA,
      mintB,
    });

    const signedTx = await buildAndSignTransaction([takeInstruction]);
    const txSignature = getSignatureFromTransaction(signedTx);

    try {
      await sendAndConfirmTransaction(signedTx, { skipPreflight: true, commitment: "confirmed" });
      assert.fail("Should fail with constraint seeds error");
    } catch (error) {
      await expectTxToFailWith(rpc, txSignature, {
        code: "2006",
        messageIncludes: "ConstraintSeeds",
      });
    }
    console.log("✅ Wrong maker rejected");
  });

  it("should fail with invalid mint addresses", async () => {
    const { maker, taker, mintAuthorityA, mintAuthorityB } = await setupTestAccounts();
    const { fundedKeypair: mintAuthorityC } = await createAndFundedKeypair(rpc, rpcSubscriptions);
    const { mintA, mintB } = await setupTokenPair(maker, taker, mintAuthorityA, mintAuthorityB);

    const { mint: mintC } = await setupFungibleToken(rpc, sendAndConfirmTransaction, {
      payer,
      owner: taker.address,
      mintAuthority: mintAuthorityC,
      freezeAuthority: mintAuthorityC,
      decimals: 8,
      amount: lamports(2_000_000_000n),
    });

    const seed = 66666n;
    const escrowPda = await createEscrow(maker, mintA, mintB, seed, 1_000_000n, 500_000n);

    const takeInstruction = await getTakeInstructionAsync({
      taker,
      maker: maker.address,
      escrow: escrowPda,
      mintA,
      mintB: mintC, // Wrong mint
    });

    const signedTx = await buildAndSignTransaction([takeInstruction]);
    const txSignature = getSignatureFromTransaction(signedTx);

    try {
      await sendAndConfirmTransaction(signedTx, { skipPreflight: true, commitment: "confirmed" });
      assert.fail("Should fail with InvalidMintB");
    } catch (error) {
      await expectTxToFailWith(rpc, txSignature, {
        code: "6003",
        messageIncludes: "InvalidMintB",
      });
    }
    console.log("✅ Invalid mint rejected");
  });

  it("should successfully refund tokens and close escrow", async () => {
    const { maker, mintAuthorityA, mintAuthorityB } = await setupTestAccounts();
    const { mintA, mintB, ata1: makerAta } = await setupTokenPair(maker, payer, mintAuthorityA, mintAuthorityB);

    const seed = 11111n;
    const amount = 500_000n;

    const escrowPda = await createEscrow(maker, mintA, mintB, seed, 1_000_000n, amount);

    // Execute refund
    const refundInstruction = await getRefundInstructionAsync({
      maker,
      escrow: escrowPda,
      mintA,
    });

    const signedTx = await buildAndSignTransaction([refundInstruction]);
    const txSignature = getSignatureFromTransaction(signedTx);
    await sendAndConfirmTransaction(signedTx);

    await expectTxToSucceed(rpc, txSignature);

    const txDetails = await inspectTransaction(rpc, txSignature);
    if (txDetails) {
      const cpiCalls = listCpiCalls(txDetails.logs);
      console.log(`  🔄 CPI calls during refund: ${cpiCalls.length}`);
      cpiCalls.forEach((call, idx) => {
        console.log(`    ${idx + 1}. Program: ${call.programId}, Depth: ${call.depth}`);
      });

      const computeUnits = totalComputeUnits(txDetails.logs);
      console.log(`  📊 Refund operation used ${computeUnits} compute units`);
    }

    // Verify escrow closed
    try {
      await fetchEscrow(rpc, escrowPda);
      assert.fail("Escrow should be closed");
    } catch (error) {
      console.log("  ✅ Escrow closed");
    }

    // Verify vault closed
    const vaultAta = await getAssociatedTokenAccountAddress(mintA, escrowPda, TOKEN_PROGRAM_ADDRESS);
    const vaultInfo = await rpc.getAccountInfo(vaultAta).send();
    assert.strictEqual(vaultInfo.value, null);

    // Verify maker balance restored
    const makerBalance = await getTokenBalance(makerAta);
    assert.strictEqual(makerBalance, lamports(1_000_000_000n));

    console.log("✅ Refund completed successfully");
  });

  it("should fail when wrong maker tries to refund", async () => {
    const { maker, mintAuthorityA, mintAuthorityB } = await setupTestAccounts();
    const { fundedKeypair: fakeMaker } = await createAndFundedKeypair(rpc, rpcSubscriptions);
    const { mintA, mintB } = await setupTokenPair(maker, payer, mintAuthorityA, mintAuthorityB);

    const seed = 22222n;
    const escrowPda = await createEscrow(maker, mintA, mintB, seed, 1_000_000n, 500_000n);

    const refundInstruction = await getRefundInstructionAsync({
      maker: fakeMaker, // Wrong maker
      escrow: escrowPda,
      mintA,
    });

    const signedTx = await buildAndSignTransaction([refundInstruction]);
    const txSignature = getSignatureFromTransaction(signedTx);

    try {
      await sendAndConfirmTransaction(signedTx, { skipPreflight: true, commitment: "confirmed" });
      assert.fail("Should fail with constraint seeds error");
    } catch (error) {
      await expectTxToFailWith(rpc, txSignature, {
        code: "2006",
        messageIncludes: "ConstraintSeeds",
      });
    }
    console.log("✅ Wrong maker refund rejected");
  });
});
