/**
 * Represents a CPI (Cross-Program Invocation) call
 */
type CpiCall = {
  programId: string; // Solana program ID being invoked
  depth: number; // Call depth (1 = top-level, >1 = nested CPI)
};

/**
 * Extract all program invocations (CPI calls) from transaction logs.
 *
 * By default, includes **all invokes**, including top-level ones (depth = 1).
 *
 * @param logs - Array of log strings from a transaction
 * @returns Array of CpiCall objects
 *
 * @example
 * const cpiCalls = listCpiCalls(tx.logs);
 * cpiCalls.forEach(call => console.log(call.programId, call.depth));
 */
export function listCpiCalls(logs: string[]): CpiCall[] {
  if (!logs?.length) return []; // No logs -> no CPI calls

  const cpiCalls: CpiCall[] = [];

  for (const log of logs) {
    // Matches Solana program invocations: "Program <programId> invoke [<depth>]"
    const match = log.match(/Program ([1-9A-HJ-NP-Za-km-z]{32,44}) invoke \[(\d+)\]/);
    if (match) {
      // Parse depth as integer; fallback to 0 if parsing fails (unlikely)
      const depth = parseInt(match[2], 10) || 0;

      // Include all invokes, including top-level by default
      cpiCalls.push({
        programId: match[1],
        depth,
      });
    }
  }

  return cpiCalls;
}
