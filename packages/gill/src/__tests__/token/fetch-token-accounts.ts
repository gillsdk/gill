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
import type { Mint, Token } from "@solana-program/token-2022";
import { decodeToken, fetchMint } from "@solana-program/token-2022";

import { fetchTokenAccounts, FetchTokenAccountsConfig } from "../../programs";

// Mock the dependencies
jest.mock("@solana-program/token-2022", () => ({
  ...jest.requireActual("@solana-program/token-2022"),
  decodeToken: jest.fn(),
  fetchMint: jest.fn(),
}));
jest.mock("@solana/kit", () => ({
  ...jest.requireActual("@solana/kit"),
  parseBase64RpcAccount: jest.fn(),
}));

describe("fetchTokenAccounts", () => {
  let mockRpc: jest.Mocked<Rpc<GetAccountInfoApi & GetTokenAccountsByOwnerApi>>;
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
    exists: true,
    lamports: 2039280n as Lamports,
    programAddress: "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA" as Address,
    space: 0n,
  };

  const mockRpcResponse = {
    value: [
      {
        account: {
          data: "base64EncodedData",
          executable: false,
          lamports: 2039280,
          programAddress: "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA",
        },
        pubkey: "TokenAccount1" as Address,
      },
    ],
  };

  const mockMintAccount: Account<Mint> = {
    address: "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v" as Address,
    data: {
      decimals: 6,
      extensions: none(),
      freezeAuthority: none(),
      isInitialized: true,
      mintAuthority: some("authority" as Address),
      supply: 1000000n,
    },
    executable: false,
    lamports: 1461600n as Lamports,
    programAddress: "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA" as Address,
    space: 0n,
  };

  const mockTokenAccount: Account<Token> & { exists: true } = {
    address: "TokenAccount1" as Address,
    data: {
      amount: 500000n,
      closeAuthority: none(),
      delegate: none(),
      delegatedAmount: 0n,
      extensions: none(),
      isNative: none(),
      mint: "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v" as Address,
      owner: "GQuioVe2yA6KZfstgmirAvugfUZBcdxSi7sHK7JGk3gk" as Address,
      state: 1,
    },
    executable: false,
    exists: true,
    lamports: 2039280n as Lamports,
    programAddress: "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA" as Address,
    space: 0n,
  };

  const ownerAddress = "GQuioVe2yA6KZfstgmirAvugfUZBcdxSi7sHK7JGk3gk" as Address;

  beforeEach(() => {
    jest.clearAllMocks();

    mockSend = jest.fn();
    mockGetTokenAccountsByOwner = jest.fn().mockReturnValue({ send: mockSend });
    mockGetAccountInfo = jest.fn();
    mockRpc = {
      getAccountInfo: mockGetAccountInfo,
      getTokenAccountsByOwner: mockGetTokenAccountsByOwner,
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
      accounts: [mockTokenAccount],
      mint: mockMintAccount,
      totalBalance: 500000n,
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
      accounts: [mockTokenAccount],
      mint: mockMintAccount,
      totalBalance: 500000n,
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
          account: {
            data: "base64EncodedData1",
            executable: false,
            lamports: 2039280,
            programAddress: "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA",
          },
          pubkey: "TokenAccount1" as Address,
        },
        {
          account: {
            data: "base64EncodedData2",
            executable: false,
            lamports: 2039280,
            programAddress: "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA",
          },
          pubkey: "TokenAccount2" as Address,
        },
      ],
    };

    mockSend.mockResolvedValue(mockRpcResponse);
    mockParseBase64RpcAccount
      .mockReturnValueOnce({
        account: {
          data: "parsedData1",
          executable: false,
          lamports: 2039280n,
          programAddress: "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA" as Address,
        },
        address: "TokenAccount1" as Address,
      } as any)
      .mockReturnValueOnce({
        account: {
          data: "parsedData2",
          executable: false,
          lamports: 2039280n,
          programAddress: "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA" as Address,
        },
        address: "TokenAccount2" as Address,
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
      { commitment, encoding: "base64", minContextSlot: 123456n },
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
      accounts: [],
      mint: mockMintAccount,
      totalBalance: 0n,
    });
  });
});
