import type { Address } from "gill";
import type { SolanaClient } from "gill";

/**
 * Ensures that a given account exists on-chain.
 *
 * This is typically used in tests or fixtures to assert that
 * an account (e.g., a mint, token account, or user account) has been created.
 *
 * @param rpc - Solana RPC client
 * @param address - Address of the account to check
 * @throws Error if the account does not exist or if the RPC call fails
 *
 * @example
 * await expectAccountToExist(rpc, userTokenAccount);
 */
export default async function expectAccountToExist(rpc: SolanaClient["rpc"], address: Address): Promise<void> {
  try {
    // Fetch account information from the RPC
    const accountInfo = await rpc.getAccountInfo(address, { commitment: "confirmed" }).send();

    // If accountInfo.value is null, the account does not exist
    if (!accountInfo.value) {
      throw new Error(`Account ${address} does not exist`);
    }
  } catch (err: unknown) {
    if (err instanceof Error) {
      throw new Error(`Failed to check account ${address}: ${err.message}`);
    }
    throw new Error(`Failed to check account ${address}: Unknown error`);
  }
}
