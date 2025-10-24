import { Address, isSolanaError, Signature, SOLANA_ERROR__TRANSACTION_ERROR__UNKNOWN } from "@solana/kit";

import { getOldestSignatureForAddress } from "../core";

describe("getOldestSignatureForAddress", () => {
  // Sample test data
  const mockAddress = "mockAddress123" as Address;
  const mockSignature1 = { blockTime: 1000, signature: "sig1" as Signature, slot: 100 };
  const mockSignature2 = { blockTime: 900, signature: "sig2" as Signature, slot: 90 };
  const mockSignature3 = { blockTime: 800, signature: "sig3" as Signature, slot: 80 };
  const mockSignature4 = { blockTime: 700, signature: "sig4" as Signature, slot: 70 };

  // Reset mocks before each test
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("returns the oldest signature when there are signatures and less than the limit", async () => {
    const mockRpc = {
      getSignaturesForAddress: jest.fn().mockReturnValue({
        send: jest.fn().mockResolvedValue([mockSignature1, mockSignature2, mockSignature3]),
      }),
    };

    const result = await getOldestSignatureForAddress(mockRpc as any, mockAddress);

    expect(mockRpc.getSignaturesForAddress).toHaveBeenCalledWith(mockAddress, undefined);
    expect(result).toEqual(mockSignature3);
  });

  it("recursively fetches more signatures when limit is reached", async () => {
    // Create a mock that returns different results for different calls
    const mockRpc = {
      getSignaturesForAddress: jest
        .fn()
        .mockImplementationOnce(() => ({
          send: jest.fn().mockResolvedValue(
            Array(1000)
              .fill(null)
              .map((_, i) => ({
                blockTime: 10000 - i * 10,
                signature: `sig${i}`,
                slot: 1000 - i,
              })),
          ),
        }))
        .mockImplementationOnce(() => ({
          send: jest.fn().mockResolvedValue([mockSignature4]),
        })),
    };

    const result = await getOldestSignatureForAddress(mockRpc as any, mockAddress);

    // First call without before parameter
    expect(mockRpc.getSignaturesForAddress).toHaveBeenNthCalledWith(1, mockAddress, undefined);

    // Second call with before parameter set to the oldest signature from first batch
    expect(mockRpc.getSignaturesForAddress).toHaveBeenNthCalledWith(
      2,
      mockAddress,
      expect.objectContaining({
        before: "sig999", // The oldest from the first call has index 999
      }),
    );

    expect(result).toEqual(mockSignature4);
  });

  it("throws SolanaError when no signatures are found", async () => {
    const mockRpc = {
      getSignaturesForAddress: jest.fn().mockReturnValue({
        send: jest.fn().mockResolvedValue([]),
      }),
    };

    try {
      await getOldestSignatureForAddress(mockRpc as any, mockAddress);
      fail("Expected function to throw, but it did not");
    } catch (err) {
      expect(isSolanaError(err, SOLANA_ERROR__TRANSACTION_ERROR__UNKNOWN)).toBe(true);
      expect((err as any).context.errorName).toBe("OldestSignatureNotFound");
    }
  });

  it("returns the oldest signature from first batch if recursive call fails with 'not found'", async () => {
    const mockRpc = {
      getSignaturesForAddress: jest
        .fn()
        .mockImplementationOnce(() => ({
          send: jest.fn().mockResolvedValue(
            Array(1000)
              .fill(null)
              .map((_, i) => ({
                blockTime: 10000 - i * 10,
                signature: `sig${i}`,
                slot: 1000 - i,
              })),
          ),
        }))
        .mockImplementationOnce(() => ({
          send: jest.fn().mockResolvedValue([]),
        })),
    };

    const result = await getOldestSignatureForAddress(mockRpc as any, mockAddress);

    expect(result).toEqual({
      blockTime: 10,
      signature: "sig999",
      slot: 1,
    });
  });

  it("passes the abort signal to the RPC call", async () => {
    const abortSignal = new AbortController().signal;

    const mockSendFn = jest.fn().mockResolvedValue([mockSignature1]);
    const mockRpc = {
      getSignaturesForAddress: jest.fn().mockReturnValue({
        send: mockSendFn,
      }),
    };

    await getOldestSignatureForAddress(mockRpc as any, mockAddress, { abortSignal });

    expect(mockRpc.getSignaturesForAddress).toHaveBeenCalledWith(mockAddress, expect.objectContaining({ abortSignal }));
    expect(mockSendFn).toHaveBeenCalledWith({ abortSignal });
  });

  it("passes through other config options correctly", async () => {
    const mockRpc = {
      getSignaturesForAddress: jest.fn().mockReturnValue({
        send: jest.fn().mockResolvedValue([mockSignature1]),
      }),
    };

    const config = {
      abortSignal: new AbortController().signal,
      before: "someSig" as Signature,
      limit: 50,
      until: "untilSig" as Signature,
    };

    await getOldestSignatureForAddress(mockRpc as any, mockAddress, config);

    expect(mockRpc.getSignaturesForAddress).toHaveBeenCalledWith(
      mockAddress,
      expect.objectContaining({
        abortSignal: config.abortSignal,
        before: "someSig",
        limit: 50,
        until: "untilSig",
      }),
    );
  });

  it("rethrows unknown errors", async () => {
    const mockRpc = {
      getSignaturesForAddress: jest
        .fn()
        .mockImplementationOnce(() => ({
          send: jest.fn().mockResolvedValue(
            Array(1000)
              .fill(null)
              .map((_, i) => ({
                blockTime: 10000 - i * 10,
                signature: `sig${i}`,
                slot: 1000 - i,
              })),
          ),
        }))
        .mockImplementationOnce(() => ({
          send: jest.fn().mockRejectedValue(new Error("Network error")),
        })),
    };

    await expect(getOldestSignatureForAddress(mockRpc as any, mockAddress)).rejects.toEqual(new Error("Network error"));
  });
});
