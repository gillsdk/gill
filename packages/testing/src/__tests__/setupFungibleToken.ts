import { KeyPairSigner, lamports, type SolanaClient } from "gill";
import { createMint } from "../fixtures/createMint";
import { mintTo } from "../fixtures/mintTo";
import { setupFungibleToken } from "../fixtures/setupFungibleToken";

import {
  MOCK_ATA_ADDRESS,
  MOCK_MINT_ADDRESS,
  MOCK_MINT_TO_AMOUNT,
  MOCK_OWNER_ADDRESS,
  MOCK_PAYER,
  MOCK_TRANSACTION_SIGNATURE,
  getMockRpc,
  mockSigner,
} from "../helpers/common_setup";

jest.mock("../fixtures/createMint");
jest.mock("../fixtures/mintTo");

describe("setupFungibleToken", () => {
  let mockPayer: KeyPairSigner;
  let mockRpc: SolanaClient["rpc"];
  let mockSendAndConfirmTransaction: jest.Mock;

  const mockOwner = MOCK_OWNER_ADDRESS;
  const mockMint = MOCK_MINT_ADDRESS;
  const mockAta = MOCK_ATA_ADDRESS;
  const mockTransactionSignature = MOCK_TRANSACTION_SIGNATURE;
  const mockMintedAmount = MOCK_MINT_TO_AMOUNT;
  const mockMintSigner = mockSigner(mockMint);

  beforeAll(() => {
    mockPayer = MOCK_PAYER;

    mockSendAndConfirmTransaction = jest.fn().mockResolvedValue(mockTransactionSignature);

    mockRpc = getMockRpc(mockSendAndConfirmTransaction);
  });

  beforeEach(() => {
    (createMint as jest.Mock).mockResolvedValue({
      mint: mockMintSigner,
      transactionSignature: "createMintSig",
    });

    (mintTo as jest.Mock).mockResolvedValue({
      ata: mockAta,
      transactionSignature: mockTransactionSignature,
      mintedAmount: mockMintedAmount,
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  // Parameterized tests for different decimals and amounts
  test.each([
    { decimals: undefined, amount: undefined, expectedDecimals: 9, expectedAmount: lamports(1_000_000n) },
    { decimals: 6, amount: undefined, expectedDecimals: 6, expectedAmount: lamports(1_000_000n) },
    { decimals: 2, amount: lamports(2000n), expectedDecimals: 2, expectedAmount: lamports(2000n) },
    { decimals: undefined, amount: lamports(5000n), expectedDecimals: 9, expectedAmount: lamports(5000n) },
  ])(
    "should setup fungible token with decimals=$decimals and amount=$amount",
    async ({ decimals, amount, expectedDecimals, expectedAmount }) => {
      const result = await setupFungibleToken(mockRpc, mockSendAndConfirmTransaction, {
        payer: mockPayer,
        owner: mockOwner,
        decimals,
        amount,
      });

      expect(result.decimals).toBe(expectedDecimals);
      expect(result.mint).toBe(mockMint);
      expect(result.ata).toBe(mockAta);
      expect(result.transactionSignature).toBe(mockTransactionSignature);
      expect(result.mintedAmount).toBe(mockMintedAmount);

      expect(createMint).toHaveBeenCalledWith(mockRpc, mockSendAndConfirmTransaction, {
        decimals: expectedDecimals,
        mintAuthority: mockPayer,
        freezeAuthority: mockPayer,
        payer: mockPayer,
      });

      expect(mintTo).toHaveBeenCalledWith(mockRpc, mockSendAndConfirmTransaction, {
        mint: mockMint,
        owner: mockOwner,
        amount: expectedAmount,
        ensureAta: true,
        payer: mockPayer,
        mintAuthority: mockPayer,
      });
    },
  );

  it("should throw when createMint fails", async () => {
    const mockError = new Error("Failed to create mint");
    (createMint as jest.Mock).mockRejectedValue(mockError);

    await expect(
      setupFungibleToken(mockRpc, mockSendAndConfirmTransaction, { payer: mockPayer, owner: mockOwner }),
    ).rejects.toThrow(mockError);
  });

  it("should throw when mintTo fails", async () => {
    const mockError = new Error("Failed to mint tokens");
    (mintTo as jest.Mock).mockRejectedValue(mockError);

    await expect(
      setupFungibleToken(mockRpc, mockSendAndConfirmTransaction, { payer: mockPayer, owner: mockOwner }),
    ).rejects.toThrow(mockError);
  });
});
