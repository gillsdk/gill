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
  mint: Address;
  /** The owner address who will receive the minted tokens */
  toOwner: Address;
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
 */
export default async function mintTo(
  rpc: SolanaClient["rpc"],
  sendAndConfirmTransaction: SendAndConfirmTransactionWithSignersFunction,
  params: MintToParams,
): Promise<MintToResult> {
  const { mint, toOwner, amount, payer, ensureAta: shouldEnsureAta = true } = params;

  if (amount <= 0n) {
    throw new Error("Amount must be greater than 0");
  }

  const signer = payer ?? (await loadKeypairSignerFromFile());

  let ata: Address;
  if (shouldEnsureAta) {
    const { ata: ensuredAta } = await ensureAta(rpc, sendAndConfirmTransaction, {
      owner: toOwner,
      mint,
    });
    ata = ensuredAta;
  } else {
    ata = await getAssociatedTokenAccountAddress(mint, toOwner, TOKEN_PROGRAM_ADDRESS);
  }

  const { value: latestBlockhash } = await rpc.getLatestBlockhash().send();

  const mintToTx = createTransaction({
    feePayer: signer,
    version: "legacy",
    instructions: [
      getMintToInstruction(
        {
          mint,
          mintAuthority: signer,
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
