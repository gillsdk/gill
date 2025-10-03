import {
  Address,
  createTransaction,
  SendAndConfirmTransactionWithSignersFunction,
  signTransactionMessageWithSigners,
  SolanaClient,
  Signature,
  KeyPairSigner,
} from "gill";
import { loadKeypairSignerFromFile } from "gill/node";
import {
  getAssociatedTokenAccountAddress,
  getCreateAssociatedTokenIdempotentInstruction,
  TOKEN_PROGRAM_ADDRESS,
} from "gill/programs";

/**
 * Parameters required to ensure an associated token account (ATA) exists.
 */
type EnsureAtaParams = {
  /**
   * Optional fee payer for account creation and transaction fees.
   * Defaults to loading a local keypair via `loadKeypairSignerFromFile()`.
   */
  payer?: KeyPairSigner;
  /** Owner of the token account */
  owner: Address;
  /** Mint address of the token */
  mint: Address;
};

/**
 * Result returned when ensuring an ATA.
 */
type EnsureAtaResult = {
  /** Address of the associated token account */
  ata: Address;
  /** Signature of the transaction that created or verified the ATA */
  transactionSignature: Signature;
};

/**
 * Ensures that an associated token account (ATA) exists for a given owner and mint.
 */
export async function ensureAta(
  rpc: SolanaClient["rpc"],
  sendAndConfirmTransaction: SendAndConfirmTransactionWithSignersFunction,
  params: EnsureAtaParams,
): Promise<EnsureAtaResult> {
  const { owner, mint, payer } = params;

  const signer = payer ?? (await loadKeypairSignerFromFile());

  const ata = await getAssociatedTokenAccountAddress(mint, owner, TOKEN_PROGRAM_ADDRESS);

  const { value: latestBlockhash } = await rpc.getLatestBlockhash().send();

  const ensureAtaTx = createTransaction({
    feePayer: signer,
    version: "legacy",
    instructions: [
      getCreateAssociatedTokenIdempotentInstruction({
        mint,
        owner,
        payer: signer,
        tokenProgram: TOKEN_PROGRAM_ADDRESS,
        ata,
      }),
    ],
    latestBlockhash,
  });

  const signedTransaction = await signTransactionMessageWithSigners(ensureAtaTx);

  const transactionSignature = await sendAndConfirmTransaction(signedTransaction);

  return { ata, transactionSignature };
}
