/**
 * This script demonstrates how to use Gill to interact with a smart contract
 * deployed on a MagicBlock Ephemeral Rollup.
 *
 * In this example, we’ll connect to the MagicBlock counter program:
 * - Initialize a new counter pda
 * - Send a transaction to increment the counter
 * - Fetch the current counter value (should be 1)
 * - Delegate the counter
 * - Send a transaction to increment and commit the counter
 * - Fetch and log the updated value
 * - And finally undelegate the counter pda
 *
 * Learn more about the counter program here:
 * https://docs.magicblock.gg/pages/get-started/how-integrate-your-program/anchor
 */
import { 
    delegateBufferPdaFromDelegatedAccountAndOwnerProgram, 
    DELEGATION_PROGRAM_ID, 
    delegationMetadataPdaFromDelegatedAccount, 
    delegationRecordPdaFromDelegatedAccount, 
    MAGIC_CONTEXT_ID, 
    MAGIC_PROGRAM_ID
} from "@magicblock-labs/ephemeral-rollups-sdk";
import { PublicKey } from "@solana/web3.js";
import { 
    address,
    createSolanaClient, 
    createTransaction, 
    devnet, 
    getBase58Codec,
    getBytesEncoder, 
    getExplorerLink, 
    getProgramDerivedAddress, 
    getSignatureFromTransaction, 
    signTransactionMessageWithSigners 
} from "gill";
import { loadKeypairSignerFromFile } from "gill/node";
import { SYSTEM_PROGRAM_ADDRESS } from "gill/programs";

import * as programClient from "./clients/js/src/generated/index"

// Get the user kp 
const user = await loadKeypairSignerFromFile(); 

// Create a client connection to the Solana blochchain devnet
const {rpc, sendAndConfirmTransaction} = createSolanaClient({urlOrMoniker: "devnet"});

// Create a client connection to the MagicBlock devnet
const {
    rpc: mbRpc, 
    sendAndConfirmTransaction: sendAndConfirmMagicblockTransaction
} = createSolanaClient({urlOrMoniker: devnet("https://devnet.magicblock.app")});

// Get counter pda
const encoderString = getBytesEncoder()
const [counterPda, _] = await getProgramDerivedAddress({
    programAddress: programClient.ANCHOR_COUNTER_PROGRAM_ADDRESS,
    seeds: [encoderString.encode(Buffer.from("test-pda", "utf-8"))]
});

console.log("Program ID:", programClient.ANCHOR_COUNTER_PROGRAM_ADDRESS);
console.log("Counter PDA:", counterPda);

/**
 * First we initialize a new counter pda
 * 
 * NOTE: Since it's the anchor IDL being used in this demo the seed can only be 'test-pda'
 */

// Create initialize instruction
const initIx = programClient.getInitializeInstruction({
    counter: counterPda,
    systemProgram: SYSTEM_PROGRAM_ADDRESS,
    user,
});

// Get latest blockhash
let { value: latestBlockhash } = await rpc.getLatestBlockhash().send();

// Create initialize transaction
let tx = createTransaction({
    feePayer: user,
    instructions: [initIx],
    latestBlockhash
});

// Sign and send transaction
let signedTx = await signTransactionMessageWithSigners(tx);
let signature = getSignatureFromTransaction(signedTx);

await sendAndConfirmTransaction(signedTx);

console.log("Counter PDA initialized successfully");
console.log(getExplorerLink({
    cluster: "devnet",
    transaction: signature, 
}));

/**
 * Next we increment the count on the base chain utilizing magic-router-rpc
 * 
 * This is to demonstrate magic-router's ability to decide where best to forward
 * transactions
 */

// Create increment transaction
const incrementIx = programClient.getIncrementInstruction({
    counter: counterPda,
});

// Get latest blockhash
latestBlockhash = (await rpc.getLatestBlockhash().send()).value;

// Create increment transaction
tx = createTransaction({
    feePayer: user,
    instructions: [incrementIx],
    latestBlockhash
});

// Sign and send transaction
signedTx = await signTransactionMessageWithSigners(tx);
signature = getSignatureFromTransaction(signedTx);

await sendAndConfirmTransaction(signedTx);

console.log("Counter incremented successfully");
console.log(getExplorerLink({
    cluster: "devnet",
    transaction: signature, 
}));

/**
 * Next we fetch the current count on the pda
 */

// Create base58 codec for encoding and decoding account data
const codec = getBase58Codec();

// Fetch account info
const {value: account} = await rpc.getAccountInfo(counterPda, { commitment: "confirmed" }).send();
if (!account) {
    throw `Failed to read data in account: ${counterPda}`
}

