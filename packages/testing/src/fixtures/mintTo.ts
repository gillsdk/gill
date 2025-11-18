import type { KeyPairSigner, Lamports, SendAndConfirmTransactionWithSignersFunction, Signature } from "gill";
import { createTransaction, signTransactionMessageWithSigners, type Address, type SolanaClient } from "gill";
import { loadKeypairSignerFromFile } from "gill/node";
import { getAssociatedTokenAccountAddress, getMintToInstruction, TOKEN_PROGRAM_ADDRESS } from "gill/programs";
import { ensureAta } from "./ensureAta";

/**
 * Parameters required to mint tokens to an owner.
 */
type MintToParams = {
  /**
   * Optional fee payer for account creation and transaction fees.
   * Defaults to loading a local keypair via `loadKeypairSignerFromFile()`.
   */
  payer?: KeyPairSigner;
  /** The mint address of the token to mint */
  /**
   * The mint authority that has permission to mint tokens.
   * Defaults to the payer if not provided.
   */
  mintAuthority?: KeyPairSigner;

  mint: Address;
  /** The owner address who will receive the minted tokens */
  owner: Address;
  /** Amount of tokens to mint */
  amount: Lamports;
  /** Whether to automatically create the associated token account if it does not exist (default: true) */
  ensureAta?: boolean;
};

/**
 * Result returned after minting tokens.
 */
type MintToResult = {
  /** Address of the associated token account receiving the tokens */
  ata: Address;
  /** Signature of the mint transaction */
  transactionSignature: Signature;
  /** Amount of tokens minted */
  mintedAmount: Lamports;
};

/**
 * Mints tokens to a specified owner's associated token account.
 *
 * This function handles:
 * - Ensuring the owner has an associated token account (ATA) for the mint
 * - Minting the specified amount of tokens to the ATA
 *
 * @param rpc - Solana RPC client
 * @param sendAndConfirmTransaction - Function to send and confirm signed transactions
 * @param params - Object containing:
 *   - payer: Optional fee payer for transaction and account creation. Defaults to a local keypair.
 *   - mint: The token mint address to mint tokens from.
 *   - mintAuthority: Authority allowed to mint tokens. Defaults to payer if not provided.
 *   - owner: Address of the account receiving the minted tokens.
 *   - amount: Number of tokens to mint.
 *   - ensureAta: Whether to create the ATA if it doesn't exist (default: true).
 *
 * @returns MintToResult containing:
 *   - ata: Address of the associated token account receiving the tokens
 *   - transactionSignature: Signature of the mint transaction
 *   - mintedAmount: Amount of tokens minted
 *
 * @example
 * const { ata, transactionSignature, mintedAmount } = await mintTo(
 *   rpc,
 *   sendAndConfirmTransaction,
 *   {
 *     payer: userSigner,
 *     mint: myMintAddress,
 *     mintAuthority: myMintAuthority,
 *     owner: recipientAddress,
 *     amount: lamports(5000n),
 *     ensureAta: true
 *   }
 * );
 */
export async function mintTo(
  rpc: SolanaClient["rpc"],
  sendAndConfirmTransaction: SendAndConfirmTransactionWithSignersFunction,
  params: MintToParams,
): Promise<MintToResult> {
  const { mint, owner, amount, payer, mintAuthority, ensureAta: shouldEnsureAta = true } = params;

  if (amount <= 0n) {
    throw new Error("Amount must be greater than 0");
  }

  const signer = payer ?? (await loadKeypairSignerFromFile());
  const mintAuth = mintAuthority ?? signer;

  let ata: Address;
  if (shouldEnsureAta) {
    const { ata: ensuredAta } = await ensureAta(rpc, sendAndConfirmTransaction, {
      owner: owner,
      mint,
    });
    ata = ensuredAta;
  } else {
    ata = await getAssociatedTokenAccountAddress(mint, owner, TOKEN_PROGRAM_ADDRESS);
  }

  const { value: latestBlockhash } = await rpc.getLatestBlockhash().send();

  const mintToTx = createTransaction({
    feePayer: signer,
    version: "legacy",
    instructions: [
      getMintToInstruction(
        {
          mint,
          mintAuthority: mintAuth,
          token: ata,
          amount,
        },
        { programAddress: TOKEN_PROGRAM_ADDRESS },
      ),
    ],
    latestBlockhash,
  });

  const signedTransaction = await signTransactionMessageWithSigners(mintToTx);
  const transactionSignature = await sendAndConfirmTransaction(signedTransaction);

  return {
    ata,
    transactionSignature,
    mintedAmount: amount,
  };
}
