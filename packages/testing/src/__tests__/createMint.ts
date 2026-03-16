import {
  createTransaction,
  generateKeyPairSigner,
  getMinimumBalanceForRentExemption,
  signTransactionMessageWithSigners,
  type SolanaClient,
} from "gill";
import { loadKeypairSignerFromFile } from "gill/node";
import { getCreateAccountInstruction, getInitializeMintInstruction, getMintSize } from "gill/programs";
import { createMint } from "../fixtures/createMint";

import {
  MOCK_CUSTOM_PAYER,
  MOCK_MINT_SIGNER,
  MOCK_MINT_SPACE,
  MOCK_PAYER,
  MOCK_RENT_EXEMPT_LAMPORTS,
  MOCK_TOKEN_PROGRAM_ADDRESS,
  MOCK_TRANSACTION_SIGNATURE,
  getMockRpc,
  setupCommonFixtureMocks,
  type CommonMocks,
} from "../helpers/common_setup";

jest.mock("gill", () => ({
  ...jest.requireActual("gill"),
  generateKeyPairSigner: jest.fn(),
  getMinimumBalanceForRentExemption: jest.fn(),
  createTransaction: jest.fn(),
  signTransactionMessageWithSigners: jest.fn(),
}));

jest.mock("gill/node", () => ({
  loadKeypairSignerFromFile: jest.fn(),
}));

jest.mock("gill/programs", () => {
  const programs = jest.requireActual("gill/programs");
  return {
    ...programs,
    getCreateAccountInstruction: jest.fn(),
    getInitializeMintInstruction: jest.fn(),
    getMintSize: jest.fn(),
    TOKEN_PROGRAM_ADDRESS: "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA",
  };
});

describe("createMint", () => {
  let mockRpc: SolanaClient["rpc"];
  let mockSendAndConfirmTransaction: jest.Mock;
  const mockTransactionSignature = MOCK_TRANSACTION_SIGNATURE;
  const mockSpace = MOCK_MINT_SPACE;
  const mockLamports = MOCK_RENT_EXEMPT_LAMPORTS;
  const commonMocks: CommonMocks = {
    loadKeypairSignerFromFile: loadKeypairSignerFromFile as jest.Mock,
    generateKeyPairSigner: generateKeyPairSigner as jest.Mock,
    createTransaction: createTransaction as jest.Mock,
    signTransactionMessageWithSigners: signTransactionMessageWithSigners as jest.Mock,
  };

  beforeEach(() => {
    mockSendAndConfirmTransaction = jest.fn().mockResolvedValue(mockTransactionSignature);
    mockRpc = getMockRpc(mockSendAndConfirmTransaction);

    setupCommonFixtureMocks(commonMocks, MOCK_PAYER, MOCK_MINT_SIGNER);

    (getMintSize as jest.Mock).mockReturnValue(mockSpace);
    (getMinimumBalanceForRentExemption as jest.Mock).mockReturnValue(mockLamports);
    (getCreateAccountInstruction as jest.Mock).mockReturnValue({ instruction: "mockCreateAccountInstruction" });
    (getInitializeMintInstruction as jest.Mock).mockReturnValue({ instruction: "mockInitializeMintInstruction" });
  });

  afterEach(() => jest.clearAllMocks());

  it("creates a mint with default parameters", async () => {
    const result = await createMint(mockRpc, mockSendAndConfirmTransaction);

    expect(result).toEqual({
      mint: MOCK_MINT_SIGNER,
      transactionSignature: mockTransactionSignature,
    });

    expect(getInitializeMintInstruction).toHaveBeenCalledWith(
      {
        mint: MOCK_MINT_SIGNER.address,
        mintAuthority: MOCK_PAYER.address,
        freezeAuthority: MOCK_PAYER.address,
        decimals: 9,
      },
      { programAddress: MOCK_TOKEN_PROGRAM_ADDRESS },
    );
  });

  it("creates a mint with custom payer and decimals", async () => {
    const result = await createMint(mockRpc, mockSendAndConfirmTransaction, {
      payer: MOCK_CUSTOM_PAYER,
      decimals: 4,
    });

    expect(result).toEqual({
      mint: MOCK_MINT_SIGNER,
      transactionSignature: mockTransactionSignature,
    });

    expect(getCreateAccountInstruction).toHaveBeenCalledWith(expect.objectContaining({ payer: MOCK_CUSTOM_PAYER }));

    expect(getInitializeMintInstruction).toHaveBeenCalledWith(
      {
        mint: MOCK_MINT_SIGNER.address,
        mintAuthority: MOCK_CUSTOM_PAYER.address,
        freezeAuthority: MOCK_CUSTOM_PAYER.address,
        decimals: 4,
      },
      { programAddress: MOCK_TOKEN_PROGRAM_ADDRESS },
    );
  });

  it("throws error for invalid decimals (<0 or >9)", async () => {
    await expect(createMint(mockRpc, mockSendAndConfirmTransaction, { decimals: -1 })).rejects.toThrow(
      "Invalid decimals value: -1. Must be between 0 and 9.",
    );

    await expect(createMint(mockRpc, mockSendAndConfirmTransaction, { decimals: 10 })).rejects.toThrow(
      "Invalid decimals value: 10. Must be between 0 and 9.",
    );
  });

  it("throws if RPC call fails", async () => {
    mockRpc.getLatestBlockhash = jest
      .fn()
      .mockReturnValue({ send: jest.fn().mockRejectedValue(new Error("RPC failed")) });

    await expect(createMint(mockRpc, mockSendAndConfirmTransaction)).rejects.toThrow("RPC failed");
  });

  it("throws if sendAndConfirmTransaction fails", async () => {
    mockSendAndConfirmTransaction.mockRejectedValue(new Error("Transaction failed"));
    await expect(createMint(mockRpc, mockSendAndConfirmTransaction)).rejects.toThrow("Transaction failed");
  });
});
