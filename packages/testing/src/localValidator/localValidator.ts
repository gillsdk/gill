import { spawn, execSync } from "node:child_process";
import { existsSync, rmSync } from "node:fs";
import { createServer } from "node:net";
import { join } from "node:path";
import os, { homedir } from "node:os";
import http from "node:http";
import { Address, createSolanaClient, KeyPairSigner, lamports, Lamports } from "gill";
import { loadKeypairSignerFromFile } from "gill/node";

/** ------------------ Types ------------------ */
export interface LocalValidatorConfig {
  airdropLamports?: Lamports;
  resetLogs?: boolean;
  watch?: boolean;
  waitTimeoutMs?: number;
  programAddress: Address;
}

export interface LocalValidatorResult {
  rpcUrl: string;
  wsUrl: string;
  payer: KeyPairSigner;
  close: () => void;
}

/** ------------------ Helpers ------------------ */
async function checkPortFree(port: number, host = "127.0.0.1") {
  return new Promise<void>((resolve, reject) => {
    const server = createServer();
    server.once("error", (err: NodeJS.ErrnoException) => {
      if (err.code === "EADDRINUSE") {
        reject(new Error(`❌ Port ${port} in use`));
      } else reject(err);
    });
    server.once("listening", () => {
      server.close(() => resolve());
    });
    server.listen(port, host);
  });
}

async function isSurfpoolRunning(rpcUrl = "http://127.0.0.1:8899"): Promise<boolean> {
  return new Promise((resolve) => {
    const req = http.get(rpcUrl, { timeout: 1000 }, (res) => {
      res.destroy();
      resolve(true);
    });
    req.on("error", () => resolve(false));
    req.on("timeout", () => {
      req.destroy();
      resolve(false);
    });
  });
}

async function waitForSurfpoolReady(
  rpcUrl: string,
  programAddress: Address,
  timeoutMs: number = 120_000,
): Promise<void> {
  const checkInterval = 5_000; // Check every 5 seconds
  const start = Date.now();

  const { rpc } = createSolanaClient({ urlOrMoniker: rpcUrl });

  console.log(`⏳ Waiting for Surfpool and program ${programAddress} (timeout: ${timeoutMs}ms)...`);
  let rpcReady = false;

  while (Date.now() - start < timeoutMs) {
    const elapsed = Date.now() - start;

    try {
      // Phase 1: Check if RPC is responding
      if (!rpcReady) {
        if (await isSurfpoolRunning(rpcUrl)) {
          rpcReady = true;
          console.log(`✓ Surfpool RPC responding (${elapsed}ms)`);
        } else {
          console.log(`⏳ Waiting for RPC to start... (${elapsed}ms)`);
          await new Promise((r) => setTimeout(r, checkInterval));
          continue;
        }
      }

      // Phase 2: Check if program is deployed
      const accountInfo = await rpc.getAccountInfo(programAddress).send();

      if (accountInfo?.value?.executable) {
        console.log(`✅ Program deployed and ready (took ${elapsed}ms)`);
        return;
      }
      console.log(`⏳ Program deploying... (${elapsed}ms)`);
    } catch (error) {
      // RPC error or program doesn't exist yet
      const msg = error instanceof Error ? error.message : "unknown error";
      console.log(`⏳ Waiting (${elapsed}ms): ${msg}`);
    }

    await new Promise((r) => setTimeout(r, checkInterval));
  }

  throw new Error(`⏳ Timeout: Program ${programAddress} not deployed within ${timeoutMs}ms`);
}

function isWSL(): boolean {
  if (os.platform() !== "linux") return false;
  try {
    const kernel = execSync("uname -r", { encoding: "utf8" });
    return kernel.toLowerCase().includes("microsoft");
  } catch {
    return false;
  }
}

function detectLinuxTerminal(): string | null {
  const terminals = ["gnome-terminal", "konsole", "xterm", "alacritty", "kitty"];
  for (const term of terminals) {
    try {
      execSync(`command -v ${term}`, { stdio: "ignore" });
      return term;
    } catch {}
  }
  return null;
}

function hasGUI(): boolean {
  return Boolean(process.env.DISPLAY || process.env.WAYLAND_DISPLAY);
}

function detectShell(): string {
  const shell = process.env.SHELL || process.env.ComSpec || "bash";
  return shell.split("/").pop()?.toLowerCase() ?? "bash";
}

