import { spawn, type ChildProcess } from "node:child_process";
import { rmSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";

/**
 * Configuration options for starting a local Solana validator
 */
export interface LocalValidatorConfig {
  /** Lamports to airdrop to the validator payer */
  airdropLamports?: number;
  /** Whether to reset local logs before starting */
  resetLogs?: boolean;
  /** Watch for file changes and auto-restart validator */
  watch?: boolean;
}

/**
 * Result object returned after starting a local validator
 */
export interface LocalValidatorResult {
  /** RPC endpoint URL */
  rpc: string;
  /** WebSocket endpoint URL */
  ws: string;
  /** Path to payer keypair file */
  payer: string;
  /** Function to stop the validator */
  close: () => void;
}

/**
 * Starts a local Solana validator using `surfpool`.
 *
 * @param config - LocalValidatorConfig
 * @returns LocalValidatorResult
 */
export default function startLocalValidator({
  airdropLamports,
  resetLogs = true,
  watch = false,
}: LocalValidatorConfig): LocalValidatorResult {
  // Default payer keypair location (~/.config/solana/id.json)
  const payer = join(homedir(), ".config", "solana", "id.json");

  // Clear previous validator logs if requested
  if (resetLogs) {
    try {
      rmSync(".surfpool", { recursive: true, force: true });
    } catch (err) {
      throw new Error(`Failed to clear .surfpool directory: ${(err as Error).message}`);
    }
  }

  // Build command-line arguments
  const args: string[] = ["start"];
  if (airdropLamports) {
    args.push("--airdrop-amount", airdropLamports.toString());
  }
  args.push("--airdrop-keypair-path", payer);
  if (watch) {
    args.push("--watch");
  }

  // Spawn the local validator process
  const proc: ChildProcess = spawn("surfpool", args, {
    stdio: "inherit", // Show output in console
    detached: false, // Keep child attached to parent
  });

  // Listen for process errors
  proc.on("error", (error: Error) => {
    throw new Error(`Failed to start surfpool: ${error.message}`);
  });

  // Listen for process exit
  proc.on("close", (code) => {
    if (code !== 0) {
      throw new Error(`Validator exited with code ${code}`);
    }
  });

  return {
    rpc: "http://127.0.0.1:8899", // Default RPC endpoint
    ws: "ws://127.0.0.1:8900", // Default WebSocket endpoint
    payer,
    close: () => {
      proc.kill(); // Stop the validator
    },
  };
}
