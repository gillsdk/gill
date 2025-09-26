import { Signature, SolanaClient } from "gill";
import findCustomError from "../txLogInspector/findCustomError.js";
import inspectTransaction from "../txLogInspector/inspectTransaction.js";

/**
 * Expects a transaction to fail with a specific error.
 *
 * This is useful in testing to assert that a transaction fails
 * in the expected way (e.g., with a custom program error or Anchor error).
 *
 * @param rpc - Solana RPC client
 * @param signature - Signature of the transaction to inspect
 * @param options - Optional filters for the expected failure:
 *   - code: numeric error code
 *   - name: error name
 *   - messageIncludes: substring that should appear in logs
 * @throws Error if:
 *   - Transaction is not found
 *   - Transaction succeeds unexpectedly
 *   - Transaction fails but does not match the expected error
 *
 * @example
 * await expectTxToFailWith(rpc, txSignature, { code: 0x1234, name: "CustomError" });
 */
export async function expectTxToFailWith(
  rpc: SolanaClient["rpc"],
  signature: Signature,
  options: {
    code?: number;
    name?: string;
    messageIncludes?: string;
  } = {},
): Promise<void> {
  // Inspect the transaction logs and metadata
  const result = await inspectTransaction(rpc, signature);

  // If the transaction cannot be found
  if (!result) {
    throw new Error(`Transaction ${signature} not found - may have failed or timed out`);
  }

  // If the transaction succeeded unexpectedly
  if (result.status === "success") {
    throw new Error(`Transaction ${signature} succeeded but was expected to fail`);
  }

  // Parse custom errors from logs
  const error = findCustomError(result.logs);

  // Check if the error matches the expected code, name, and/or message substring
  const matchesCode = options.code === undefined || error.errors.some((e) => e.errorCode === options.code);
  const matchesName = options.name === undefined || error.errors.some((e) => e.errorName === options.name);
  const matchesMessage =
    options.messageIncludes === undefined || result.logs.some((line) => line.trim().includes(options.messageIncludes!));

  // If the transaction failed but does not match expected criteria, throw an error
  if (!(matchesCode && matchesName && matchesMessage)) {
    throw new Error(
      `Transaction ${signature} failed, but did not match expected error.\n` +
        `Expected: ${JSON.stringify(options, null, 2)}\n` +
        `Found: ${JSON.stringify(error, null, 2)}\n` +
        `Logs:\n${result.logs.join("\n")}`,
    );
  }

  // Success: transaction failed as expected
  return;
}
