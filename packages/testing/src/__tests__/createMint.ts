import {
  generateKeyPairSigner,
  getMinimumBalanceForRentExemption,
  createTransaction,
  signTransactionMessageWithSigners,
  type KeyPairSigner,
  type SolanaClient,
  Signature,
} from "gill";
import { loadKeypairSignerFromFile } from "gill/node";
import {
  getCreateAccountInstruction,
  getInitializeMintInstruction,
  getMintSize,
  TOKEN_PROGRAM_ADDRESS,
} from "gill/programs";
import createMint from "../fixtures/createMint";

jest.mock("gill", () => ({
  ...jest.requireActual("gill"),
  generateKeyPairSigner: jest.fn(),
  getMinimumBalanceForRentExemption: jest.fn(),
  createTransaction: jest.fn(),
  signTransactionMessageWithSigners: jest.fn(),
}));

jest.mock("gill/node", () => ({ loadKeypairSignerFromFile: jest.fn() }));

jest.mock("gill/programs", () => ({
  ...jest.requireActual("gill/programs"),
  getCreateAccountInstruction: jest.fn(),
  getInitializeMintInstruction: jest.fn(),
  getMintSize: jest.fn(),
  TOKEN_PROGRAM_ADDRESS: "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA",
}));

describe("createMint", () => {
  let mockSigner: KeyPairSigner;
  let mockMint: KeyPairSigner;
  let mockRpc: SolanaClient["rpc"];
  let mockSendAndConfirmTransaction: jest.Mock;
  const mockTransactionSignature = "mockTxSig" as Signature;
  const mockSignedTransaction = { signatures: [] };
  const mockSpace = 82;
  const mockLamports = 1461600n;

  beforeEach(() => {
    mockSigner = { address: "signerAddress" as any } as KeyPairSigner;
    mockMint = { address: "mintAddress" as any } as KeyPairSigner;

    mockRpc = {
      getLatestBlockhash: jest.fn().mockReturnValue({
        send: jest.fn().mockResolvedValue({ value: { blockhash: "blockhash", lastValidBlockHeight: 1n } }),
      }),
    } as unknown as SolanaClient["rpc"];

    mockSendAndConfirmTransaction = jest.fn().mockResolvedValue(mockTransactionSignature);

    (loadKeypairSignerFromFile as jest.Mock).mockResolvedValue(mockSigner);
    (generateKeyPairSigner as jest.Mock).mockResolvedValue(mockMint);
    (getMintSize as jest.Mock).mockReturnValue(mockSpace);
    (getMinimumBalanceForRentExemption as jest.Mock).mockReturnValue(mockLamports);
    (getCreateAccountInstruction as jest.Mock).mockReturnValue({ instruction: "mockCreateAccountInstruction" });
    (getInitializeMintInstruction as jest.Mock).mockReturnValue({ instruction: "mockInitializeMintInstruction" });
    (createTransaction as jest.Mock).mockReturnValue({ transaction: "mockTransaction" });
    (signTransactionMessageWithSigners as jest.Mock).mockResolvedValue(mockSignedTransaction);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it("creates a mint with default parameters", async () => {
    const result = await createMint(mockRpc, mockSendAndConfirmTransaction);

    expect(result).toEqual({ mint: mockMint, transactionSignature: mockTransactionSignature });
    expect(getInitializeMintInstruction).toHaveBeenCalledWith(
      { mint: mockMint.address, mintAuthority: mockSigner.address, freezeAuthority: mockSigner.address, decimals: 9 },
      { programAddress: TOKEN_PROGRAM_ADDRESS },
    );
  });

  it("creates a mint with custom payer and decimals", async () => {
    const customPayer: KeyPairSigner = { address: "customPayer" as any } as KeyPairSigner;
    const result = await createMint(mockRpc, mockSendAndConfirmTransaction, { payer: customPayer, decimals: 4 });

    expect(result).toEqual({ mint: mockMint, transactionSignature: mockTransactionSignature });
    expect(getCreateAccountInstruction).toHaveBeenCalledWith(expect.objectContaining({ payer: customPayer }));
    expect(getInitializeMintInstruction).toHaveBeenCalledWith(
      { mint: mockMint.address, mintAuthority: customPayer.address, freezeAuthority: customPayer.address, decimals: 4 },
      { programAddress: TOKEN_PROGRAM_ADDRESS },
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
