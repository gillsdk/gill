/**
 * The purpose of this script is to compare some of the differences
 * of using `gill` as a single entrypoint vs `@solana/kit`
 * (and the various `@solana-program/*` packages).
 *
 * This script is the `gill` version of the comparison.
 * See the `@solana/kit` version in the ./basic-compare.ts file
 */
import {
  createSolanaClient,
  createTransaction,
  getExplorerLink,
  getSignatureFromTransaction,
  signTransactionMessageWithSigners,
} from "gill";
import { loadKeypairSignerFromFile } from "gill/node";
import { getAddMemoInstruction } from "gill/programs";

const { rpc, sendAndConfirmTransaction } = createSolanaClient({
  urlOrMoniker: "devnet",
});

const { value: latestBlockhash } = await rpc.getLatestBlockhash().send();

const signer = await loadKeypairSignerFromFile();

const tx = createTransaction({
  feePayer: signer,
  instructions: [
    getAddMemoInstruction({
      memo: "gm world!",
    }),
  ],
  latestBlockhash,
  computeUnitLimit: 5000,
  computeUnitPrice: 1000,
});

const signedTransaction = await signTransactionMessageWithSigners(tx);

try {
  console.log(
    "Sending transaction:",
    getExplorerLink({
      cluster: "devnet",
      transaction: getSignatureFromTransaction(signedTransaction),
    }),
  );

  await sendAndConfirmTransaction(signedTransaction);

  console.log("Transaction confirmed!");
} catch (err) {
  console.error("Unable to send and confirm the transaction");
  console.error(err);
}
