import {
  createSolanaClient,
  generateKeyPairSigner,
  getExplorerLink,
  getSignatureFromTransaction,
  signTransactionMessageWithSigners,
} from "gill";
import { loadKeypairSignerFromFile } from "gill/node";
import { buildCreateTokenTransaction, TOKEN_2022_PROGRAM_ADDRESS } from "gill/programs";

const { rpc, sendAndConfirmTransaction } = createSolanaClient({
  urlOrMoniker: "devnet",
});

const signer = await loadKeypairSignerFromFile();
console.log("signer:", signer.address);

const { value: latestBlockhash } = await rpc.getLatestBlockhash().send();

const tokenProgram = TOKEN_2022_PROGRAM_ADDRESS;
const mint = await generateKeyPairSigner();
console.log("mint:", mint.address);

const tx = await buildCreateTokenTransaction({
  feePayer: signer,
  version: "legacy",
  decimals: 9,
  metadata: {
    isMutable: true,
    name: "super sweet token",
    symbol: "SST",
    uri: "https://raw.githubusercontent.com/solana-developers/opos-asset/main/assets/Climate/metadata.json",
  },
  mint,
  latestBlockhash,
  // defaults to `TOKEN_PROGRAM_ADDRESS`
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