// account.data is Base58EncodedBytes 
// Decode it into a Uint8Array
let account_bytes = codec.encode(account.data);

const counter_decoder =  programClient.getCounterDecoder();
let info = counter_decoder.read(account_bytes, 0);

// Count should be 1 as this is a newly initialized account that has only been
// incremented once
console.log("Initial Count:",info[0].count); 

/**
 * Next we delegate the counter pda to MagicBlock ephemeral rollup
 * 
 * Magicblock's sdk and magic-router-sdk do not support @solana/kit yet so
 * we have to go through the trouble of trying to bridge things here
 */

// Convert and get relevant addresses for instruction
const counterPdaPubkey = new PublicKey(counterPda.toString());
const programIdPubkey = new PublicKey(programClient.ANCHOR_COUNTER_PROGRAM_ADDRESS.toString());
const delegationProgram = address(DELEGATION_PROGRAM_ID.toBase58());
const delegationMetadataPda = address(delegationMetadataPdaFromDelegatedAccount(counterPdaPubkey).toBase58());
const delegationRecordPda = address(delegationRecordPdaFromDelegatedAccount(counterPdaPubkey).toBase58());
const delegationBufferPda = address(
    delegateBufferPdaFromDelegatedAccountAndOwnerProgram(counterPdaPubkey, programIdPubkey).toBase58()
);

// Create delegate ix
const delegateIx = programClient.getDelegateInstruction({
    bufferPda: delegationBufferPda,
    delegationMetadataPda,
    delegationProgram,
    delegationRecordPda,
    payer: user,
    pda: counterPda,
});

latestBlockhash = (await rpc.getLatestBlockhash().send()).value;

// Create delegate transaction
tx = createTransaction({
    feePayer: user,
    instructions: [delegateIx],
    latestBlockhash
});

// Sign and send transaction
signedTx = await signTransactionMessageWithSigners(tx);
signature = getSignatureFromTransaction(signedTx);

await sendAndConfirmTransaction(signedTx);

console.log("Counter Delegated successfully");
console.log(getExplorerLink({
    cluster: "devnet",
    transaction: signature, 
}));

/**
 * Now we increment and commit the count
 * 
 * We chose increment and commit so we can easily fetch the updated
 * state from the base chain. 
 * 
 * Also, while counter pda is delegated, we have to ensure that we do not use
 * the rpc or sendAndConfirmTransaction targeting the base layer, but instead
 * the one targeting MagicBlock's devnet. This holds until the counter pda is
 * undelegated
 */

// First we create the increment and commit instruction
const incrementAndCommitIx = programClient.getIncrementAndCommitInstruction({
    counter: counterPda,
    magicContext: address(MAGIC_CONTEXT_ID.toBase58()),
    magicProgram: address(MAGIC_PROGRAM_ID.toBase58()),
    payer: user,
})

// Get latest blockhash
let blockhash = (await mbRpc.getLatestBlockhash().send()).value;

// Create increment and commit transaction
let erTx = createTransaction({
    feePayer: user,
    instructions: [incrementAndCommitIx],
    latestBlockhash: blockhash
});

// Sign and send transaction
let signedErTx = await signTransactionMessageWithSigners(erTx);
let erSignature = getSignatureFromTransaction(signedErTx);

await sendAndConfirmMagicblockTransaction(signedErTx);

console.log("Counter incremented and commited successfully");
console.log(getExplorerLink({
    cluster: "devnet",
    transaction: erSignature, 
}));

/**
 * Next we fetch the current count on the pda again
 */

// Fetch account info
const {value: accountOnEr} = await rpc.getAccountInfo(counterPda, { commitment: "confirmed" }).send();
if (!accountOnEr) {
    throw `Failed to read data in account: ${counterPda}`
}

account_bytes = codec.encode(accountOnEr.data);
info = counter_decoder.read(account_bytes, 0);

// Count should have been incremented once again
console.log("Second Count:",info[0].count); 

/**
 * Finally we undelegate the counter pda
 */

// Create the undelegate instruction
const undelegateIx = programClient.getUndelegateInstruction({
    counter: counterPda,
    payer: user,
});

// Get latest blockhash
blockhash = (await mbRpc.getLatestBlockhash().send()).value;

// Create undelegate transaction
erTx = createTransaction({
    feePayer: user,
    instructions: [undelegateIx],
    latestBlockhash: blockhash
});

// Sign and send transaction
signedErTx = await signTransactionMessageWithSigners(erTx);
erSignature = getSignatureFromTransaction(signedErTx);

await sendAndConfirmMagicblockTransaction(signedErTx);

console.log("Counter PDA undelegated successfully");
console.log(getExplorerLink({
    cluster: "devnet",
    transaction: erSignature, 
}));