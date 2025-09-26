/**
 * Represents a single custom error parsed from transaction logs.
 */
type CustomErrorResult = {
  found: boolean; // Whether an error was found in this log line
  errorCode?: number; // Numeric error code (if applicable)
  errorName?: string; // Named error (Anchor-style) if available
  errorMessage?: string; // Human-readable message from logs
  rawLog?: string; // Original log line
};

/**
 * Represents all custom errors found in a transaction's logs.
 */
type AllCustomErrorsResult = {
  errors: CustomErrorResult[]; // List of parsed errors
  found: boolean; // Whether any errors were found
};

/**
 * Parses all custom errors from an array of transaction log messages.
 *
 * Supports:
 *   - Anchor-style errors: "Error Code: ErrorName. Error Number: 1234. Error Message: description"
 *   - Custom program errors: "Program xyz failed: custom program error: 0x1234"
 *   - Generic program logs: "Program log: Error: something"
 *
 * @param logs - Array of log strings from a transaction
 * @returns Object containing all parsed errors and whether any were found
 *
 * @example
 * const { errors, found } = findAllCustomErrors(txLogs);
 */
export default function findAllCustomErrors(logs: string[]): AllCustomErrorsResult {
  const errors: CustomErrorResult[] = [];

  // Return immediately if logs are empty
  if (!logs?.length) {
    return { errors, found: false };
  }

  for (let log of logs) {
    log = log.trim();

    // === Anchor-style errors ===
    // Format: "Error Code: ErrorName. Error Number: 1234. Error Message: description"
    const anchorMatch = log.match(/Error Code: (\w+).*?Error Number: (\d+).*?Error Message: (.+)/);
    if (anchorMatch) {
      errors.push({
        found: true,
        errorName: anchorMatch[1],
        errorCode: parseInt(anchorMatch[2], 10),
        errorMessage: anchorMatch[3].trim(),
        rawLog: log,
      });
      continue; // Skip to next log line after parsing
    }

    // === Custom program errors ===
    // Format: "Program xyz failed: custom program error: 0x1234"
    const failedMatch = log.match(/failed: custom program error: (?:0x)?([a-fA-F0-9]+)/);
    if (failedMatch) {
      const codeStr = failedMatch[1];
      const errorCode = /[a-fA-F]/.test(codeStr) ? parseInt(codeStr, 16) : parseInt(codeStr, 10);

      errors.push({
        found: true,
        errorCode,
        rawLog: log,
      });
      continue;
    }

    // === Generic program errors ===
    // Format: "Program log: Error: something"
    const genericMatch = log.match(/Program log: Error: (.+)/);
    if (genericMatch) {
      errors.push({
        found: true,
        errorMessage: genericMatch[1].trim(),
        rawLog: log,
      });
    }
  }

  // Return all errors and a flag indicating if any were found
  return { errors, found: errors.length > 0 };
}
