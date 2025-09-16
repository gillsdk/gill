import {
  address,
  createSolanaClient,
  generateKeyPairSigner,
  getExplorerLink,
  getSignatureFromTransaction,
  signTransactionMessageWithSigners,
  SolanaClusterMoniker,
} from "gill";
import { loadKeypairSignerFromFile } from "gill/node";
import {
  buildCreateTokenTransaction,
  buildMintTokensTransaction,
  buildTransferTokensTransaction,
  getAssociatedTokenAccountAddress,
  TOKEN_2022_PROGRAM_ADDRESS,
} from "gill/programs";

/** Turn on debug mode */
global.__GILL_DEBUG__ = true;

/** Set the debug mode log level (default: `info`) */
global.__GILL_DEBUG_LEVEL__ = "debug";

/**
 * With debug mode enabled and the log level of `debug`:
 *
 * `sendAndConfirmTransaction` will now auto log the following:
 * - explorer link to view the transaction
 * - serialized base64 transaction, to inspect on the Solana Explorer's Inspector
 *   https://explorer.solana.com/tx/inspector
 *
 * This can greatly assist troubleshooting efforts
 */

/**
 * Load a keypair signer from the local filesystem
 *
 * This defaults to the file path used by the Solana CLI: `~/.config/solana/id.json`
 */
const signer = await loadKeypairSignerFromFile();
console.log("address:", signer.address);

/**
 * Declare what Solana network cluster we want our code to interact with
 */
const cluster: SolanaClusterMoniker = "devnet";

/**
 * Create a client connection to the Solana blockchain
 *
 * Note: `urlOrMoniker` can be either a Solana network moniker or a full URL of your RPC provider
 */
const { rpc, sendAndConfirmTransaction } = createSolanaClient({
  urlOrMoniker: cluster,
});

/**
 * Declare our token mint and desired token program
 */
const tokenProgram = TOKEN_2022_PROGRAM_ADDRESS;
// const tokenProgram = TOKEN_PROGRAM_ADDRESS;
const mint = await generateKeyPairSigner();

/**
 * Get the latest blockhash (aka transaction lifetime). This acts as a recent timestamp
 * for the blockchain to key on when processing your transaction
 *
 * Pro tip: only request this value just before you are going to use it your code
 */
const { value: latestBlockhash } = await rpc.getLatestBlockhash().send();
console.log("latestBlockhash:", latestBlockhash);

/**
 * Create a transaction that will create a new token (with metadata)
 *
 * - this will use the original SPL token by default (`TOKEN_PROGRAM_ADDRESS`)
 */
const createTokenTx = await buildCreateTokenTransaction({
  feePayer: signer,
  latestBlockhash,
  mint,
  // mintAuthority, // default=same as the `feePayer`
  metadata: {
    isMutable: true, // if the `updateAuthority` can change this metadata in the future
    name: "Only Possible On Solana",
    symbol: "OPOS",
    uri: "https://raw.githubusercontent.com/solana-developers/opos-asset/main/assets/Climate/metadata.json",
  },
  // updateAuthority, // default=same as the `feePayer`
  decimals: 2, // default=9,
  tokenProgram, // default=TOKEN_PROGRAM_ADDRESS, token22 also supported
  // default cu limit set to be optimized, but can be overridden here
  // computeUnitLimit?: number,
  // obtain from your favorite priority fee api
  // computeUnitPrice?: number, // no default set
});

/**
 * Sign the transaction with the provided `signer` from when it was created
 */
let signedTransaction = await signTransactionMessageWithSigners(createTokenTx);
console.log("signedTransaction:");
console.log(signedTransaction);

/**
 * Get the transaction signature after it has been signed by the `feePayer`
 */
let signature = getSignatureFromTransaction(signedTransaction);

/**
 * Log the Solana Explorer link for the transaction we are about to send
 */
console.log("\nExplorer Link (for creating the mint):");
console.log(
  getExplorerLink({
    cluster,
    transaction: signature,
  }),
);

/**
 * Actually send the transaction to the blockchain and confirm it
 */
await sendAndConfirmTransaction(signedTransaction);

/**
 * Declare the wallet address that we want to mint the tokens to
 */
const mintToDestination = address(
  "nicktrLHhYzLmoVbuZQzHUTicd2sfP571orwo9jfc8c",
);

/**
 * Create a transaction that mints new tokens to the `destination` wallet address
 * (raising the token's overall supply)
 *
 * - be sure to use the correct token program that the `mint` was created with
 * - ensure the `mintAuthority` is the correct signer in order to actually mint new tokens
 */
