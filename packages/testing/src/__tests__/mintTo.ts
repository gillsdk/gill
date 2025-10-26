import { createTransaction, lamports, signTransactionMessageWithSigners, type Address, type SolanaClient } from "gill";
import { loadKeypairSignerFromFile } from "gill/node";
import { getAssociatedTokenAccountAddress, getMintToInstruction } from "gill/programs";
import { ensureAta } from "../fixtures/ensureAta";
import { mintTo } from "../fixtures/mintTo";

import {
  MOCK_ATA_ADDRESS,
  MOCK_CUSTOM_PAYER,
  MOCK_LATEST_BLOCKHASH,
  MOCK_MINT_ADDRESS,
  MOCK_MINT_TO_AMOUNT,
  MOCK_OWNER_ADDRESS,
  MOCK_PAYER,
  MOCK_TOKEN_PROGRAM_ADDRESS,
  MOCK_TRANSACTION_SIGNATURE,
  getMockRpc,
  setupCommonFixtureMocks,
  type CommonMocks,
} from "../helpers/common_setup";

jest.mock("gill", () => ({
  ...jest.requireActual("gill"),
  createTransaction: jest.fn(),
  signTransactionMessageWithSigners: jest.fn(),
}));

jest.mock("gill/node", () => ({
  loadKeypairSignerFromFile: jest.fn(),
}));

jest.mock("gill/programs", () => ({
  ...jest.requireActual("gill/programs"),
  getAssociatedTokenAccountAddress: jest.fn(),
  getMintToInstruction: jest.fn(),
  TOKEN_PROGRAM_ADDRESS: "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA" as Address,
}));

jest.mock("../fixtures/ensureAta", () => ({
  ensureAta: jest.fn(),
}));

describe("mintTo", () => {
  let mockRpc: SolanaClient["rpc"];
  let mockSendAndConfirmTransaction: jest.Mock;

  const commonMocks: CommonMocks = {
    loadKeypairSignerFromFile: loadKeypairSignerFromFile as jest.Mock,
    getAssociatedTokenAccountAddress: getAssociatedTokenAccountAddress as jest.Mock,
    createTransaction: createTransaction as jest.Mock,
    signTransactionMessageWithSigners: signTransactionMessageWithSigners as jest.Mock,
  };

  beforeEach(() => {
    jest.clearAllMocks();

    mockSendAndConfirmTransaction = jest.fn().mockResolvedValue(MOCK_TRANSACTION_SIGNATURE);
    mockRpc = getMockRpc(mockSendAndConfirmTransaction);

    (mockRpc.getLatestBlockhash as jest.Mock).mockReturnValue({
      send: jest.fn().mockResolvedValue({ value: MOCK_LATEST_BLOCKHASH }),
    });

    setupCommonFixtureMocks(commonMocks, MOCK_PAYER);

    (ensureAta as jest.Mock).mockResolvedValue({
      ata: MOCK_ATA_ADDRESS,
      transactionSignature: "ensureAtaSig",
    });
    (getMintToInstruction as jest.Mock).mockReturnValue({ instruction: "mockMintToInstruction" });
  });

  test.each([
    { payer: undefined, loadDefault: true },
    { payer: MOCK_CUSTOM_PAYER, loadDefault: false },
  ])("should mint with payer=%p", async ({ payer, loadDefault }) => {
    const result = await mintTo(mockRpc, mockSendAndConfirmTransaction, {
      mint: MOCK_MINT_ADDRESS,
      owner: MOCK_OWNER_ADDRESS,
      amount: MOCK_MINT_TO_AMOUNT,
      payer,
    });

    if (loadDefault) expect(loadKeypairSignerFromFile).toHaveBeenCalled();
    else expect(loadKeypairSignerFromFile).not.toHaveBeenCalled();

    expect(ensureAta).toHaveBeenCalledWith(mockRpc, mockSendAndConfirmTransaction, {
      owner: MOCK_OWNER_ADDRESS,
      mint: MOCK_MINT_ADDRESS,
    });

    expect(createTransaction).toHaveBeenCalledWith(
      expect.objectContaining({
        feePayer: payer ?? MOCK_PAYER,
        latestBlockhash: MOCK_LATEST_BLOCKHASH,
      }),
    );

    expect(result).toEqual({
      ata: MOCK_ATA_ADDRESS,
      transactionSignature: MOCK_TRANSACTION_SIGNATURE,
      mintedAmount: MOCK_MINT_TO_AMOUNT,
    });
  });

  test("should mint without ensuring ATA", async () => {
    const result = await mintTo(mockRpc, mockSendAndConfirmTransaction, {
      mint: MOCK_MINT_ADDRESS,
      owner: MOCK_OWNER_ADDRESS,
      amount: MOCK_MINT_TO_AMOUNT,
      ensureAta: false,
    });

    expect(ensureAta).not.toHaveBeenCalled();
    expect(getAssociatedTokenAccountAddress).toHaveBeenCalledWith(
      MOCK_MINT_ADDRESS,
      MOCK_OWNER_ADDRESS,
      MOCK_TOKEN_PROGRAM_ADDRESS,
    );

    expect(result).toEqual({
      ata: MOCK_ATA_ADDRESS,
      transactionSignature: MOCK_TRANSACTION_SIGNATURE,
      mintedAmount: MOCK_MINT_TO_AMOUNT,
    });
  });

  test.each([
    {
      params: { amount: lamports(0n) },
      mockFn: undefined,
      error: "Amount must be greater than 0",
    },
    {
      params: {},
      mockFn: () => commonMocks.loadKeypairSignerFromFile!.mockRejectedValueOnce(new Error("Failed to load keypair")),
      error: "Failed to load keypair",
    },
    {
      params: {},
      mockFn: () => (ensureAta as jest.Mock).mockRejectedValueOnce(new Error("Failed to ensure ATA")),
      error: "Failed to ensure ATA",
    },
    {
      params: {},
      mockFn: () => mockSendAndConfirmTransaction.mockRejectedValueOnce(new Error("Transaction failed")),
      error: "Transaction failed",
    },
  ])("throws error: $error", async ({ params, mockFn, error }) => {
    mockFn?.();

    await expect(
      mintTo(mockRpc, mockSendAndConfirmTransaction, {
        mint: MOCK_MINT_ADDRESS,
        owner: MOCK_OWNER_ADDRESS,
        amount: params.amount ?? MOCK_MINT_TO_AMOUNT,
        ...params,
      }),
    ).rejects.toThrow(error);
  });
});
