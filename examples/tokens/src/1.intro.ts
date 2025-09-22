import {
  createSolanaClient,
  createTransaction,
  getExplorerLink,
  getSignatureFromTransaction,
  signTransactionMessageWithSigners,
  SolanaClusterMoniker,
} from "gill";
import { loadKeypairSignerFromFile } from "gill/node";
import { getAddMemoInstruction } from "gill/programs";

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
 * Create a memo instruction to post a simple message onchain
 * (the simplest of instruction types!)
 */
const memoIx = getAddMemoInstruction({
  memo: "gm world!",
});

/**
 * Get the latest blockhash (aka transaction lifetime). This acts as a recent timestamp
 * for the blockchain to key on when processing your transaction
 *
 * Pro tip: only request this value just before you are going to use it your code
 */
const { value: latestBlockhash } = await rpc.getLatestBlockhash().send();
console.log("latestBlockhash:", latestBlockhash);

/**
 * Create a transaction to be sent to the blockchain
 */
let tx = createTransaction({
  version: "legacy",
  feePayer: signer,
  instructions: [memoIx],
  latestBlockhash,
});
console.log("Transaction:");
console.log(tx);

/**
 * Sign the transaction with the provided `signer` when it was created
 */
let signedTransaction = await signTransactionMessageWithSigners(tx);
console.log("signedTransaction:");
console.log(signedTransaction);

/**
 * Get the transaction signature after it has been signed by the `feePayer`
 */
let signature = getSignatureFromTransaction(signedTransaction);

/**
 * Log the Solana Explorer link for the
 */
console.log("Explorer Link:");
console.log(
  getExplorerLink({
    cluster,
    transaction: signature,
  }),
);

try {
  /**
   * Actually send the transaction to the blockchain and confirm it
   */
  await sendAndConfirmTransaction(signedTransaction);

  // you can also manually define additional settings for sending your transaction
  // await sendAndConfirmTransaction(signedTransaction, {
  //   commitment: "confirmed",
  //   skipPreflight: true,
  //   maxRetries: 10n,
  // });

  console.log("Transaction confirmed!", signature);
} catch (err) {
  console.error("Unable to send and confirm the transaction");
  console.error(err);
}