const mintTokensTx = await buildMintTokensTransaction({
  feePayer: signer,
  latestBlockhash,
  mint,
  mintAuthority: signer,
  amount: 2000, // note: be sure to consider the mint's `decimals` value
  // if decimals=2 => this will mint 20.00 tokens
  // if decimals=4 => this will mint 0.200 tokens
  destination: mintToDestination,
  // use the correct token program for the `mint`
  tokenProgram, // default=TOKEN_PROGRAM_ADDRESS
  // default cu limit set to be optimized, but can be overridden here
  // computeUnitLimit?: number,
  // obtain from your favorite priority fee api
  // computeUnitPrice?: number, // no default set
});

console.log("Transaction to mint tokens:");
console.log(mintTokensTx);

/**
 * Sign the transaction with the provided `signer` from when it was created
 */
signedTransaction = await signTransactionMessageWithSigners(mintTokensTx);
signature = getSignatureFromTransaction(signedTransaction);

console.log(
  "\nExplorer Link (for minting the tokens to the destination wallet):",
);
console.log(
  getExplorerLink({
    cluster,
    transaction: signature,
  }),
);

await sendAndConfirmTransaction(signedTransaction);

/**
 * Get the token balance of a wallet's associated token account (ata)
 *
 * In this case, we are checking our original wallet's ata
 */
let { value: postMintBalance } = await rpc
  .getTokenAccountBalance(
    await getAssociatedTokenAccountAddress(
      mint,
      mintToDestination,
      tokenProgram,
    ),
  )
  .send();

console.log(
  "token balance after minting to 'mintToDestination':",
  postMintBalance,
);

/**
 * We will generate a new, random wallet in order to show that this wallet's ata
 * will be automatically created during the token transfer transaction
 */
const transferToDestination = await generateKeyPairSigner();
console.log("transfer to destination:", transferToDestination.address);

/**
 * The `authority` address that can authorize the token transfer.
 * This is usually the user's wallet or the delegated authority
 */
const authority = address("7sZoCrE3cGgEpNgxcPnGffDeWfTewKnk6wWdLxmYA7Cy");

/**
 * Create a transaction that mints new tokens to the `destination` wallet address
 * (raising the token's overall supply)
 *
 * - be sure to use the correct token program that the `mint` was created with
 * - ensure the `mintAuthority` is the correct signer in order to actually mint new tokens
 */
const transferTokensTx = await buildTransferTokensTransaction({
  feePayer: signer,
  latestBlockhash,
  mint,
  authority,
  amount: 900, // note: be sure to consider the mint's `decimals` value
  // if decimals=2 => this will mint 9.00 tokens
  // if decimals=4 => this will mint 0.090 tokens
  destination: transferToDestination,
  // use the correct token program for the `mint`
  tokenProgram, // default=TOKEN_PROGRAM_ADDRESS
  // default cu limit set to be optimized, but can be overridden here
  // computeUnitLimit?: number,
  // obtain from your favorite priority fee api
  // computeUnitPrice?: number, // no default set
});

/**
 * Sign the transaction with the provided `signer` from when it was created
 */
signedTransaction = await signTransactionMessageWithSigners(transferTokensTx);
signature = getSignatureFromTransaction(signedTransaction);

console.log("\nExplorer Link (for transferring tokens to the new wallet):");
console.log(
  getExplorerLink({
    cluster,
    transaction: signature,
  }),
);

// process.exit();

await sendAndConfirmTransaction(signedTransaction);

/**
 * Now that we have transferred tokens FROM the source (in this example, the `signer`),
 * we can check this wallets current balance by deriving the ATA
 */

const sourceAta = await getAssociatedTokenAccountAddress(
  mint,
  authority,
  tokenProgram,
);
const { value: updatedBalance } = await rpc
  .getTokenAccountBalance(sourceAta)
  .send();

console.log("new token balance for original source/authority", updatedBalance);

/**
 * We can also check the destination wallet's balance,
 * including that their ATA was created automatically!
 */
const destinationAta = await getAssociatedTokenAccountAddress(
  mint,
  transferToDestination,
  tokenProgram,
);

const { value: destinationWalletBalance } = await rpc
  .getTokenAccountBalance(destinationAta)
  .send();

console.log("token balance for destination wallet:", destinationWalletBalance);

console.log("Complete.");
