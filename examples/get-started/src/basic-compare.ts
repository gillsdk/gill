/**
 * The purpose of this script is to compare some of the differences
 * of using `gill` as a single entrypoint vs `@solana/kit`
 * (and the various `@solana-program/*` packages).
 *
 * This script is the `@solana/kit` version of the comparison.
 * See the `gill` version in the ./basic.ts file
 */
import {
  getSetComputeUnitLimitInstruction,
  getSetComputeUnitPriceInstruction,
} from "@solana-program/compute-budget";
import { getAddMemoInstruction } from "@solana-program/memo";
import {
  appendTransactionMessageInstructions,
  createKeyPairFromBytes,
  createSignerFromKeyPair,
  createSolanaRpc,
  createSolanaRpcSubscriptions,
  createTransactionMessage,
  devnet,
  getSignatureFromTransaction,
  pipe,
  sendAndConfirmTransactionFactory,
  setTransactionMessageFeePayerSigner,
  setTransactionMessageLifetimeUsingBlockhash,
  signTransactionMessageWithSigners,
} from "@solana/kit";
import { readFileSync } from "node:fs";
import { homedir } from "node:os";
import { resolve } from "node:path";

const rpc = createSolanaRpc(devnet("https://api.devnet.solana.com"));

const rpcSubscriptions = createSolanaRpcSubscriptions(
  devnet("wss://api.devnet.solana.com"),
);

const sendAndConfirmTransaction = sendAndConfirmTransactionFactory({
  rpc,
  rpcSubscriptions,
});

const { value: latestBlockhash } = await rpc.getLatestBlockhash().send();

const keypairFilePath = "~/.config/solana/id.json";

const resolvedKeypairPath = resolve(keypairFilePath.replace("~", homedir()));

const keypair = await createKeyPairFromBytes(
  Uint8Array.from(JSON.parse(readFileSync(resolvedKeypairPath, "utf8"))),
);

const signer = await createSignerFromKeyPair(keypair);

const tx = pipe(
  createTransactionMessage({ version: "legacy" }),
  (tx) => setTransactionMessageFeePayerSigner(signer, tx),
  (tx) => setTransactionMessageLifetimeUsingBlockhash(latestBlockhash, tx),
  (tx) =>
    appendTransactionMessageInstructions(
      [
        getAddMemoInstruction({
          memo: "gm world!",
        }),
        getSetComputeUnitLimitInstruction({ units: 5000 }),
        getSetComputeUnitPriceInstruction({ microLamports: 1000 }),
      ],
      tx,
    ),
);

const signedTransaction = await signTransactionMessageWithSigners(tx);

try {
  console.log(
    "Sending transaction:",
    `https://explorer.solana.com/tx/${getSignatureFromTransaction(signedTransaction)}?cluster=devnet`,
  );

  await sendAndConfirmTransaction(signedTransaction, {
    commitment: "confirmed",
  });

  console.log("Transaction confirmed!");
} catch (err) {
  console.error("Unable to send and confirm the transaction");
  console.error(err);
}
