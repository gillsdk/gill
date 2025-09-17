import {
  address,
  airdropFactory,
  createSolanaClient,
  lamports,
  SolanaClusterMoniker,
} from "gill";

/**
 * Define the address to request a SOL airdrop to
 *
 * Note: this address does not need to sign this transaction
 */
const wallet = address("nick6zJc6HpW3kfBm4xS2dmbuVRyb5F3AnUvj5ymzR5");
console.log("wallet:", wallet);

/**
 * Declare what Solana network cluster we want our code to interact with
 */
const cluster: SolanaClusterMoniker = "devnet";

/**
 * Create a client connection to the Solana blockchain
 *
 * Note: `urlOrMoniker` can be either a Solana network moniker or a full URL of your RPC provider
 */
const { rpc, rpcSubscriptions } = createSolanaClient({
  urlOrMoniker: cluster,
});

/**
 * Get the current lamport balance of the `wallet`
 */
const { value: initialBalance } = await rpc.getBalance(wallet).send();
console.log("Initial balance:", initialBalance);

/**
 * Request an airdrop of testing tokens to the `wallet` address
 *
 * Note: devnet and testnet are subject to rate limits.
 * it is strongly recommended to use `localnet` and the local test validator
 */
await airdropFactory({ rpc, rpcSubscriptions })({
  commitment: "confirmed",
  lamports: lamports(100n),
  recipientAddress: wallet,
});

/**
 * Get the current new lamport balance of the `wallet`
 */
const { value: newBalance } = await rpc.getBalance(wallet).send();
console.log("New balance:", newBalance);
