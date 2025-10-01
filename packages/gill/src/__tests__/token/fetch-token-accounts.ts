import type { Mint, Token } from "@solana-program/token-2022";
import { decodeToken, fetchMint } from "@solana-program/token-2022";
import type {
  Account,
  Address,
  Commitment,
  GetAccountInfoApi,
  GetTokenAccountsByOwnerApi,
  Lamports,
  Rpc,
} from "@solana/kit";
import { none, parseBase64RpcAccount, some } from "@solana/kit";
import { fetchTokenAccounts, FetchTokenAccountsConfig } from "../../programs";

// Mock the dependencies
jest.mock("@solana-program/token-2022", () => ({
  ...jest.requireActual("@solana-program/token-2022"),
  fetchMint: jest.fn(),
  decodeToken: jest.fn(),
}));
jest.mock("@solana/kit", () => ({
  ...jest.requireActual("@solana/kit"),
  parseBase64RpcAccount: jest.fn(),
}));

describe("fetchTokenAccounts", () => {
  let mockRpc: jest.Mocked<Rpc<GetTokenAccountsByOwnerApi & GetAccountInfoApi>>;
  let mockSend: jest.MockedFunction<any>;
  let mockGetTokenAccountsByOwner: jest.MockedFunction<any>;
  let mockGetAccountInfo: jest.MockedFunction<any>;

  const mockFetchMint = fetchMint as jest.MockedFunction<typeof fetchMint>;
  const mockDecodeToken = decodeToken as jest.MockedFunction<typeof decodeToken>;
  const mockParseBase64RpcAccount = parseBase64RpcAccount as jest.MockedFunction<typeof parseBase64RpcAccount>;
  const commitment: Commitment = "confirmed";

  const mockBase64EncodedRpcAccount = {
    address: "TokenAccount1" as Address,
    data: "parsedData" as any,
    executable: false,
    lamports: 2039280n as Lamports,
    exists: true,
    space: 0n,
    programAddress: "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA" as Address,
  };

  const mockRpcResponse = {
    value: [
      {
        pubkey: "TokenAccount1" as Address,
        account: {
          data: "base64EncodedData",
          executable: false,
          lamports: 2039280,
          programAddress: "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA",
        },
      },
    ],
  };

  const mockMintAccount: Account<Mint> = {
    address: "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v" as Address,
    data: {
      mintAuthority: some("authority" as Address),
      supply: 1000000n,
      decimals: 6,
      isInitialized: true,
      freezeAuthority: none(),
      extensions: none(),
    },
    executable: false,
    lamports: 1461600n as Lamports,
    programAddress: "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA" as Address,
    space: 0n,
  };

  const mockTokenAccount: Account<Token> & { exists: true } = {
    address: "TokenAccount1" as Address,
    data: {
      mint: "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v" as Address,
      owner: "GQuioVe2yA6KZfstgmirAvugfUZBcdxSi7sHK7JGk3gk" as Address,
      amount: 500000n,
      delegate: none(),
      state: 1,
      isNative: none(),
      delegatedAmount: 0n,
      closeAuthority: none(),
      extensions: none(),
    },
    executable: false,
    lamports: 2039280n as Lamports,
    programAddress: "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA" as Address,
    space: 0n,
    exists: true,
  };

  const ownerAddress = "GQuioVe2yA6KZfstgmirAvugfUZBcdxSi7sHK7JGk3gk" as Address;

  beforeEach(() => {
    jest.clearAllMocks();

    mockSend = jest.fn();
    mockGetTokenAccountsByOwner = jest.fn().mockReturnValue({ send: mockSend });
    mockGetAccountInfo = jest.fn();
    mockRpc = {
      getTokenAccountsByOwner: mockGetTokenAccountsByOwner,
      getAccountInfo: mockGetAccountInfo,
    } as any;
  });

  it("should fetch token accounts when mint is provided as Address", async () => {
    const mintAddress = "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v" as Address;

    mockFetchMint.mockResolvedValue(mockMintAccount);
    mockDecodeToken.mockReturnValue(mockTokenAccount);
    mockParseBase64RpcAccount.mockReturnValue(mockBase64EncodedRpcAccount);

    mockSend.mockResolvedValue(mockRpcResponse);

    const result = await fetchTokenAccounts(mockRpc, mintAddress, ownerAddress);

    expect(mockFetchMint).toHaveBeenCalledWith(mockRpc, mintAddress);
    expect(mockRpc.getTokenAccountsByOwner).toHaveBeenCalledWith(
      ownerAddress,
      { mint: mockMintAccount.address },
      { encoding: "base64" },
    );
    expect(result).toEqual({
      mint: mockMintAccount,
      totalBalance: 500000n,
      accounts: [mockTokenAccount],
    });
  });

  it("should fetch token accounts when mint is provided as Account", async () => {
    mockDecodeToken.mockReturnValue(mockTokenAccount);
    mockSend.mockResolvedValue(mockRpcResponse);
    mockParseBase64RpcAccount.mockReturnValue(mockBase64EncodedRpcAccount);

    const result = await fetchTokenAccounts(mockRpc, mockMintAccount, ownerAddress);

    expect(mockFetchMint).not.toHaveBeenCalled();
    expect(mockRpc.getTokenAccountsByOwner).toHaveBeenCalledWith(
      ownerAddress,
      { mint: mockMintAccount.address },
      { encoding: "base64" },
    );
    expect(result).toEqual({
      mint: mockMintAccount,
      totalBalance: 500000n,
      accounts: [mockTokenAccount],
    });
  });

  it("should handle multiple token accounts and calculate total balance", async () => {
    const mockTokenAccount2: Account<Token> & { exists: true } = {
      ...mockTokenAccount,
      address: "TokenAccount2" as Address,
      data: { ...mockTokenAccount.data, amount: 750000n },
    };

    const mockRpcResponse = {
      value: [
        {
          pubkey: "TokenAccount1" as Address,
          account: {
            data: "base64EncodedData1",
            executable: false,
            lamports: 2039280,
            programAddress: "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA",
          },
        },
        {
          pubkey: "TokenAccount2" as Address,
          account: {
            data: "base64EncodedData2",
            executable: false,
            lamports: 2039280,
            programAddress: "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA",
          },
        },
      ],
    };

    mockSend.mockResolvedValue(mockRpcResponse);
    mockParseBase64RpcAccount
      .mockReturnValueOnce({
        address: "TokenAccount1" as Address,
        account: {
          data: "parsedData1",
          executable: false,
          lamports: 2039280n,
          programAddress: "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA" as Address,
        },
      } as any)
      .mockReturnValueOnce({
        address: "TokenAccount2" as Address,
        account: {
          data: "parsedData2",
          executable: false,
          lamports: 2039280n,
          programAddress: "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA" as Address,
        },
      } as any);

    mockDecodeToken.mockReturnValueOnce(mockTokenAccount).mockReturnValueOnce(mockTokenAccount2);

    const result = await fetchTokenAccounts(mockRpc, mockMintAccount, ownerAddress);

    expect(result.totalBalance).toBe(1250000n); // 500000 + 750000
    expect(result.accounts).toHaveLength(2);
    expect(result.accounts).toEqual([mockTokenAccount, mockTokenAccount2]);
  });

  it("should pass config options to RPC call", async () => {
    const config: FetchTokenAccountsConfig = {
      commitment,
      minContextSlot: 123456n,
    };

    const mockRpcResponse = { value: [] };
    mockSend.mockResolvedValue(mockRpcResponse);

    await fetchTokenAccounts(mockRpc, mockMintAccount, ownerAddress, config);

    expect(mockRpc.getTokenAccountsByOwner).toHaveBeenCalledWith(
      ownerAddress,
      { mint: mockMintAccount.address },
      { commitment, minContextSlot: 123456n, encoding: "base64" },
    );
  });

  it("should accept abortSignal in config", async () => {
    const abortController = new AbortController();
    const config: FetchTokenAccountsConfig = {
      abortSignal: abortController.signal,
      commitment,
    };

    const mockRpcResponse = { value: [] };
    mockSend.mockResolvedValue(mockRpcResponse);

    await fetchTokenAccounts(mockRpc, mockMintAccount, ownerAddress, config);

    expect(mockRpc.getTokenAccountsByOwner).toHaveBeenCalledWith(
      ownerAddress,
      { mint: mockMintAccount.address },
      { commitment, encoding: "base64" },
    );
    expect(mockSend).toHaveBeenCalledWith({ abortSignal: abortController.signal });
  });

  it("should handle empty token accounts response", async () => {
    const mockRpcResponse = { value: [] };
    mockSend.mockResolvedValue(mockRpcResponse);

    const result = await fetchTokenAccounts(mockRpc, mockMintAccount, ownerAddress);

    expect(result).toEqual({
      mint: mockMintAccount,
      totalBalance: 0n,
      accounts: [],
    });
  });
});
