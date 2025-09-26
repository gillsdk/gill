import type { 
  Lamports, 
  SendAndConfirmTransactionWithSignersFunction, 
  Signature 
} from "gill";
import { 
  createTransaction, 
  signTransactionMessageWithSigners, 
  type Address, 
  type SolanaClient
 } from "gill";
 import { 
   getAssociatedTokenAccountAddress, 
   getMintToInstruction, 
   TOKEN_PROGRAM_ADDRESS } from "gill/programs";
   import { loadKeypairSignerFromFile } from "gill/node";
import { ensureAta } from "./ensureAta.js";

/**
 * Parameters required to mint tokens to an owner.
 */
type MintToParams = {
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
 *
 * This function handles:
 * - Ensuring the associated token account exists (if `ensureAta` is true)
 * - Creating the mint-to instruction
 * - Signing and sending the transaction
 *
 * @param rpc - Solana RPC client
 * @param sendAndConfirmTransaction - Function to send and confirm signed transactions
 * @param params - Object containing mint, toOwner, amount, and optional ensureAta
 * @returns MintToResult object containing the ATA address, transaction signature, and minted amount
 *
 * @example
 * const { ata, transactionSignature, mintedAmount } = await mintTo(rpc, sendAndConfirmTransaction, {
 *   mint: tokenMint,
 *   toOwner: userAddress,
 *   amount: lamports(1000),
 * });
 */
export async function mintTo(
  rpc: SolanaClient["rpc"],
  sendAndConfirmTransaction: SendAndConfirmTransactionWithSignersFunction,
  { mint, toOwner, amount, ensureAta: shouldEnsureAta = true }: MintToParams,
): Promise<MintToResult> {
  try {
    // Load the default signer from local keypair file
    const signer = await loadKeypairSignerFromFile();

    // Determine the associated token account (ATA) for the owner
    let ata: Address;
    if (shouldEnsureAta) {
      // Ensure the ATA exists, create it if necessary
      const { ata: ensuredAta } = await ensureAta(rpc, sendAndConfirmTransaction, {
        owner: toOwner,
        mint,
      });
      ata = ensuredAta;
    } else {
      // Compute ATA without creating it
      ata = await getAssociatedTokenAccountAddress(mint, toOwner, TOKEN_PROGRAM_ADDRESS);
    }

    // Fetch the latest blockhash for the transaction
    const { value: latestBlockhash } = await rpc.getLatestBlockhash().send();

    // Create the mint-to transaction
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
          {
            programAddress: TOKEN_PROGRAM_ADDRESS,
          },
        ),
      ],
      latestBlockhash,
    });

    // Sign the transaction
    const signedTransaction = await signTransactionMessageWithSigners(mintToTx);

    // Send and confirm the transaction
    const transactionSignature = await sendAndConfirmTransaction(signedTransaction);

    // Return the ATA, signature, and minted amount
    return {
      ata,
      transactionSignature,
      mintedAmount: amount,
    };
  } catch (error: unknown) {
    if (error instanceof Error) {
      throw new Error(`MintTo failed: ${error.message}`);
    }
    throw new Error("MintTo failed: Unknown error");
  }
}
