import {
  Address,
  createTransaction,
  SendAndConfirmTransactionWithSignersFunction,
  signTransactionMessageWithSigners,
  SolanaClient,
  Signature,
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
 *
 * This function handles:
 * - Computing the ATA address
 * - Creating the ATA if it does not already exist (idempotent)
 * - Sending and confirming the transaction
 *
 * @param rpc - Solana RPC client
 * @param sendAndConfirmTransaction - Function to send and confirm signed transactions
 * @param params - Object containing `owner` and `mint` addresses
 * @returns EnsureAtaResult object containing the ATA address and transaction signature
 *
 * @example
 * const { ata, transactionSignature } = await ensureAta(rpc, sendAndConfirmTransaction, { owner: userAddress, mint: tokenMint });
 */
export async function ensureAta(
  rpc: SolanaClient["rpc"],
  sendAndConfirmTransaction: SendAndConfirmTransactionWithSignersFunction,
  { owner, mint }: EnsureAtaParams,
): Promise<EnsureAtaResult> {
  try {
    // Load the default signer from local keypair file
    const signer = await loadKeypairSignerFromFile();

    // Compute the associated token account (ATA) address for the owner and mint
    const ata = await getAssociatedTokenAccountAddress(mint, owner, TOKEN_PROGRAM_ADDRESS);

    // Fetch the latest blockhash to use in the transaction
    const { value: latestBlockhash } = await rpc.getLatestBlockhash().send();

    // Create a transaction with a single instruction to create the ATA idempotently
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

    // Sign the transaction with the fee payer
    const signedTransaction = await signTransactionMessageWithSigners(ensureAtaTx);

    // Send and confirm the transaction on-chain
    const transactionSignature = await sendAndConfirmTransaction(signedTransaction);

    // Return the ATA address and transaction signature
    return { ata, transactionSignature };
  } catch (error: unknown) {
    if (error instanceof Error) {
      throw new Error(`ensureAta failed: ${error.message}`);
    }
    throw new Error("ensureAta failed: Unknown error");
  }
}
