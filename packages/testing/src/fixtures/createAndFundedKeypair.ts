import { 
  airdropFactory, 
  generateKeyPairSigner, 
  lamports, 
  type Lamports, 
  type KeyPairSigner, 
  SolanaClient 
} from "gill";

/**
 * Result returned by `createAndFundedKeypair`.
 */
export type FundedKeypairResult = {
  /** The newly generated keypair funded with SOL */
  fundedKeypair: KeyPairSigner;
  /** Signature of the airdrop transaction */
  signature: string;
  /** Balance of the funded account after the airdrop */
  balance: Lamports;
};

/**
 * Create a new keypair and fund it with a specified amount of SOL.
 *
 * This function is primarily used in test fixtures and scripts where you need:
 * - A fresh account
 * - Pre-funded SOL for paying transaction fees
 *
 * @param rpc - Solana RPC client
 * @param rpcSubscriptions - RPC subscriptions object (for airdrops)
 * @param lamportsAmount - Amount of SOL to fund the account with (default 10 SOL)
 * @returns FundedKeypairResult object
 *
 * @example
 * const { fundedKeypair, signature, balance } = await createAndFundedKeypair(rpc, rpcSubscriptions);
 */
export async function createAndFundedKeypair(
  rpc: SolanaClient["rpc"],
  rpcSubscriptions: SolanaClient["rpcSubscriptions"],
  lamportsAmount: Lamports = lamports(10_000_000_000n), // default = 10 SOL
): Promise<FundedKeypairResult> {
  try {
    // Generate a new keypair
    const fundedKeypair = await generateKeyPairSigner();

    // Perform an airdrop to fund the account
    const signature = await airdropFactory({ rpc, rpcSubscriptions })({
      commitment: "confirmed",
      lamports: lamportsAmount,
      recipientAddress: fundedKeypair.address,
    });

    // Fetch the balance after funding
    const { value: balance } = await rpc.getBalance(fundedKeypair.address).send();

    return { fundedKeypair, signature, balance };
  } catch (error: unknown) {
    if (error instanceof Error) {
      throw new Error(`createFundedKeypair failed: ${error.message}`);
    }
    throw new Error("createFundedKeypair failed: Unknown error");
  }
}
