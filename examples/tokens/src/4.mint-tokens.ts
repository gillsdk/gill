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
  getMintToInstruction,
  TOKEN_PROGRAM_ADDRESS,
} from "gill/programs";

const { rpc, sendAndConfirmTransaction } = createSolanaClient({
  urlOrMoniker: "devnet",
});

const signer = await loadKeypairSignerFromFile();
console.log("signer:", signer.address);

const { value: latestBlockhash } = await rpc.getLatestBlockhash().send();

const mint = address("HwxZNMkZbZMeiu9Xnmc6Rg8jYgNsJB47jwabHGUebW4F");

const owner = address("nicktrLHhYzLmoVbuZQzHUTicd2sfP571orwo9jfc8c");

const ata = await getAssociatedTokenAccountAddress(mint, owner, TOKEN_PROGRAM_ADDRESS);

const tx = createTransaction({
  feePayer: signer,
  version: "legacy",
  instructions: [
    getCreateAssociatedTokenIdempotentInstruction({
      mint,
      owner,
      payer: signer,
      tokenProgram: TOKEN_PROGRAM_ADDRESS,
      ata,
    }),
    getMintToInstruction(
      {
        mint,
        mintAuthority: signer,
        token: ata,
        amount: 1_000_000_000,
      },
      {
        programAddress: TOKEN_PROGRAM_ADDRESS,
      },
    ),
  ],
  latestBlockhash,
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
