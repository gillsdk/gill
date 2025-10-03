import { useMutation } from "@tanstack/react-query";
import { useAirdrop } from "../hooks/airdrop.js";

// Mock React Query and client hook

// Mock React Query
jest.mock("@tanstack/react-query", () => ({
  useMutation: jest.fn(),
}));

// Mock the client hook
jest.mock("../hooks/client", () => ({
  useSolanaClient: jest.fn(),
}));

const mockedUseMutation = useMutation as jest.MockedFunction<typeof useMutation>;
const { useSolanaClient } = require("../hooks/client");

describe("useAirdrop", () => {
  let mockRpc: any;
  let mockMutationResult: any;

  beforeEach(() => {
    mockRpc = {
      requestAirdrop: jest.fn().mockReturnValue({
        send: jest.fn().mockResolvedValue("test-signature-123"),
      }),
    };

    useSolanaClient.mockReturnValue({
      rpc: mockRpc,
    });

    mockMutationResult = {
      mutate: jest.fn(),
      mutateAsync: jest.fn(),
      data: undefined,
      error: null,
      isSuccess: false,
      isError: false,
      isPending: false,
    };

    mockedUseMutation.mockReturnValue(mockMutationResult);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it("should create mutation with correct configuration", () => {
    useAirdrop();

    expect(mockedUseMutation).toHaveBeenCalledWith({
      mutationFn: expect.any(Function),
    });
  });

  it("should call useSolanaClient to get RPC", () => {
    useAirdrop();
    expect(useSolanaClient).toHaveBeenCalled();
  });

  it("should handle custom configuration", () => {
    useAirdrop({
      config: { commitment: "finalized" },
      abortSignal: new AbortController().signal,
    });

    expect(mockedUseMutation).toHaveBeenCalledWith({
      mutationFn: expect.any(Function),
    });
  });

  it("should return mutation result", () => {
    const result = useAirdrop();
    expect(result).toBe(mockMutationResult);
  });

  describe("mutationFn", () => {
    it("should call requestAirdrop with correct parameters", async () => {
      useAirdrop();

      // Get the mutationFn from the call
      const mutationConfig = mockedUseMutation.mock.calls[0][0];
      const mutationFn = mutationConfig.mutationFn;

      const testAddress = "11111111111111111111111111111111";
      const testLamports = 1_000_000_000n;

      await mutationFn!({ address: testAddress, lamports: testLamports });

      expect(mockRpc.requestAirdrop).toHaveBeenCalledWith(testAddress, testLamports, { commitment: "confirmed" });
    });

    it("should re-throw other errors unchanged", async () => {
      useAirdrop();

      const mutationConfig = mockedUseMutation.mock.calls[0][0];
      const mutationFn = mutationConfig.mutationFn;

      const customError = new Error("Network timeout");
      mockRpc.requestAirdrop.mockReturnValue({
        send: jest.fn().mockRejectedValue(customError),
      });

      const testAddress = "11111111111111111111111111111111";
      const testLamports = 1_000_000_000n;

      await expect(mutationFn!({ address: testAddress, lamports: testLamports })).rejects.toThrow(customError);
    });
  });
});
