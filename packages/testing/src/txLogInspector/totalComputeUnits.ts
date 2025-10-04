/**
 * Calculate the total compute units consumed by a transaction from logs.
 *
 * Scans log lines for patterns like:
 * "consumed <used> of <total> compute units"
 *
 * @param logs - Array of log strings from a transaction
 * @returns Total compute units consumed
 *
 * @example
 * const totalCU = totalComputeUnits(tx.logs);
 * console.log(`Total compute units: ${totalCU}`);
 */
export default function totalComputeUnits(logs: string[]): number {
  let total = 0;

  if (!logs?.length) return 0; // No logs, zero compute units

  for (const log of logs) {
    // Match lines like: "consumed 5000 of 200000 compute units"
    const match = log.match(/consumed (\d+) of \d+ compute units/);
    if (match) {
      const units = parseInt(match[1], 10);
      if (!isNaN(units)) total += units;
    }
  }

  return total;
}
