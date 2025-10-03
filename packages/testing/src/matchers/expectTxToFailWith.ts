import { Signature, SolanaClient } from "gill";
import findCustomError from "../txLogInspector/findCustomError";
import inspectTransaction from "../txLogInspector/inspectTransaction";

const MAX_LOG_LINES = 50;

/**
 * Truncates logs to a maximum number of lines for error messages
 */
function truncateLogs(logs: string[], maxLines: number = MAX_LOG_LINES): string {
  if (logs.length <= maxLines) {
    return logs.join("\n");
  }

  const truncated = logs.slice(0, maxLines);
  return `${truncated.join("\n")}\n... (${logs.length - maxLines} more lines truncated)`;
}

/**
 * Expects a transaction to fail with a specific error.
 *
 * @param rpc - Solana RPC client
 * @param transactionSignature - Signature of the transaction to inspect
 * @param options - Optional filters for the expected failure:
 *   - code: error code as string (must match the log format)
 *   - name: error name (Anchor-style)
 *   - messageIncludes: substring that should appear in logs
 * @throws Error if:
 *   - Transaction is not found
 *   - Transaction succeeds unexpectedly
 *   - Transaction fails but does not match the expected error
 *
 * @example
 * // Check for specific error code
 * await expectTxToFailWith(rpc, signature, { code: "6000" });
 *
 * @example
 * // Check for specific error name
 * await expectTxToFailWith(rpc, signature, { name: "InsufficientFunds" });
 *
 * @example
 * // Check for multiple criteria
 * await expectTxToFailWith(rpc, signature, {
 *   code: "0x1770",
 *   name: "InvalidAmount",
 *   messageIncludes: "amount too large"
 * });
 */
export async function expectTxToFailWith(
  rpc: SolanaClient["rpc"],
  transactionSignature: Signature,
  options: {
    code?: string;
    name?: string;
    messageIncludes?: string;
  } = {},
): Promise<void> {
  const result = await inspectTransaction(rpc, transactionSignature);

  if (!result) {
    throw new Error(`Transaction ${transactionSignature} not found - may have failed or timed out`);
  }

  if (result.status === "success") {
    throw new Error(`Transaction ${transactionSignature} succeeded but was expected to fail`);
  }

  const customError = findCustomError(result.logs);

  if (!customError || !customError.errors || customError.errors.length === 0) {
    throw new Error(
      `Transaction ${transactionSignature} failed, but no custom error was found in logs.\n` +
        `Expected: ${JSON.stringify(options, null, 2)}\n` +
        `Logs:\n${truncateLogs(result.logs)}`,
    );
  }

  const matchesCode =
    options.code === undefined || customError.errors.some((e) => e.errorCodeRaw && e.errorCodeRaw === options.code);

  const matchesName =
    options.name === undefined || customError.errors.some((e) => e.errorName && e.errorName === options.name);

  const matchesMessage =
    options.messageIncludes === undefined || result.logs.some((line) => line.trim().includes(options.messageIncludes!));

  // All specified conditions must match
  if (!(matchesCode && matchesName && matchesMessage)) {
    throw new Error(
      `Transaction ${transactionSignature} failed, but did not match expected error.\n` +
        `Expected: ${JSON.stringify(options, null, 2)}\n` +
        `Found: ${JSON.stringify(customError, null, 2)}\n` +
        `Logs:\n${truncateLogs(result.logs)}`,
    );
  }
}
