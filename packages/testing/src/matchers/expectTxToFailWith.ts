import { isSignature, Signature, SolanaClient } from "gill";
import { findCustomError } from "../txLogInspector/findCustomError";
import { inspectTransaction } from "../txLogInspector/inspectTransaction";

const MAX_LOG_LINES = 50;

/**
 * Truncates logs to a maximum number of lines for error messages.
 */
function truncateLogs(logs: string[], maxLines: number = MAX_LOG_LINES): string {
  if (logs.length <= maxLines) return logs.join("\n");
  const truncated = logs.slice(0, maxLines);
  return `${truncated.join("\n")}\n... (${logs.length - maxLines} more lines truncated)`;
}

/**
 * Asserts that a transaction fails with a specific expected error.
 *
 * Supports two kinds of input:
 *   1. A real on-chain transaction signature → the transaction is fetched & inspected
 *   2. A raw array of simulation logs → skipped RPC lookup, logs inspected directly
 *
 * @param rpc - Solana RPC client
 * @param input - Either:
 *   - a transaction signature (string) → must already have been sent
 *   - an array of log lines (string[]) → e.g. from simulateTransaction
 *
 * @param options - Expected error matching rules (all optional):
 *   - code:        exact Anchor-style error code (e.g. "6000")
 *   - name:        exact Anchor-style error name (e.g. "UnauthorizedAccess")
 *   - messageIncludes: substring expected to appear anywhere in the logs
 *
 * @throws Error if:
 *   - Signature is invalid or transaction not found
 *   - Transaction unexpectedly succeeded
 *   - No logs are available to inspect
 *   - No custom error is found in logs
 *   - The error does not match the provided expectations
 *
 * @example
 * await expectTxToFailWith(rpc, sig, {
 *   code: "6001",
 *   name: "UnauthorizedAccess",
 *   messageIncludes: "not allowed",
 * });
 *
 *  * @example
 * // Example: passing raw logs directly (e.g. from simulateTransaction)
 * const logs = [
 *   "Program xxxxxxx invoke [1]",
 *   "Program log: Instruction: Make",
 *   "Program log: Error Message: UnauthorizedAccess (6001) - not allowed to perform this action",
 *   "Program xxxxxxx failed: custom program error: 0x1771",
 * ];
 *
 * await expectTxToFailWith(rpc, logs, {
 *   code: "6001",
 *   name: "UnauthorizedAccess",
 *   messageIncludes: "not allowed",
 * });
 */

export async function expectTxToFailWith(
  rpc: SolanaClient["rpc"],
  input: Signature | string[],
  options: {
    code?: string;
    name?: string;
    messageIncludes?: string;
  } = {},
): Promise<void> {
  let logs: string[] | undefined;
  let signature: Signature | undefined;

  if (typeof input === "string") {
    if (!isSignature(input)) {
      throw new Error(`Invalid signature string: "${input}". Expected a base58-encoded Ed25519 signature.`);
    }

    signature = input;
    const result = await inspectTransaction(rpc, signature);

    if (!result) {
      throw new Error(`Transaction ${signature} not found - may have failed or timed out`);
    }

    if (result.status === "success") {
      throw new Error(`Transaction ${signature} succeeded but was expected to fail`);
    }

    logs = result.logs;
  } else if (Array.isArray(input)) {
    logs = input;
  }

  if (!logs) {
    throw new Error("No logs found to inspect transaction failure.");
  }

  const customError = findCustomError(logs);

  if (!customError || !customError.errors?.length) {
    throw new Error(
      `Transaction failed, but no custom error was found in logs.\n` +
        `Expected: ${JSON.stringify(options, null, 2)}\n` +
        `Logs:\n${truncateLogs(logs)}`,
    );
  }

  const matchesCode =
    options.code === undefined || customError.errors.some((e) => e.errorCodeRaw && e.errorCodeRaw === options.code);

  const matchesName =
    options.name === undefined || customError.errors.some((e) => e.errorName && e.errorName === options.name);

  const matchesMessage =
    options.messageIncludes === undefined || logs.some((line) => line.trim().includes(options.messageIncludes!));

  if (!(matchesCode && matchesName && matchesMessage)) {
    throw new Error(
      `Transaction failed, but did not match expected error.\n` +
        (signature ? `Signature: ${signature}\n` : "") +
        `Expected: ${JSON.stringify(options, null, 2)}\n` +
        `Found: ${JSON.stringify(customError, null, 2)}\n` +
        `Logs:\n${truncateLogs(logs)}`,
    );
  }
}
