import {
  address,
  createSolanaClient,
  createTransaction,
  getExplorerLink,
  getSignatureFromTransaction,
  signTransactionMessageWithSigners,
} from "gill";
import { loadKeypairSignerFromFile } from "gill/node";
import {
  getAssociatedTokenAccountAddress,
  getCreateAssociatedTokenIdempotentInstruction,
  getTransferInstruction,
  TOKEN_PROGRAM_ADDRESS,
} from "gill/programs";

const signer = await loadKeypairSignerFromFile();

const { rpc, sendAndConfirmTransaction } = createSolanaClient({
  urlOrMoniker: "devnet", // or `mainnet`, `localnet`, etc
});

const { value: latestBlockhash } = await rpc.getLatestBlockhash().send();

const mint = address("HwxZNMkZbZMeiu9Xnmc6Rg8jYgNsJB47jwabHGUebW4F");
const tokenProgram = TOKEN_PROGRAM_ADDRESS; // use the correct program for the `mint`

const destination = address("nick6zJc6HpW3kfBm4xS2dmbuVRyb5F3AnUvj5ymzR5");
const destinationAta = await getAssociatedTokenAccountAddress(mint, destination, tokenProgram);
const sourceAta = await getAssociatedTokenAccountAddress(mint, signer, tokenProgram);

const transaction = createTransaction({
  feePayer: signer,
  version: "legacy",
  instructions: [
    // create idempotent will gracefully fail if the ata already exists. this is the gold standard!
    getCreateAssociatedTokenIdempotentInstruction({
      mint,
      payer: signer,
      tokenProgram,
      owner: destination,
      ata: destinationAta,
    }),
    getTransferInstruction({
      source: sourceAta,
      authority: signer,
      destination: destinationAta,
      amount: 1000n,
    }),
  ],
  latestBlockhash,
});

const signedTransaction = await signTransactionMessageWithSigners(transaction);

console.log(
  "Explorer:",
  getExplorerLink({
    cluster: "devnet",
    transaction: getSignatureFromTransaction(signedTransaction),
  }),
);

await sendAndConfirmTransaction(signedTransaction);
