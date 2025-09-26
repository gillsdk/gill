import {
  generateKeyPairSigner,
  getMinimumBalanceForRentExemption,
  createTransaction,
  type KeyPairSigner,
  type SolanaClient,
  type Address,
  signTransactionMessageWithSigners,
  SendAndConfirmTransactionWithSignersFunction,
  Signature,
} from "gill";
import { loadKeypairSignerFromFile } from "gill/node";
import {
  getCreateAccountInstruction,
  getInitializeMintInstruction,
  getMintSize,
  TOKEN_PROGRAM_ADDRESS,
} from "gill/programs";

/**
 * Parameters for creating a new token mint.
 */
type CreateMintParams = {
  /** Number of decimals for the token (default: 9) */
  decimals?: number;
  /** Authority allowed to mint new tokens (defaults to fee payer) */
  mintAuthority?: KeyPairSigner;
  /** Authority allowed to freeze token accounts (defaults to fee payer) */
  freezeAuthority?: KeyPairSigner;
};

/**
 * Result returned when creating a new mint.
 */
type CreateMintResult = {
  /** Address of the newly created mint */
  mintAddress: Address;
  /** Signature of the transaction that created the mint */
  transactionSignature: Signature;
};

/**
 * Creates a new SPL token mint.
 *
 * This function handles:
 * - Generating a new keypair for the mint account
 * - Calculating required lamports for rent exemption
 * - Creating and initializing the mint with specified decimals, mint authority, and freeze authority
 * - Sending and confirming the transaction
 *
 * @param rpc - Solana RPC client
 * @param sendAndConfirmTransaction - Function to send and confirm signed transactions
 * @param params - Optional parameters for decimals, mint authority, and freeze authority
 * @returns CreateMintResult object containing the mint address and transaction signature
 *
 * @example
 * const { mintAddress, transactionSignature } = await createMint(rpc, sendAndConfirmTransaction, { decimals: 6 });
 */
export async function createMint(
  rpc: SolanaClient["rpc"],
  sendAndConfirmTransaction: SendAndConfirmTransactionWithSignersFunction,
  params: CreateMintParams = {},
): Promise<CreateMintResult> {
  try {
    // Load the default signer from local keypair file
    const signer = await loadKeypairSignerFromFile();

    // Use provided options or defaults
    const decimals = params.decimals ?? 9;
    const mintAuthority = params.mintAuthority ?? signer;
    const freezeAuthority = params.freezeAuthority ?? signer;

    // Generate a new keypair for the mint
    const mint = await generateKeyPairSigner();

    // Calculate space required for mint account
    const space = getMintSize();

    // Get the latest blockhash for transaction
    const { value: latestBlockhash } = await rpc.getLatestBlockhash().send();

    // Create transaction with instructions to create and initialize the mint
    const createMintTx = createTransaction({
      feePayer: signer,
      version: "legacy",
      instructions: [
        getCreateAccountInstruction({
          space,
          lamports: getMinimumBalanceForRentExemption(space),
          newAccount: mint,
          payer: signer,
          programAddress: TOKEN_PROGRAM_ADDRESS,
        }),
        getInitializeMintInstruction(
          {
            mint: mint.address,
            mintAuthority: mintAuthority.address,
            freezeAuthority: freezeAuthority.address,
            decimals,
          },
          {
            programAddress: TOKEN_PROGRAM_ADDRESS,
          },
        ),
      ],
      latestBlockhash,
    });

    // Sign the transaction with all required signers
    const signedTransaction = await signTransactionMessageWithSigners(createMintTx);

    // Send and confirm the transaction
    const transactionSignature = await sendAndConfirmTransaction(signedTransaction);

    return { mintAddress: mint.address, transactionSignature };
  } catch (error: unknown) {
    // Provide descriptive error messages for easier debugging
    if (error instanceof Error) {
      throw new Error(`createMint failed: ${error.message}`);
    }
    throw new Error("createMint failed: Unknown error");
  }
}
