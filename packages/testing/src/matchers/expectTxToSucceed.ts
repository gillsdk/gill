import type { Signature } from "gill";
import type { SolanaClient } from "gill";
import inspectTransaction from "../txLogInspector/inspectTransaction.js";

/**
 * Ensures that a given transaction has succeeded.
 *
 * This is typically used in tests or fixtures to assert that a transaction
 * completed successfully on-chain.
 *
 * @param rpc - Solana RPC client
 * @param signature - Signature of the transaction to check
 * @throws Error if the transaction failed or could not be found
 *
 * @example
 * await expectTxToSucceed(rpc, txSignature);
 */
export default async function expectTxToSucceed(rpc: SolanaClient["rpc"], signature: Signature): Promise<void> {
  try {
    // Inspect the transaction using the transaction log inspector
    const result = await inspectTransaction(rpc, signature);

    // If transaction cannot be found
    if (!result) {
      throw new Error(`Transaction ${signature} not found - may have failed or timed out`);
    }

    // If the transaction failed
    if (result.status === "failed") {
      throw new Error(`Transaction ${signature} failed!\n${result.logs.join("\n")}`);
    }

    // Success: transaction completed as expected
    return;
  } catch (err: unknown) {
    if (err instanceof Error) {
      throw new Error(`Failed to check transaction ${signature}: ${err.message}`);
    }
    throw new Error(`Failed to check transaction ${signature}: Unknown error`);
  }
}
