import type { Address } from "gill";
import type { SolanaClient } from "gill";

/**
 * Ensures that a given account exists on-chain.
 *
 * @param rpc - Solana RPC client
 * @param address - Address of the account to check
 * @throws Error if the account does not exist or if the RPC call fails
 *
 * @example
 * await expectAccountToExist(rpc, userTokenAccount);
 */
export async function expectAccountToExist(rpc: SolanaClient["rpc"], address: Address): Promise<void> {
  const accountInfo = await rpc
    .getAccountInfo(address, {
      commitment: "confirmed",
    })
    .send();

  if (!accountInfo.value) {
    throw new Error(`Account ${address} does not exist`);
  }
}
