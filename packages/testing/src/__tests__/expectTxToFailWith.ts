import { Signature, SolanaClient } from "gill";
import { expectTxToFailWith } from "../matchers/expectTxToFailWith";
import { inspectTransaction } from "../txLogInspector/inspectTransaction";
import { findCustomError } from "../txLogInspector/findCustomError";

jest.mock("../txLogInspector/inspectTransaction");
jest.mock("../txLogInspector/findCustomError");

describe("expectTxToFailWith", () => {
  let mockRpc: SolanaClient["rpc"];
  const mockSignature =
    "5VERv8NMvzbJMEkV8xnrLkEaWRtSz9CosKDYjCJjBRnbJLgp8uirBgmQpjKhoR4tjF3ZpRzrFmBV6UjKdiSZkQtW" as Signature;

  beforeEach(() => {
    jest.clearAllMocks();
    mockRpc = {} as SolanaClient["rpc"];
  });

  describe("with transaction signature", () => {
    test.each([
      [{ code: "0x23" }, { errors: [{ errorCodeRaw: "0x23" }] }],
      [{ name: "InsufficientFunds" }, { errors: [{ errorName: "InsufficientFunds" }] }],
      [
        { code: "6000", name: "InsufficientFunds", messageIncludes: "Insufficient balance" },
        { errors: [{ errorCodeRaw: "6000", errorName: "InsufficientFunds" }] },
      ],
    ])("should pass when transaction fails and matches options %o", async (options, customError) => {
      (inspectTransaction as jest.Mock).mockResolvedValue({
        status: "failed",
        logs: ["Program log: Error Message: InsufficientFunds (6000) - Insufficient balance"],
      });
      (findCustomError as jest.Mock).mockReturnValue(customError);

      await expect(expectTxToFailWith(mockRpc, mockSignature, options)).resolves.toBeUndefined();
    });

    it("should throw if transaction not found", async () => {
      (inspectTransaction as jest.Mock).mockResolvedValue(null);
      await expect(expectTxToFailWith(mockRpc, mockSignature)).rejects.toThrow(
        `Transaction ${mockSignature} not found`,
      );
    });

    it("should throw if transaction succeeds unexpectedly", async () => {
      (inspectTransaction as jest.Mock).mockResolvedValue({ status: "success", logs: [] });
      await expect(expectTxToFailWith(mockRpc, mockSignature)).rejects.toThrow(
        `Transaction ${mockSignature} succeeded but was expected to fail`,
      );
    });
  });

  describe("with raw logs array", () => {
    test.each([
      [
        { code: "6001", name: "UnauthorizedAccess", messageIncludes: "not allowed" },
        [
          "Program invoke [1]",
          "Program log: Error Message: UnauthorizedAccess (6001) - not allowed",
          "Program failed: custom program error: 0x1771",
        ],
        { errors: [{ errorCodeRaw: "6001", errorName: "UnauthorizedAccess" }] },
        true,
      ],
      [{ code: "6000" }, ["Program invoke [1]", "Program failed"], null, false],
      [
        { name: "ExpectedError" },
        ["Program log: Error: WrongError", "Program failed"],
        { errors: [{ errorName: "WrongError" }] },
        false,
      ],
    ])("should handle raw logs with options %o", async (options, logs, customError, shouldPass) => {
      (findCustomError as jest.Mock).mockReturnValue(customError);

      if (shouldPass) {
        await expect(expectTxToFailWith(mockRpc, logs, options)).resolves.toBeUndefined();
      } else {
        await expect(expectTxToFailWith(mockRpc, logs, options)).rejects.toThrow();
      }
    });
  });
});
