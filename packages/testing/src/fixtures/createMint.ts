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
 */
export default async function createMint(
  rpc: SolanaClient["rpc"],
  sendAndConfirmTransaction: SendAndConfirmTransactionWithSignersFunction,
  params: CreateMintParams = {},
): Promise<CreateMintResult> {
  const { payer, decimals = 9, mintAuthority, freezeAuthority } = params;

  // Use payer or load local keypair
  const signer = payer ?? (await loadKeypairSignerFromFile());

  if (decimals < 0 || decimals > 9) {
    throw new Error(`Invalid decimals value: ${decimals}. Must be between 0 and 9.`);
  }

  // Use signer as default authority if not provided
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
