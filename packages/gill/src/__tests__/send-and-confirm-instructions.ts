import { ITransactionMessageWithFeePayerSigner, type IInstruction, type Signature } from "@solana/kit";
import { blockhash, generateKeyPairSigner, type KeyPairSigner } from "@solana/kit";
import { createTransaction } from "../core/create-transaction";
import { prepareTransaction } from "../core/prepare-transaction";
import { sendAndConfirmInstructions } from "../core/send-and-confirm-instructions";
import { FullTransaction, SolanaClient } from "../types";
import { MAX_COMPUTE_UNIT_LIMIT } from "../programs";

jest.mock("../core/create-transaction", () => ({
  createTransaction: jest.fn(),
}));

jest.mock("../core/prepare-transaction", () => ({
  prepareTransaction: jest.fn(),
  asPreparableTransaction: (tx: FullTransaction<any, any>) => tx,
}));

describe("sendAndConfirmInstructions", () => {
  let signer: KeyPairSigner;
  let mockClient: SolanaClient;
  let mockInstruction: IInstruction;
  let mockTransaction: FullTransaction<"legacy", ITransactionMessageWithFeePayerSigner>;

  beforeAll(async () => {
    signer = await generateKeyPairSigner();

    mockInstruction = {
      programAddress: "11111111111111111111111111111112" as any,
      accounts: [],
      data: new Uint8Array([]),
    };
  });

  beforeEach(() => {
    jest.clearAllMocks();

    mockTransaction = {
      feePayer: signer,
      instructions: [mockInstruction],
      version: "legacy",
    };

    (createTransaction as jest.Mock).mockReturnValue(mockTransaction);
    (prepareTransaction as jest.Mock).mockImplementation(({ transaction }) =>
      Promise.resolve({
        ...transaction,
        message: {
          ...transaction.message,
          recentBlockhash: blockhash("GK1nopeF3P8J46dGqq4KfaEWopZU7K65F6CKQXuUdr3z"),
        },
      }),
    );

    mockClient = {
      rpc: {
        getLatestBlockhash: {
          send: jest.fn().mockResolvedValue({
            value: {
              blockhash: blockhash("GK1nopeF3P8J46dGqq4KfaEWopZU7K65F6CKQXuUdr3z"),
              lastValidBlockHeight: 1000n,
            },
          }),
        },
        simulateTransaction: {
          send: jest.fn().mockResolvedValue({
            value: {
              unitsConsumed: 5000,
              logs: [],
              err: null,
            },
          }),
        },
      },
      sendAndConfirmTransaction: jest
        .fn()
        .mockResolvedValue("5j8WuZZZZ1Z1Z1Z1Z1Z1Z1Z1Z1Z1Z1Z1Z1Z1Z1Z1Z1Z1Z1Z1Z1Z1Z1Z1Z1Z1Z1Z1Z1Z1Z1Z1Z" as Signature),
      rpcSubscriptions: jest.fn() as any,
      simulateTransaction: jest.fn() as any,
    } as unknown as SolanaClient;
  });

  test("sends and confirms instructions with default options", async () => {
    const signature = await sendAndConfirmInstructions(mockClient, signer, [mockInstruction]);

    expect(createTransaction).toHaveBeenCalledWith({
      version: "legacy",
      feePayer: signer,
      instructions: [mockInstruction],
      computeUnitLimit: MAX_COMPUTE_UNIT_LIMIT,
      computeUnitPrice: 1,
    });

    expect(prepareTransaction).toHaveBeenCalledWith({
      transaction: expect.anything(),
      rpc: mockClient.rpc,
      computeUnitLimitMultiplier: 1.1,
      computeUnitLimitReset: true,
      blockhashReset: true,
    });

    expect(mockClient.sendAndConfirmTransaction).toHaveBeenCalled();
    expect(typeof signature).toBe("string");
  });

  test("sends and confirms instructions with legacy version", async () => {
    await sendAndConfirmInstructions(mockClient, signer, [mockInstruction], {
      version: "legacy",
    });

    expect(createTransaction).toHaveBeenCalledWith(
      expect.objectContaining({
        version: "legacy",
      }),
    );
  });

  test("sends and confirms instructions with version 0", async () => {
    await sendAndConfirmInstructions(mockClient, signer, [mockInstruction], {
      version: 0,
    });

    expect(createTransaction).toHaveBeenCalledWith(
      expect.objectContaining({
        version: 0,
      }),
    );
  });

  test("sends and confirms instructions with custom compute unit price", async () => {
    await sendAndConfirmInstructions(mockClient, signer, [mockInstruction], {
      computeUnitPrice: 1000,
    });

    expect(createTransaction).toHaveBeenCalledWith(
      expect.objectContaining({
        computeUnitPrice: 1000,
      }),
    );
  });

  test("sends and confirms instructions with explicit compute unit limit", async () => {
    await sendAndConfirmInstructions(mockClient, signer, [mockInstruction], {
      computeUnitLimit: 200000,
    });

    expect(createTransaction).toHaveBeenCalledWith(
      expect.objectContaining({
        computeUnitLimit: 200000,
      }),
    );

    expect(prepareTransaction).toHaveBeenCalledWith(
      expect.objectContaining({
        computeUnitLimitReset: false,
      }),
    );
  });

  test("sends and confirms instructions with custom multiplier", async () => {
    await sendAndConfirmInstructions(mockClient, signer, [mockInstruction], {
      computeUnitLimitMultiplier: 1.5,
    });

    expect(prepareTransaction).toHaveBeenCalledWith(
      expect.objectContaining({
        computeUnitLimitMultiplier: 1.5,
      }),
    );
  });

  test("handles transaction sending failure", async () => {
    const error = new Error("Transaction failed");
    (mockClient.sendAndConfirmTransaction as jest.Mock).mockRejectedValue(error);

    await expect(sendAndConfirmInstructions(mockClient, signer, [mockInstruction])).rejects.toThrow(error);
  });

  test("passes through send and confirm config", async () => {
    const config = {
      skipPreflight: true,
      maxRetries: 5n,
      commitment: "confirmed" as const,
    };
    await sendAndConfirmInstructions(mockClient, signer, [mockInstruction], {}, config);

    expect(mockClient.sendAndConfirmTransaction).toHaveBeenCalledWith(expect.anything(), config);
  });
});
