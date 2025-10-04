import { Signature, SolanaClient } from "gill";
import { expectTxToFailWith } from "../matchers/expectTxToFailWith";
import inspectTransaction from "../txLogInspector/inspectTransaction";
import findCustomError from "../txLogInspector/findCustomError";

jest.mock("../txLogInspector/inspectTransaction");
jest.mock("../txLogInspector/findCustomError");

describe("expectTxToFailWith", () => {
  let mockRpc: SolanaClient["rpc"];
  const mockSignature = "mock-signature-abc123" as Signature;

  beforeEach(() => {
    jest.clearAllMocks();
    mockRpc = {} as SolanaClient["rpc"];
  });

  it("should pass when error code matches", async () => {
    (inspectTransaction as jest.Mock).mockResolvedValue({
      status: "failed",
      logs: ["Program failed: error 0x23"],
    });
    (findCustomError as jest.Mock).mockReturnValue({
      errors: [{ errorCodeRaw: "0x23" }],
    });

    await expect(expectTxToFailWith(mockRpc, mockSignature, { code: "0x23" })).resolves.toBeUndefined();
  });

  it("should throw if transaction not found", async () => {
    (inspectTransaction as jest.Mock).mockResolvedValue(null);

    await expect(expectTxToFailWith(mockRpc, mockSignature)).rejects.toThrow(`Transaction ${mockSignature} not found`);
  });

  it("should pass when error name matches", async () => {
    (inspectTransaction as jest.Mock).mockResolvedValue({
      status: "failed",
      logs: ["Error: InsufficientFunds"],
    });
    (findCustomError as jest.Mock).mockReturnValue({
      errors: [{ errorName: "InsufficientFunds" }],
    });

    await expect(expectTxToFailWith(mockRpc, mockSignature, { name: "InsufficientFunds" })).resolves.toBeUndefined();
  });

  it("should throw if transaction succeeds unexpectedly", async () => {
    (inspectTransaction as jest.Mock).mockResolvedValue({
      status: "success",
      logs: [],
    });

    await expect(expectTxToFailWith(mockRpc, mockSignature)).rejects.toThrow(
      `Transaction ${mockSignature} succeeded but was expected to fail`,
    );
  });

  it("should pass when all criteria match (code, name, and message)", async () => {
    (inspectTransaction as jest.Mock).mockResolvedValue({
      status: "failed",
      logs: ["Error Code: InsufficientFunds. Error Number: 6000. Insufficient balance"],
    });
    (findCustomError as jest.Mock).mockReturnValue({
      errors: [{ errorCodeRaw: "6000", errorName: "InsufficientFunds" }],
    });

    await expect(
      expectTxToFailWith(mockRpc, mockSignature, {
        code: "6000",
        name: "InsufficientFunds",
        messageIncludes: "Insufficient balance",
      }),
    ).resolves.toBeUndefined();
  });

  it("should throw if error code does not match expected value", async () => {
    (inspectTransaction as jest.Mock).mockResolvedValue({
      status: "failed",
      logs: ["Program failed: error 0x24"],
    });
    (findCustomError as jest.Mock).mockReturnValue({
      errors: [{ errorCodeRaw: "0x24" }],
    });

    await expect(expectTxToFailWith(mockRpc, mockSignature, { code: "0x23" })).rejects.toThrow(
      "did not match expected error",
    );
  });
});
