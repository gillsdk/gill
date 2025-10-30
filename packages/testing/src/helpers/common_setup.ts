import type { KeyPairSigner, Address, Signature, SolanaClient, Lamports, TransactionMessage } from "gill";

// Mock Addresses
export const MOCK_PAYER_ADDRESS = "payerAddress" as Address;
export const MOCK_OWNER_ADDRESS = "mockOwnerAddress" as Address;
export const MOCK_MINT_ADDRESS = "mockMintAddress" as Address;
export const MOCK_ATA_ADDRESS = "mockAtaAddress" as Address;
export const MOCK_TOKEN_PROGRAM_ADDRESS = "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA" as Address;

// Mock Signatures and Transactions
export const MOCK_TRANSACTION_SIGNATURE = "mockTxSig" as Signature;
export const MOCK_SIGNED_TRANSACTION = { signatures: [] } as unknown as TransactionMessage;
export const MOCK_TRANSACTION_OBJECT = { transaction: "mockTransaction" };
export const MOCK_MINT_TO_AMOUNT = 1_000_000n as Lamports;
export const MOCK_RENT_EXEMPT_LAMPORTS = 1461600n as Lamports;
export const MOCK_MINT_SPACE = 82;

// Mock Blockhash Data (ensures consistency across all RPC mocks)
export const MOCK_LATEST_BLOCKHASH = {
  blockhash: "mockBlockhash",
  lastValidBlockHeight: 123456789n,
};

export const mockSigner = (address: string): KeyPairSigner =>
  ({
    address: address as Address,
    keyPair: {} as CryptoKeyPair,
  }) as KeyPairSigner;

// Centralized Signer Instances
export const MOCK_PAYER = mockSigner(MOCK_PAYER_ADDRESS);
export const MOCK_MINT_SIGNER = mockSigner(MOCK_MINT_ADDRESS);
export const MOCK_CUSTOM_PAYER = mockSigner("customPayerAddress");

export const getMockRpc = (mockSendAndConfirmTransaction: jest.Mock): SolanaClient["rpc"] => {
  const mockRpc = {
    getLatestBlockhash: jest.fn().mockReturnValue({
      send: jest.fn().mockResolvedValue({ value: MOCK_LATEST_BLOCKHASH }),
    }),

    getMinimumBalanceForRentExemption: jest.fn().mockResolvedValue({
      send: jest.fn().mockResolvedValue({ value: MOCK_RENT_EXEMPT_LAMPORTS }),
    }),
  } as unknown as SolanaClient["rpc"];

  (mockRpc as any).sendAndConfirmTransaction = mockSendAndConfirmTransaction;

  return mockRpc;
};

//** Defines the shape of the mocked functions that must be passed in. */
export interface CommonMocks {
  // All properties are now optional to allow test files to pass only what they need
  loadKeypairSignerFromFile?: jest.Mock;
  generateKeyPairSigner?: jest.Mock;
  getAssociatedTokenAccountAddress?: jest.Mock;
  createTransaction?: jest.Mock;
  signTransactionMessageWithSigners?: jest.Mock;
}

/**
 * Sets up all commonly mocked dependencies from 'gill', 'gill/node', and 'gill/programs'.
 * * NOTE: Due to Jest hoisting, the actual jest.Mock functions must be passed in
 * from the individual test file's imports.
 */
export const setupCommonFixtureMocks = (
  mocks: CommonMocks,
  mockPayer: KeyPairSigner = MOCK_PAYER,
  mockMint: KeyPairSigner = MOCK_MINT_SIGNER,
) => {
  // gill/node
  if (mocks.loadKeypairSignerFromFile) {
    mocks.loadKeypairSignerFromFile.mockResolvedValue(mockPayer);
  }

  // gill
  if (mocks.generateKeyPairSigner) {
    mocks.generateKeyPairSigner.mockResolvedValue(mockMint);
  }
  if (mocks.createTransaction) {
    mocks.createTransaction.mockReturnValue(MOCK_TRANSACTION_OBJECT);
  }
  if (mocks.signTransactionMessageWithSigners) {
    mocks.signTransactionMessageWithSigners.mockResolvedValue(MOCK_SIGNED_TRANSACTION);
  }

  // gill/programs
  if (mocks.getAssociatedTokenAccountAddress) {
    mocks.getAssociatedTokenAccountAddress.mockResolvedValue(MOCK_ATA_ADDRESS);
  }
};
