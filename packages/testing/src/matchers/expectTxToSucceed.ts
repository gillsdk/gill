import type { Signature } from "gill";
import type { SolanaClient } from "gill";
import { inspectTransaction } from "../txLogInspector/inspectTransaction";

/**
 * Ensures that a given transaction has succeeded.
 *
 * @param rpc - Solana RPC client
 * @param transactionSignature - Signature of the transaction to check
 * @throws Error if the transaction failed or could not be found
 *
 * @example
 * await expectTxToSucceed(rpc, txSignature);
 */
export async function expectTxToSucceed(rpc: SolanaClient["rpc"], transactionSignature: Signature): Promise<void> {
  const result = await inspectTransaction(rpc, transactionSignature);

  if (!result) {
    throw new Error(`Transaction ${transactionSignature} not found - may have failed or timed out`);
  }

  if (result.status === "failed") {
    const maxLines = 50;
    const logsToShow = result.logs.slice(0, maxLines);
    throw new Error(`Transaction ${transactionSignature} failed!\n${logsToShow.join("\n")}`);
  }
}
