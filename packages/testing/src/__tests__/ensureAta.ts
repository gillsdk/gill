import { createTransaction, signTransactionMessageWithSigners, type KeyPairSigner, type SolanaClient } from "gill";
import { loadKeypairSignerFromFile } from "gill/node";
import { getAssociatedTokenAccountAddress, getCreateAssociatedTokenIdempotentInstruction } from "gill/programs";
import { ensureAta } from "../fixtures/ensureAta";

import {
  MOCK_ATA_ADDRESS,
  MOCK_CUSTOM_PAYER,
  MOCK_LATEST_BLOCKHASH,
  MOCK_MINT_ADDRESS,
  MOCK_OWNER_ADDRESS,
  MOCK_PAYER,
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
  getCreateAssociatedTokenIdempotentInstruction: jest.fn(),
}));

describe("ensureAta", () => {
  let mockSigner: KeyPairSigner;
  let mockRpc: SolanaClient["rpc"];
  let mockSendAndConfirmTransaction: jest.Mock;

  const mockOwner = MOCK_OWNER_ADDRESS;
  const mockMint = MOCK_MINT_ADDRESS;
  const mockTransactionSignature = MOCK_TRANSACTION_SIGNATURE;
  const mockAtaAddress = MOCK_ATA_ADDRESS;
  const customPayer: KeyPairSigner = MOCK_CUSTOM_PAYER;

  const commonMocks: CommonMocks = {
    loadKeypairSignerFromFile: loadKeypairSignerFromFile as jest.Mock,
    getAssociatedTokenAccountAddress: getAssociatedTokenAccountAddress as jest.Mock,
    createTransaction: createTransaction as jest.Mock,
    signTransactionMessageWithSigners: signTransactionMessageWithSigners as jest.Mock,
  };

  beforeAll(() => {
    mockSigner = MOCK_PAYER;
  });

  beforeEach(() => {
    jest.clearAllMocks();

    mockSendAndConfirmTransaction = jest.fn().mockResolvedValue(mockTransactionSignature);
    mockRpc = getMockRpc(mockSendAndConfirmTransaction);

    (mockRpc.getLatestBlockhash as jest.Mock).mockReturnValue({
      send: jest.fn().mockResolvedValue({ value: MOCK_LATEST_BLOCKHASH }),
    });

    setupCommonFixtureMocks(commonMocks, MOCK_PAYER);

    (getCreateAssociatedTokenIdempotentInstruction as jest.Mock).mockReturnValue({
      instruction: "mockCreateAtaInstruction",
    });
  });

  test.each([
    { payer: undefined, loadDefault: true },
    { payer: customPayer, loadDefault: false },
  ])("should create ATA with payer=%p", async ({ payer, loadDefault }) => {
    const result = await ensureAta(mockRpc, mockSendAndConfirmTransaction, {
      owner: mockOwner,
      mint: mockMint,
      payer,
    });

    if (loadDefault) expect(loadKeypairSignerFromFile).toHaveBeenCalled();
    else expect(loadKeypairSignerFromFile).not.toHaveBeenCalled();

    expect(createTransaction).toHaveBeenCalledWith(
      expect.objectContaining({
        feePayer: payer ?? mockSigner,
        latestBlockhash: MOCK_LATEST_BLOCKHASH,
      }),
    );

    expect(result).toEqual({ ata: mockAtaAddress, transactionSignature: mockTransactionSignature });
  });

  test.each([
    {
      mockFn: () => commonMocks.loadKeypairSignerFromFile!.mockRejectedValueOnce(new Error("Failed to load keypair")),
      error: "Failed to load keypair",
    },
    {
      mockFn: () => mockSendAndConfirmTransaction.mockRejectedValueOnce(new Error("Transaction failed")),
      error: "Transaction failed",
    },
  ])("throws error: $error", async ({ mockFn, error }) => {
    mockFn();

    await expect(
      ensureAta(mockRpc, mockSendAndConfirmTransaction, { owner: mockOwner, mint: mockMint }),
    ).rejects.toThrow(error);
  });
});
