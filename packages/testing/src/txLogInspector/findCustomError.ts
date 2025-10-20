/**
 * Represents a single custom error parsed from transaction logs.
 */
type CustomErrorResult = {
  errorName?: string; // Anchor-style error name, if available
  errorMessage?: string; // Human-readable message from logs
  errorCodeRaw?: string; // Error code exactly as it appeared (e.g., "0x42" or "1337")
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
 */
export function findCustomError(logs: string[]): AllCustomErrorsResult {
  const errors: CustomErrorResult[] = [];

  if (!logs?.length) return { errors, found: false };

  for (let log of logs) {
    log = log.trim();

    // === Anchor-style errors ===
    const anchorMatch = log.match(/Error Code: (\w+).*?Error Number: (\d+).*?Error Message: (.+)/);
    if (anchorMatch) {
      errors.push({
        errorName: anchorMatch[1],
        errorCodeRaw: anchorMatch[2],
        errorMessage: anchorMatch[3].trim(),
        rawLog: log,
      });
      continue;
    }

    // === Custom program errors ===
    const failedMatch = log.match(/failed: custom program error: ((?:0x)?[a-fA-F0-9]+)/);
    if (failedMatch) {
      errors.push({
        errorCodeRaw: failedMatch[1],
        rawLog: log,
      });
      continue;
    }

    // === Generic program log errors ===
    const genericMatch = log.match(/Program log: Error: (.+)/);
    if (genericMatch) {
      errors.push({
        errorMessage: genericMatch[1].trim(),
        rawLog: log,
      });
    }
  }

  return { errors, found: errors.length > 0 };
}
