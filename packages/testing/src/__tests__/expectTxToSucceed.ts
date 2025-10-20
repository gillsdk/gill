import type { Signature } from "gill";
import type { SolanaClient } from "gill";
import { expectTxToSucceed } from "../matchers/expectTxToSucceed";
import { inspectTransaction } from "../txLogInspector/inspectTransaction";

jest.mock("../txLogInspector/inspectTransaction");

describe("expectTxToSucceed - Additional Tests", () => {
  let mockRpc: SolanaClient["rpc"];
  const mockSignature = "mock-signature-xyz789" as Signature;

  beforeEach(() => {
    jest.clearAllMocks();
    mockRpc = {} as SolanaClient["rpc"];
  });

  it("should not throw when transaction succeeds with empty logs", async () => {
    const mockResult = { status: "success" as const, logs: [] };
    (inspectTransaction as jest.Mock).mockResolvedValue(mockResult);

    await expect(expectTxToSucceed(mockRpc, mockSignature)).resolves.toBeUndefined();
    expect(inspectTransaction).toHaveBeenCalledWith(mockRpc, mockSignature);
  });

  it("should not throw when transaction succeeds with multiple detailed logs", async () => {
    const mockResult = {
      status: "success" as const,
      logs: ["Program log: Instruction: Transfer", "Program log: Transfer completed", "Program success"],
    };
    (inspectTransaction as jest.Mock).mockResolvedValue(mockResult);

    await expect(expectTxToSucceed(mockRpc, mockSignature)).resolves.toBeUndefined();
  });

  it("should truncate logs to first 50 lines when transaction fails with many logs", async () => {
    const manyLogs = Array.from({ length: 100 }, (_, i) => `Program log: Line ${i + 1}`);
    const mockResult = {
      status: "failed" as const,
      logs: manyLogs,
    };
    (inspectTransaction as jest.Mock).mockResolvedValue(mockResult);

    try {
      await expectTxToSucceed(mockRpc, mockSignature);
      fail("Expected error to be thrown");
    } catch (error: any) {
      const errorLines = error.message.split("\n");
      expect(errorLines.length).toBe(51); // 1 error message + 50 log lines
      expect(error.message).toContain("Program log: Line 50");
      expect(error.message).not.toContain("Program log: Line 51");
    }
  });

  it("should throw specific error when inspectTransaction returns undefined", async () => {
    (inspectTransaction as jest.Mock).mockResolvedValue(undefined);

    await expect(expectTxToSucceed(mockRpc, mockSignature)).rejects.toThrow(
      `Transaction ${mockSignature} not found - may have failed or timed out`,
    );
  });
});
