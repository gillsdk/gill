import { spawn, type ChildProcess } from "node:child_process";
import { existsSync, rmSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";
import { createServer } from "node:net";
import { lamports, Lamports } from "gill";

/**
 * Configuration options for starting a local Solana validator
 */
export interface LocalValidatorConfig {
  /** Lamports to airdrop to the validator payer */
  airdropLamports?: Lamports;
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
 * Check if a TCP port is free.
 * Throws an error if port is already in use
 */
async function checkPortFree(port: number, host = "127.0.0.1"): Promise<void> {
  return new Promise((resolve, reject) => {
    const server = createServer();

    // If server fails to bind (e.g., port in use), reject
    server.once("error", (err: NodeJS.ErrnoException) => {
      if (err.code === "EADDRINUSE") {
        reject(new Error(`❌ Port ${port} is already in use`));
      } else {
        reject(err);
      }
    });

    // If server successfully binds, close immediately and resolve
    server.once("listening", () => {
      server.close(() => resolve());
    });

    server.listen(port, host);
  });
}

/**
 * Starts a local Solana validator using `surfpool`.
 *
 * @param config - LocalValidatorConfig
 * @returns LocalValidatorResult
 */
export default async function startLocalValidator({
  airdropLamports = lamports(10_000_000_000n), // default 10 SOL
  resetLogs = true,
  watch = false,
}: LocalValidatorConfig): Promise<LocalValidatorResult> {
  if (airdropLamports <= 0n) {
    throw new Error("airdropLamports must be > 0");
  }

  // Default payer keypair location (~/.config/solana/id.json)
  const payer = join(homedir(), ".config", "solana", "id.json");
  if (!existsSync(payer)) {
    throw new Error(`Default payer keypair not found at ${payer}. Run "solana-keygen new"`);
  }

  await checkPortFree(8899);
  await checkPortFree(8900);

  if (resetLogs && existsSync(".surfpool")) {
    rmSync(".surfpool", { recursive: true, force: true });
  }

  const args: string[] = ["start"];
  if (airdropLamports) {
    args.push("--airdrop-amount", airdropLamports.toString());
  }
  args.push("--airdrop-keypair-path", payer);
  if (watch) {
    args.push("--watch");
  }

  const proc: ChildProcess = spawn("surfpool", args, {
    stdio: "inherit",
    detached: false,
  });

  proc.on("error", (error: Error) => {
    if (error.message.includes("ENOENT") || (error as any).code === "ENOENT") {
      throw new Error(
        "❌ surfpool command not found. Please install surfpool first.\n\n" +
          "Installation options:\n" +
          "• Visit: https://github.com/txtx/surfpool\n" +
          "• Or check if surfpool is in your PATH",
      );
    }
    throw new Error(`Failed to start surfpool: ${error.message}`);
  });

  proc.on("close", (code) => {
    if (code !== 0 && code !== null) {
      console.error(`⚠️  Validator exited with code ${code}`);
    }
  });
  return {
    rpc: "http://127.0.0.1:8899",
    ws: "ws://127.0.0.1:8900",
    payer,
    close: () => {
      if (!proc.killed) {
        proc.kill("SIGKILL");
      }
    },
  };
}
