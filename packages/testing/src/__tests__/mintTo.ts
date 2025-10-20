import type { Signature, KeyPairSigner } from "gill";
import { createTransaction, signTransactionMessageWithSigners, type Address, lamports, type SolanaClient } from "gill";
import { loadKeypairSignerFromFile } from "gill/node";
import { getAssociatedTokenAccountAddress, getMintToInstruction, TOKEN_PROGRAM_ADDRESS } from "gill/programs";
import { ensureAta } from "../fixtures/ensureAta";
import { mintTo } from "../fixtures/mintTo";

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
  let mockSigner: KeyPairSigner;
  let mockRpc: SolanaClient["rpc"];
  let mockSendAndConfirmTransaction: jest.Mock;

  const mockMint = "mockMintAddress" as Address;
  const mockToOwner = "mockOwnerAddress" as Address;
  const mockAta = "mockAtaAddress" as Address;
  const mockAmount = lamports(1000n);
  const mockTransactionSignature = "mockTransactionSignature" as Signature;
  const mockLatestBlockhash = { blockhash: "mockBlockhash", lastValidBlockHeight: 123456789n };
  const mockSignedTransaction = { signatures: [] };

  beforeAll(() => {
    mockSigner = { address: "signerAddress" as Address, keyPair: {} as CryptoKeyPair } as KeyPairSigner;
  });

  beforeEach(() => {
    jest.clearAllMocks();

    mockRpc = {
      getLatestBlockhash: jest
        .fn()
        .mockReturnValue({ send: jest.fn().mockResolvedValue({ value: mockLatestBlockhash }) }),
    } as unknown as SolanaClient["rpc"];

    mockSendAndConfirmTransaction = jest.fn().mockResolvedValue(mockTransactionSignature);

    (loadKeypairSignerFromFile as jest.Mock).mockResolvedValue(mockSigner);
    (ensureAta as jest.Mock).mockResolvedValue({ ata: mockAta });
    (getAssociatedTokenAccountAddress as jest.Mock).mockResolvedValue(mockAta);
    (getMintToInstruction as jest.Mock).mockReturnValue({ instruction: "mockMintToInstruction" });
    (createTransaction as jest.Mock).mockReturnValue({ transaction: "mockTransaction" });
    (signTransactionMessageWithSigners as jest.Mock).mockResolvedValue(mockSignedTransaction);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  const customPayer: KeyPairSigner = {
    address: "customPayerAddress" as Address,
    keyPair: {} as CryptoKeyPair,
  } as KeyPairSigner;

  test.each([
    { payer: undefined, loadDefault: true },
    { payer: customPayer, loadDefault: false },
  ])("should mint tokens with payer=%p", async ({ payer, loadDefault }) => {
    const result = await mintTo(mockRpc, mockSendAndConfirmTransaction, {
      mint: mockMint,
      owner: mockToOwner,
      amount: mockAmount,
      payer,
    });

    if (loadDefault) expect(loadKeypairSignerFromFile).toHaveBeenCalled();
    else expect(loadKeypairSignerFromFile).not.toHaveBeenCalled();

    expect(ensureAta).toHaveBeenCalledWith(mockRpc, mockSendAndConfirmTransaction, {
      owner: mockToOwner,
      mint: mockMint,
    });
    expect(createTransaction).toHaveBeenCalledWith(expect.objectContaining({ feePayer: payer ?? mockSigner }));
    expect(result).toEqual({ ata: mockAta, transactionSignature: mockTransactionSignature, mintedAmount: mockAmount });
  });

  it("should mint tokens without ensuring ATA when ensureAta is false", async () => {
    const result = await mintTo(mockRpc, mockSendAndConfirmTransaction, {
      mint: mockMint,
      owner: mockToOwner,
      amount: mockAmount,
      ensureAta: false,
    });

    expect(ensureAta).not.toHaveBeenCalled();
    expect(getAssociatedTokenAccountAddress).toHaveBeenCalledWith(mockMint, mockToOwner, TOKEN_PROGRAM_ADDRESS);
    expect(result.ata).toBe(mockAta);
    expect(result.transactionSignature).toBe(mockTransactionSignature);
    expect(result.mintedAmount).toBe(mockAmount);
  });

  test.each([
    { params: { amount: lamports(0n) }, mockFn: undefined, error: "Amount must be greater than 0" },
    {
      params: {},
      mockFn: () => (loadKeypairSignerFromFile as jest.Mock).mockRejectedValue(new Error("Failed to load keypair")),
      error: "Failed to load keypair",
    },
    {
      params: {},
      mockFn: () => (ensureAta as jest.Mock).mockRejectedValue(new Error("Failed to ensure ATA")),
      error: "Failed to ensure ATA",
    },
    {
      params: {},
      mockFn: () => mockSendAndConfirmTransaction.mockRejectedValue(new Error("Transaction failed")),
      error: "Transaction failed",
    },
  ])("should throw error: %p", async ({ params, mockFn, error }) => {
    mockFn?.();
    await expect(
      mintTo(mockRpc, mockSendAndConfirmTransaction, {
        mint: mockMint,
        owner: mockToOwner,
        amount: mockAmount,
        ...params,
      }),
    ).rejects.toThrow(error);
  });
});