/** ------------------ Terminal Launcher ------------------ */
function openCommandInNewTerminal(cmd: string) {
  const platform = os.platform();
  const shell = detectShell();
  const isInWSL = isWSL();
  const terminalApp = process.env.TERM_PROGRAM || "unknown";
  let execCmd = "";

  if (platform === "darwin") {
    execCmd = terminalApp.includes("iTerm")
      ? `osascript -e 'tell app "iTerm" to create window with default profile command "${cmd}"'`
      : `osascript -e 'tell app "Terminal" to do script "${cmd}"'`;
  } else if (isInWSL) {
    const distro = process.env.WSL_DISTRO_NAME || "Ubuntu";
    const cwd = process.cwd().replace(/\\/g, "/");
    const safe = cmd.replace(/"/g, '\\"');
    execCmd = `cmd.exe /c wt new-tab -d "${cwd}" wsl.exe -d ${distro} bash -ic "${safe}"`;
  } else if (platform === "linux") {
    if (hasGUI()) {
      const term = detectLinuxTerminal();
      if (term) execCmd = `${term} -- bash -c "${cmd}; exec ${shell}"`;
      else {
        console.warn("⚠️ No GUI terminal found, using tmux fallback");
        spawn("tmux", ["new-session", "-d", `${cmd}; exec ${shell}`], {
          detached: true,
          stdio: "ignore",
        }).unref();
        return;
      }
    } else {
      console.warn("⚠️ No GUI available, running in tmux/screen session");
      try {
        spawn("tmux", ["new-session", "-d", `${cmd}; exec ${shell}`], {
          detached: true,
          stdio: "ignore",
        }).unref();
      } catch {
        spawn("screen", ["-dm", "bash", "-c", `${cmd}; exec ${shell}`], {
          detached: true,
          stdio: "ignore",
        }).unref();
      }
      return;
    }
  } else {
    console.error("❌ Unsupported platform:", platform);
    return;
  }

  console.log(`🧩 Launching: ${execCmd}`);
  spawn(execCmd, { shell: true, detached: true, stdio: "ignore" }).unref();
}

/** ------------------ Main Validator Logic ------------------ */
export async function startLocalValidator({
  airdropLamports = lamports(10_000_000_000n),
  resetLogs = true,
  watch = false,
  programAddress,
}: LocalValidatorConfig): Promise<LocalValidatorResult> {
  if (airdropLamports <= 0n) throw new Error("airdropLamports must be > 0");

  const DEFAULT_KEYPAIR = join(homedir(), ".config/solana/id.json");
  if (!existsSync(DEFAULT_KEYPAIR)) {
    throw new Error(`Payer keypair missing: ${DEFAULT_KEYPAIR}`);
  }

  const rpcUrl = "http://127.0.0.1:8899";
  const wsUrl = "ws://127.0.0.1:8900";

  // ✅ Skip start if already running
  if (await isSurfpoolRunning(rpcUrl)) {
    console.log("⚙️ Surfpool already running — reusing existing instance.");
    return {
      rpcUrl,
      wsUrl,
      payer: await loadKeypairSignerFromFile(),
      close: () => console.log("⚙️ Manually stop Surfpool if needed."),
    };
  }

  try {
    await checkPortFree(8899);
    await checkPortFree(8900);
  } catch (err) {
    console.warn("⚠️ Ports in use, assuming Surfpool already running");
    return {
      rpcUrl,
      wsUrl,
      payer: await loadKeypairSignerFromFile(),
      close: () => console.log("⚙️ Manually stop Surfpool if needed."),
    };
  }

  if (resetLogs && existsSync(".surfpool")) rmSync(".surfpool", { recursive: true, force: true });

  const payer = await loadKeypairSignerFromFile();

  const args = ["start", "--airdrop-keypair-path", DEFAULT_KEYPAIR];
  if (airdropLamports) {
    args.push("--airdrop-amount", airdropLamports.toString());
  }
  if (watch) args.push("--watch");

  const cmd = `surfpool ${args.join(" ")}`;
  openCommandInNewTerminal(cmd);

  console.log("🚀 Starting Surfpool...");
  await waitForSurfpoolReady(rpcUrl, programAddress);

  return {
    rpcUrl,
    wsUrl,
    payer,
    close: () => console.log("⚙️ Close manually (Ctrl+C / Cmd+C) in spawned terminal"),
  };
}
