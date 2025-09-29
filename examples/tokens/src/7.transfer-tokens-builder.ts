import {
  address,
  createSolanaClient,
  getExplorerLink,
  getSignatureFromTransaction,
  signTransactionMessageWithSigners,
} from "gill";
import { loadKeypairSignerFromFile } from "gill/node";
import { buildTransferTokensTransaction, TOKEN_PROGRAM_ADDRESS } from "gill/programs";

const { rpc, sendAndConfirmTransaction } = createSolanaClient({
  urlOrMoniker: "devnet",
});

const signer = await loadKeypairSignerFromFile();

const { value: latestBlockhash } = await rpc.getLatestBlockhash().send();

const mint = address("HwxZNMkZbZMeiu9Xnmc6Rg8jYgNsJB47jwabHGUebW4F");
const tokenProgram = TOKEN_PROGRAM_ADDRESS; // use the correct program for the `mint`

const destination = address("7sZoCrE3cGgEpNgxcPnGffDeWfTewKnk6wWdLxmYA7Cy");

const tx = await buildTransferTokensTransaction({
  feePayer: signer,
  version: "legacy",
  latestBlockhash,
  amount: 1_000_000,
  authority: signer,
  destination: destination,
  mint,
  tokenProgram,
});

const signedTransaction = await signTransactionMessageWithSigners(tx);

console.log(
  "Explorer:",
  getExplorerLink({
    cluster: "devnet",
    transaction: getSignatureFromTransaction(signedTransaction),
  }),
);

await sendAndConfirmTransaction(signedTransaction);
