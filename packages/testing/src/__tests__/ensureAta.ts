import {
  Address,
  createTransaction,
  signTransactionMessageWithSigners,
  type KeyPairSigner,
  type SolanaClient,
  type Signature,
} from "gill";
import { loadKeypairSignerFromFile } from "gill/node";
import { getAssociatedTokenAccountAddress, getCreateAssociatedTokenIdempotentInstruction } from "gill/programs";
import { ensureAta } from "../fixtures/ensureAta";

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
  const mockOwner = "mockOwnerAddress" as Address;
  const mockMint = "mockMintAddress" as Address;
  const mockTransactionSignature = "mockTransactionSignature" as Signature;

  beforeAll(() => {
    mockSigner = { address: "signerAddress" as Address, keyPair: {} as CryptoKeyPair } as KeyPairSigner;
  });

  beforeEach(() => {
    jest.clearAllMocks();

    mockRpc = {
      getLatestBlockhash: jest.fn().mockReturnValue({
        send: jest.fn().mockResolvedValue({ value: { blockhash: "mockBlockhash", lastValidBlockHeight: 123456789n } }),
      }),
    } as unknown as SolanaClient["rpc"];

    mockSendAndConfirmTransaction = jest.fn().mockResolvedValue(mockTransactionSignature);
    (loadKeypairSignerFromFile as jest.Mock).mockResolvedValue(mockSigner);
    (getAssociatedTokenAccountAddress as jest.Mock).mockResolvedValue("mockAtaAddress" as Address);
    (getCreateAssociatedTokenIdempotentInstruction as jest.Mock).mockReturnValue({
      instruction: "mockCreateAtaInstruction",
    });
    (createTransaction as jest.Mock).mockReturnValue({ transaction: "mockTransaction" });
    (signTransactionMessageWithSigners as jest.Mock).mockResolvedValue({ signatures: [] });
  });

  const customPayer: KeyPairSigner = {
    address: "customPayerAddress" as Address,
    keyPair: {} as CryptoKeyPair,
  } as KeyPairSigner;
  test.each([
    { payer: undefined, loadDefault: true },
    { payer: customPayer, loadDefault: false },
  ])("should ensure ATA with payer=%p", async ({ payer, loadDefault }) => {
    const result = await ensureAta(mockRpc, mockSendAndConfirmTransaction, { owner: mockOwner, mint: mockMint, payer });
    if (loadDefault) expect(loadKeypairSignerFromFile).toHaveBeenCalled();
    else expect(loadKeypairSignerFromFile).not.toHaveBeenCalled();

    expect(createTransaction).toHaveBeenCalledWith(expect.objectContaining({ feePayer: payer ?? mockSigner }));
    expect(result).toEqual({ ata: "mockAtaAddress", transactionSignature: mockTransactionSignature });
  });

  test.each([
    {
      mockFn: () => (loadKeypairSignerFromFile as jest.Mock).mockRejectedValue(new Error("Failed to load keypair")),
      error: "Failed to load keypair",
    },
    {
      mockFn: () => mockSendAndConfirmTransaction.mockRejectedValue(new Error("Transaction failed")),
      error: "Transaction failed",
    },
  ])("should throw error: %p", async ({ mockFn, error }) => {
    mockFn();
    await expect(
      ensureAta(mockRpc, mockSendAndConfirmTransaction, { owner: mockOwner, mint: mockMint }),
    ).rejects.toThrow(error);
  });
});
