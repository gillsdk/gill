/**
 * This script demonstrates the process to add a reference key into a transaction.
 *
 * Adding reference keys to transactions allows developers to be able track the completion
 * of transactions given to users, without knowing the signature ahead of time. Then, perform
 * any desired logic after detection of the reference keyed transaction landing onchain.
 *
 * Most notably utilized within SolanaPay and Blinks.
 */
import {
  createSolanaClient,
  createTransaction,
  generateKeyPairSigner,
  getExplorerLink,
  getOldestSignatureForAddress,
  getSignatureFromTransaction,
  insertReferenceKeysToTransactionMessage,
  pipe,
  signTransactionMessageWithSigners,
} from "gill";
import { loadKeypairSignerFromFile } from "gill/node";
import { getAddMemoInstruction } from "gill/programs";

const { rpc, sendAndConfirmTransaction } = createSolanaClient({
  urlOrMoniker: "devnet",
});

const { address: reference } = await generateKeyPairSigner();

console.warn("[reference key]");
console.log(reference);

const signer = await loadKeypairSignerFromFile();

const { value: latestBlockhash } = await rpc.getLatestBlockhash().send();

/**
 * !NOTICE!
 *
 * Inserting reference keys to transactions (aka attaching addresses to instructions)
 * involves
 *
 * The SPL Memo program (`MemoSq4gqABAXKb96qnH8TysNcWxMyWCqXgDLGmfcHr`) does NOT allow
 * accounts added to its instructions unless they are actually signing the transaction.
 * Even if the address is marked as a "non-signer" on the instruction.
 *
 * Therefore, transactions must have at least one other instruction other than a Memo
 * instruction. Adding a single Compute Budget instruction can satisfy this requirement.
 */
const tx = pipe(
  createTransaction({
    feePayer: signer,
    instructions: [
      getAddMemoInstruction({
        memo: "gm world!",
      }),
    ],
    latestBlockhash,
    // setting a CU limit ensures their is at least one non-memo instruction
    computeUnitLimit: 5000,
  }),
  (tx) => insertReferenceKeysToTransactionMessage([reference], tx),
);

const signedTransaction = await signTransactionMessageWithSigners(tx);

try {
  const sig = getSignatureFromTransaction(signedTransaction);

  console.log(
    "Sending transaction:",
    getExplorerLink({
      cluster: "devnet",
      transaction: sig,
    }),
  );

  await sendAndConfirmTransaction(signedTransaction);

  console.log("Transaction confirmed!");

  const { signature } = await getOldestSignatureForAddress(rpc, reference);

  console.log("oldest signature:", signature);
  console.log(
    "does the oldest signature match the original signature:",
    sig === signature,
  );
} catch (err) {
  console.error("Unable to send and confirm the transaction");
  console.error(err);
}
