import type { Address } from "gill";
import type { SolanaClient } from "gill";
import { expectAccountToExist } from "../matchers/expectAccountToExist";

describe("expectAccountToExist", () => {
  let mockRpc: SolanaClient["rpc"];
  const mockAddress = "11111111111111111111111111111111" as Address;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should not throw when account exists", async () => {
    const mockAccountInfo = {
      value: {
        lamports: 1000000n,
        owner: mockAddress,
        data: new Uint8Array(),
        executable: false,
        rentEpoch: 0n,
      },
    };

    mockRpc = {
      getAccountInfo: jest.fn().mockReturnValue({
        send: jest.fn().mockResolvedValue(mockAccountInfo),
      }),
    } as unknown as SolanaClient["rpc"];

    await expect(expectAccountToExist(mockRpc, mockAddress)).resolves.toBeUndefined();
    expect(mockRpc.getAccountInfo).toHaveBeenCalledWith(mockAddress, { commitment: "confirmed" });
  });

  it("should throw when account does not exist", async () => {
    const mockAccountInfo = { value: null };

    mockRpc = {
      getAccountInfo: jest.fn().mockReturnValue({
        send: jest.fn().mockResolvedValue(mockAccountInfo),
      }),
    } as unknown as SolanaClient["rpc"];

    await expect(expectAccountToExist(mockRpc, mockAddress)).rejects.toThrow(`Account ${mockAddress} does not exist`);
  });

  it("should propagate RPC errors to caller", async () => {
    const rpcError = new Error("Network timeout");

    mockRpc = {
      getAccountInfo: jest.fn().mockReturnValue({
        send: jest.fn().mockRejectedValue(rpcError),
      }),
    } as unknown as SolanaClient["rpc"];

    await expect(expectAccountToExist(mockRpc, mockAddress)).rejects.toThrow("Network timeout");
  });
});
