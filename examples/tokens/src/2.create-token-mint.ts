import {
  createSolanaClient,
  createTransaction,
  generateKeyPairSigner,
  getExplorerLink,
  getMinimumBalanceForRentExemption,
  getSignatureFromTransaction,
  signTransactionMessageWithSigners,
} from "gill";
import { loadKeypairSignerFromFile } from "gill/node";
import {
  getCreateAccountInstruction,
  getCreateMetadataAccountV3Instruction,
  getInitializeMintInstruction,
  getMintSize,
  getTokenMetadataAddress,
  TOKEN_PROGRAM_ADDRESS,
} from "gill/programs";

const { rpc, sendAndConfirmTransaction } = createSolanaClient({
  urlOrMoniker: "devnet",
});

const signer = await loadKeypairSignerFromFile();
console.log("signer:", signer.address);

const { value: latestBlockhash } = await rpc.getLatestBlockhash().send();

const tokenProgram = TOKEN_PROGRAM_ADDRESS;
const mint = await generateKeyPairSigner();
console.log("mint:", mint.address);

const space = getMintSize();

const metadataAddress = await getTokenMetadataAddress(mint);

/**
 * instead of manually crafting the `instructions` below and deriving addresses above:
 * you could use the `getCreateTokenInstructions()` function to simplify this code
 */
const tx = createTransaction({
  feePayer: signer,
  version: "legacy",
  instructions: [
    getCreateAccountInstruction({
      space,
      lamports: getMinimumBalanceForRentExemption(space),
      newAccount: mint,
      payer: signer,
      programAddress: tokenProgram,
    }),
    getInitializeMintInstruction(
      {
        mint: mint.address,
        mintAuthority: signer.address,
        freezeAuthority: signer.address,
        decimals: 9,
      },
      {
        programAddress: tokenProgram,
      },
    ),
    getCreateMetadataAccountV3Instruction({
      collectionDetails: null,
      isMutable: true,
      updateAuthority: signer,
      mint: mint.address,
      metadata: metadataAddress,
      mintAuthority: signer,
      payer: signer,
      data: {
        sellerFeeBasisPoints: 0,
        collection: null,
        creators: null,
        uses: null,
        name: "super sweet token",
        symbol: "SST",
        uri: "https://raw.githubusercontent.com/solana-developers/opos-asset/main/assets/Climate/metadata.json",
      },
    }),
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
