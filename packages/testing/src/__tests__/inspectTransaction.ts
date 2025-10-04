import type { Address, Signature, SolanaClient } from "gill";
import inspectTransaction from "../txLogInspector/inspectTransaction";

describe("inspectTransaction (maintainable version)", () => {
  let mockRpc: SolanaClient["rpc"];
  const mockSignature = "mockTransactionSignature" as Signature;

  const mockAccount1 = "account1Address" as Address;
  const mockAccount2 = "account2Address" as Address;
  const mockAccount3 = "account3Address" as Address;
  const mockAccount4 = "account4Address" as Address;

  beforeEach(() => {
    mockRpc = {
      getTransaction: jest.fn(),
    } as unknown as SolanaClient["rpc"];
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it("should inspect a successful transaction and collect all accounts uniquely", async () => {
    const mockTransactionData = {
      slot: 123n,
      meta: {
        err: null,
        computeUnitsConsumed: 5000n,
        logMessages: ["Program log: Success"],
        loadedAddresses: {
          writable: [mockAccount3],
          readonly: [mockAccount4],
        },
      },
      transaction: {
        message: {
          accountKeys: [mockAccount1, mockAccount2],
        },
      },
    };

    (mockRpc.getTransaction as jest.Mock).mockReturnValue({
      send: jest.fn().mockResolvedValue(mockTransactionData),
    });

    const result = await inspectTransaction(mockRpc, mockSignature);

    expect(result).toEqual({
      transactionSignature: mockSignature,
      slot: 123n,
      status: "success",
      computeUnits: 5000,
      logs: ["Program log: Success"],
      accountsTouched: [mockAccount1, mockAccount2, mockAccount3, mockAccount4],
    });

    expect(mockRpc.getTransaction).toHaveBeenCalledWith(mockSignature, {
      commitment: "confirmed",
      maxSupportedTransactionVersion: 0,
      encoding: "json",
    });
  });

  it("should inspect a failed transaction", async () => {
    const mockTransactionData = {
      slot: 999n,
      meta: {
        err: { InstructionError: [0, "Custom error"] },
        computeUnitsConsumed: 10000n,
        logMessages: ["Program log: Failed"],
        loadedAddresses: null,
      },
      transaction: {
        message: { accountKeys: [mockAccount1] },
      },
    };

    (mockRpc.getTransaction as jest.Mock).mockReturnValue({
      send: jest.fn().mockResolvedValue(mockTransactionData),
    });

    const result = await inspectTransaction(mockRpc, mockSignature);
    expect(result?.status).toBe("failed");
    expect(result?.logs).toEqual(["Program log: Failed"]);
  });

  it("should return null if transaction is not found", async () => {
    (mockRpc.getTransaction as jest.Mock).mockReturnValue({
      send: jest.fn().mockResolvedValue(null),
    });

    const result = await inspectTransaction(mockRpc, mockSignature);
    expect(result).toBeNull();
  });

  it("should throw error if metadata is missing", async () => {
    const mockTransactionData = {
      slot: 123n,
      meta: null,
      transaction: { message: { accountKeys: [mockAccount1] } },
    };

    (mockRpc.getTransaction as jest.Mock).mockReturnValue({
      send: jest.fn().mockResolvedValue(mockTransactionData),
    });

    await expect(inspectTransaction(mockRpc, mockSignature)).rejects.toThrow("Transaction metadata not available");
  });

  it("should handle missing optional fields gracefully", async () => {
    const mockTransactionData = {
      slot: 123n,
      meta: {
        err: null,
        computeUnitsConsumed: null,
        logMessages: null,
        loadedAddresses: null,
      },
      transaction: { message: { accountKeys: null } },
    };

    (mockRpc.getTransaction as jest.Mock).mockReturnValue({
      send: jest.fn().mockResolvedValue(mockTransactionData),
    });

    const result = await inspectTransaction(mockRpc, mockSignature);
    expect(result?.computeUnits).toBeUndefined();
    expect(result?.logs).toEqual([]);
    expect(result?.accountsTouched).toEqual([]);
  });

  it("should deduplicate accountsTouched", async () => {
    const mockTransactionData = {
      slot: 123n,
      meta: {
        err: null,
        computeUnitsConsumed: 1000n,
        logMessages: ["Program log: OK"],
        loadedAddresses: { writable: [mockAccount1], readonly: [mockAccount2] },
      },
      transaction: { message: { accountKeys: [mockAccount1, mockAccount2] } },
    };

    (mockRpc.getTransaction as jest.Mock).mockReturnValue({
      send: jest.fn().mockResolvedValue(mockTransactionData),
    });

    const result = await inspectTransaction(mockRpc, mockSignature);
    expect(result?.accountsTouched).toHaveLength(2);
    expect(result?.accountsTouched).toEqual(expect.arrayContaining([mockAccount1, mockAccount2]));
  });

  it("should propagate RPC errors", async () => {
    const mockError = new Error("RPC failed");
    (mockRpc.getTransaction as jest.Mock).mockReturnValue({
      send: jest.fn().mockRejectedValue(mockError),
    });

    await expect(inspectTransaction(mockRpc, mockSignature)).rejects.toThrow("RPC failed");
  });
});
