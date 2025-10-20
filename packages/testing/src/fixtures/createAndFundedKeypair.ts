import {
  airdropFactory,
  generateKeyPairSigner,
  lamports,
  type Lamports,
  type KeyPairSigner,
  SolanaClient,
  Signature,
} from "gill";

/**
 * Result returned by `createAndFundedKeypair`.
 */
export type FundedKeypairResult = {
  /** The newly generated keypair funded with SOL */
  fundedKeypair: KeyPairSigner;
  /** Signature of the airdrop transaction */
  transactionSignature: Signature;
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
  if (lamportsAmount <= 0n) {
    throw new Error("Airdrop amount must be greater than zero lamports");
  }

  const fundedKeypair = await generateKeyPairSigner();

  const transactionSignature = await airdropFactory({ rpc, rpcSubscriptions })({
    commitment: "confirmed",
    lamports: lamportsAmount,
    recipientAddress: fundedKeypair.address,
  });

  const { value: balance } = await rpc.getBalance(fundedKeypair.address).send();

  return { fundedKeypair, transactionSignature, balance };
}
