import { spawn } from "node:child_process";
import { existsSync, rmSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";
import { createServer } from "node:net";
import { lamports } from "gill";
import startLocalValidator from "../localValidator/localValidator";

jest.mock("node:child_process");
jest.mock("node:fs");
jest.mock("node:os");
jest.mock("node:path");
jest.mock("node:net");

describe("startLocalValidator", () => {
  let mockChildProcess: any;
  let mockServer: any;

  beforeEach(() => {
    jest.clearAllMocks();

    mockChildProcess = {
      on: jest.fn(),
      kill: jest.fn(),
      killed: false,
    };
    (spawn as jest.Mock).mockReturnValue(mockChildProcess);

    mockServer = {
      once: jest.fn(),
      listen: jest.fn(),
      close: jest.fn((cb) => cb()),
    };
    (createServer as jest.Mock).mockReturnValue(mockServer);

    (existsSync as jest.Mock).mockReturnValue(true);
    (rmSync as jest.Mock).mockReturnValue(undefined);
    (homedir as jest.Mock).mockReturnValue("/home/testuser");
    (join as jest.Mock).mockImplementation((...args) => args.join("/"));
  });

  it("starts validator with default configuration", async () => {
    mockServer.once.mockImplementation((event, cb) => {
      if (event === "listening") setTimeout(() => cb(), 0);
    });

    const result = await startLocalValidator({});

    expect(result).toEqual({
      rpc: "http://127.0.0.1:8899",
      ws: "ws://127.0.0.1:8900",
      payer: "/home/testuser/.config/solana/id.json",
      close: expect.any(Function),
    });

    expect(spawn).toHaveBeenCalledWith(
      "surfpool",
      ["start", "--airdrop-amount", "10000000000", "--airdrop-keypair-path", "/home/testuser/.config/solana/id.json"],
      { stdio: "inherit", detached: false },
    );
  });

  it("throws if airdropLamports is zero", async () => {
    await expect(startLocalValidator({ airdropLamports: lamports(0n) })).rejects.toThrow("airdropLamports must be > 0");
  });

  it("starts validator with watch mode and custom airdrop amount", async () => {
    mockServer.once.mockImplementation((event, cb) => {
      if (event === "listening") setTimeout(() => cb(), 0);
    });

    const customAmount = lamports(5_000_000_000n);
    await startLocalValidator({ airdropLamports: customAmount, watch: true });

    expect(spawn).toHaveBeenCalledWith(
      "surfpool",
      [
        "start",
        "--airdrop-amount",
        "5000000000",
        "--airdrop-keypair-path",
        "/home/testuser/.config/solana/id.json",
        "--watch",
      ],
      expect.any(Object),
    );
  });

  it("throws if payer keypair is missing", async () => {
    (existsSync as jest.Mock).mockReturnValue(false);

    await expect(startLocalValidator({})).rejects.toThrow(
      "Default payer keypair not found at /home/testuser/.config/solana/id.json",
    );
  });

  it("resets logs when resetLogs is true and .surfpool exists", async () => {
    mockServer.once.mockImplementation((event, cb) => {
      if (event === "listening") setTimeout(() => cb(), 0);
    });

    (existsSync as jest.Mock).mockImplementation((path: string) => (path === ".surfpool" ? true : true));

    await startLocalValidator({ resetLogs: true });

    expect(rmSync).toHaveBeenCalledWith(".surfpool", {
      recursive: true,
      force: true,
    });
  });

  it("handles port errors (EADDRINUSE vs other errors)", async () => {
    // EADDRINUSE
    mockServer.once.mockImplementation((event, cb) => {
      if (event === "error") {
        const err: any = new Error("EADDRINUSE");
        err.code = "EADDRINUSE";
        setTimeout(() => cb(err), 0);
      }
    });
    await expect(startLocalValidator({})).rejects.toThrow("❌ Port 8899 is already in use");

    // Other port error
    mockServer.once.mockImplementation((event, cb) => {
      if (event === "error") {
        const err: any = new Error("EACCES: permission denied");
        err.code = "EACCES";
        setTimeout(() => cb(err), 0);
      }
    });
    await expect(startLocalValidator({})).rejects.toThrow("EACCES: permission denied");
  });

  it("handles surfpool spawn errors", async () => {
    mockServer.once.mockImplementation((event, cb) => {
      if (event === "listening") setTimeout(() => cb(), 0);
    });

    mockChildProcess.on.mockImplementation((event, cb) => {
      if (event === "error") {
        const err: any = new Error("spawn surfpool ENOENT");
        err.code = "ENOENT";
        cb(err);
      }
    });
    await expect(startLocalValidator({})).rejects.toThrow("❌ surfpool command not found");

    mockChildProcess.on.mockImplementation((event, cb) => {
      if (event === "error") cb(new Error("Unknown spawn error"));
    });
    await expect(startLocalValidator({})).rejects.toThrow("Failed to start surfpool: Unknown spawn error");
  });
});
