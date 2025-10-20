import {
  generateKeyPairSigner,
  getMinimumBalanceForRentExemption,
  createTransaction,
  type KeyPairSigner,
  type SolanaClient,
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
  /**
   * Optional fee payer for account creation and transaction fees.
   * Defaults to loading a local keypair via `loadKeypairSignerFromFile()`.
   * Also used as default mint/freeze authority if not provided.
   */
  payer?: KeyPairSigner;
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
  /** The new mint account (keypair) */
  mint: KeyPairSigner;
  /** Signature of the transaction that created the mint */
  transactionSignature: Signature;
};

/**
 * Creates a new SPL token mint.
 *
 * This function handles:
 * - Generating a new mint account
 * - Creating the mint account on-chain with the required rent-exempt balance
 * - Initializing the mint with specified decimals, mint authority, and freeze authority
 *
 * @param rpc - Solana RPC client
 * @param sendAndConfirmTransaction - Function to send and confirm signed transactions
 * @param params - Object containing:
 *   - payer: Optional fee payer for account creation and transaction fees. Defaults to a local keypair.
 *   - decimals: Number of decimals for the token (default: 9)
 *   - mintAuthority: Authority allowed to mint new tokens (defaults to payer if not provided)
 *   - freezeAuthority: Authority allowed to freeze token accounts (defaults to payer if not provided)
 *
 * @returns CreateMintResult containing:
 *   - mint: The new mint account (keypair)
 *   - transactionSignature: Signature of the transaction that created the mint
 *
 * @example
 * const { mint, transactionSignature } = await createMint(
 *   rpc,
 *   sendAndConfirmTransaction,
 *   {
 *     payer: userSigner,
 *     decimals: 6,
 *     mintAuthority: myMintAuthority,
 *     freezeAuthority: myFreezeAuthority
 *   }
 * );
 */
export async function createMint(
  rpc: SolanaClient["rpc"],
  sendAndConfirmTransaction: SendAndConfirmTransactionWithSignersFunction,
  params: CreateMintParams = {},
): Promise<CreateMintResult> {
  const { payer, decimals = 9, mintAuthority, freezeAuthority } = params;

  const signer = payer ?? (await loadKeypairSignerFromFile());

  if (decimals < 0 || decimals > 9) {
    throw new Error(`Invalid decimals value: ${decimals}. Must be between 0 and 9.`);
  }

  const mintAuth = mintAuthority ?? signer;
  const freezeAuth = freezeAuthority ?? signer;

  const mint = await generateKeyPairSigner();
  const space = getMintSize();

  const { value: latestBlockhash } = await rpc.getLatestBlockhash().send();

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
          mintAuthority: mintAuth.address,
          freezeAuthority: freezeAuth.address,
          decimals,
        },
        { programAddress: TOKEN_PROGRAM_ADDRESS },
      ),
    ],
    latestBlockhash,
  });

  const signedTransaction = await signTransactionMessageWithSigners(createMintTx);
  const transactionSignature = await sendAndConfirmTransaction(signedTransaction);

  return { mint, transactionSignature };
}
