import {
  address,
  createTransactionMessage,
  pipe,
  setTransactionMessageFeePayerSigner,
  appendTransactionMessageInstruction,
  createNoopSigner,
  type Blockhash,
  type MicroLamports,
  type Rpc
} from "@solana/kit";
import { getTransferSolInstruction, COMPUTE_BUDGET_PROGRAM_ADDRESS } from "../programs";
import { prepareTransaction } from "../core/prepare-transaction";

describe("prepareTransaction", () => {
  const mockFeePayer = createNoopSigner(address("AMi1Z111111111111111111111111111111111111111"));
  const mockDestination = address("Gi11222222222222222222222222222222222222222");

  it("should add compute unit limit when none exists", async () => {
    // Create a transaction without compute budget instructions
    const transaction = pipe(
      createTransactionMessage({ version: 0 }),
      tx => setTransactionMessageFeePayerSigner(mockFeePayer, tx),
      tx => appendTransactionMessageInstruction(
        getTransferSolInstruction({
          source: mockFeePayer,
          destination: mockDestination,
          amount: 1_000_000n,
        }),
        tx
      )
    );

    // Mock the RPC calls with proper estimateComputeUnitLimitFactory response
    const mockRpc = {
      getLatestBlockhash: () => ({
        send: async () => ({
          value: {
            blockhash: "GHtXQBsoZHVnNFa9YevAzFr17DJjgHXk3ycTKD5xD3Zi" as Blockhash,
            lastValidBlockHeight: 100n,
          },
        }),
      }),
      simulateTransaction: () => ({
        send: async () => ({
          value: {
            err: null,
            unitsConsumed: 5000n,
            logs: [],
          },
        }),
      }),
    } as Rpc<any>;

    const prepared = await prepareTransaction({
      transaction,
      rpc: mockRpc,
      computeUnitLimitMultiplier: 1.2,
    });

    // Check that compute unit limit instruction was added  
    const hasComputeUnitLimit = prepared.instructions.some(
      ix => String(ix.programAddress) === String(COMPUTE_BUDGET_PROGRAM_ADDRESS)
    );
    expect(hasComputeUnitLimit).toBe(true);

    // Check that blockhash was set
    expect(prepared.lifetimeConstraint.blockhash).toBe("GHtXQBsoZHVnNFa9YevAzFr17DJjgHXk3ycTKD5xD3Zi");
  });

  it("should add priority fee when provided", async () => {
    const transaction = pipe(
      createTransactionMessage({ version: 0 }),
      tx => setTransactionMessageFeePayerSigner(mockFeePayer, tx),
      tx => appendTransactionMessageInstruction(
        getTransferSolInstruction({
          source: mockFeePayer,
          destination: mockDestination,
          amount: 1_000_000n,
        }),
        tx
      )
    );

    const mockRpc = {
      getLatestBlockhash: () => ({
        send: async () => ({
          value: {
            blockhash: "GHtXQBsoZHVnNFa9YevAzFr17DJjgHXk3ycTKD5xD3Zi" as Blockhash,
            lastValidBlockHeight: 100n,
          },
        }),
      }),
      simulateTransaction: () => ({
        send: async () => ({
          value: {
            err: null,
            unitsConsumed: 5000n,
            logs: [],
          },
        }),
      }),
    } as Rpc<any>;

    const prepared = await prepareTransaction({
      transaction,
      rpc: mockRpc,
      computeUnitPrice: 5000n, // 5000 microlamports
    });

    // Should have both compute unit limit and price instructions
    const computeBudgetInstructions = prepared.instructions.filter(
      ix => String(ix.programAddress) === String(COMPUTE_BUDGET_PROGRAM_ADDRESS)
    );
    expect(computeBudgetInstructions.length).toBe(2);
  });

  it("should not re-estimate when computeUnitLimitReset is false and limit exists", async () => {
    // First, create a transaction with a compute unit limit instruction
    let transaction = pipe(
      createTransactionMessage({ version: 0 }),
      tx => setTransactionMessageFeePayerSigner(mockFeePayer, tx),
      tx => appendTransactionMessageInstruction(
        getTransferSolInstruction({
          source: mockFeePayer,
          destination: mockDestination,
          amount: 1_000_000n,
        }),
        tx
      )
    );

    // Add a compute unit limit instruction first
    const { updateOrAppendSetComputeUnitLimitInstruction } = await import("@solana-program/compute-budget");
    transaction = updateOrAppendSetComputeUnitLimitInstruction(100_000, transaction);

    // Create a mock that tracks if estimation is called
    let estimationCalled = false;
    const mockRpc = {
      getLatestBlockhash: () => ({
        send: async () => ({
          value: {
            blockhash: "GHtXQBsoZHVnNFa9YevAzFr17DJjgHXk3ycTKD5xD3Zi" as Blockhash,
            lastValidBlockHeight: 100n,
          },
        }),
      }),
    } as Rpc<any>;

    // Mock the estimation factory to track if it's called
    jest.mock("@solana-program/compute-budget", () => ({
      ...jest.requireActual("@solana-program/compute-budget"),
      estimateComputeUnitLimitFactory: () => () => {
        estimationCalled = true;
        return Promise.resolve(5000);
      },
    }));

    await prepareTransaction({
      transaction,
      rpc: mockRpc,
      computeUnitLimitReset: false,
    });

    // Since computeUnitLimitReset is false and we already have a limit, estimation should not be called
    expect(estimationCalled).toBe(false);
  });

  it("should throw when simulation fails", async () => {
    const transaction = pipe(
      createTransactionMessage({ version: 0 }),
      tx => setTransactionMessageFeePayerSigner(mockFeePayer, tx),
      tx => appendTransactionMessageInstruction(
        getTransferSolInstruction({
          source: mockFeePayer,
          destination: mockDestination,
          amount: 1_000_000n,
        }),
        tx
      )
    );

    // Mock RPC that will cause the estimateComputeUnitLimitFactory to throw
    const mockRpc = {
      getLatestBlockhash: () => ({
        send: async () => ({
          value: {
            blockhash: "GHtXQBsoZHVnNFa9YevAzFr17DJjgHXk3ycTKD5xD3Zi" as Blockhash,
            lastValidBlockHeight: 100n,
          },
        }),
      }),
      simulateTransaction: () => ({
        send: async () => {
          throw new Error("RPC simulation failed");
        },
      }),
    } as Rpc<any>;

    await expect(prepareTransaction({
      transaction,
      rpc: mockRpc,
    })).rejects.toThrow();
  });

  // Compute unit edge cases
  it("should cap compute units at MAX_COMPUTE_UNIT_LIMIT when estimation exceeds it", async () => {
    const transaction = pipe(
      createTransactionMessage({ version: 0 }),
      tx => setTransactionMessageFeePayerSigner(mockFeePayer, tx),
      tx => appendTransactionMessageInstruction(
        getTransferSolInstruction({
          source: mockFeePayer,
          destination: mockDestination,
          amount: 1_000_000n,
        }),
        tx
      )
    );

    const mockRpc = {
      getLatestBlockhash: () => ({
        send: async () => ({
          value: {
            blockhash: "GHtXQBsoZHVnNFa9YevAzFr17DJjgHXk3ycTKD5xD3Zi" as Blockhash,
            lastValidBlockHeight: 100n,
          },
        }),
      }),
      simulateTransaction: () => ({
        send: async () => ({
          value: {
            err: null,
            unitsConsumed: 1_300_000n, // Very high consumption that will exceed max when multiplied
            logs: [],
          },
        }),
      }),
    } as Rpc<any>;

    const prepared = await prepareTransaction({
      transaction,
      rpc: mockRpc,
      computeUnitLimitMultiplier: 1.5, // This would result in 1.95M, which exceeds the max
    });

    // Find the compute unit limit instruction
    const computeLimitInstruction = prepared.instructions.find(
      ix => String(ix.programAddress) === String(COMPUTE_BUDGET_PROGRAM_ADDRESS) &&
        ix.data && ix.data[0] === 2 // SetComputeUnitLimit instruction discriminator
    );

    expect(computeLimitInstruction).toBeDefined();
    // The compute limit should be capped at MAX_COMPUTE_UNIT_LIMIT (1.4M)
    // We can verify this by checking the instruction data
    if (computeLimitInstruction?.data) {
      // Extract units from instruction data (bytes 1-4 in little-endian format)
      const unitsBytes = computeLimitInstruction.data.slice(1, 5);
      const units = new DataView(unitsBytes.buffer).getUint32(0, true);
      expect(units).toBe(1_400_000); // MAX_COMPUTE_UNIT_LIMIT
    }
  });

  // Priority fee scenarios
  it("should accept computeUnitPrice as number", async () => {
    const transaction = pipe(
      createTransactionMessage({ version: 0 }),
      tx => setTransactionMessageFeePayerSigner(mockFeePayer, tx),
      tx => appendTransactionMessageInstruction(
        getTransferSolInstruction({
          source: mockFeePayer,
          destination: mockDestination,
          amount: 1_000_000n,
        }),
        tx
      )
    );

    const mockRpc = {
      getLatestBlockhash: () => ({
        send: async () => ({
          value: {
            blockhash: "GHtXQBsoZHVnNFa9YevAzFr17DJjgHXk3ycTKD5xD3Zi" as Blockhash,
            lastValidBlockHeight: 100n,
          },
        }),
      }),
      simulateTransaction: () => ({
        send: async () => ({
          value: {
            err: null,
            unitsConsumed: 5000n,
            logs: [],
          },
        }),
      }),
    } as Rpc<any>;

    const prepared = await prepareTransaction({
      transaction,
      rpc: mockRpc,
      computeUnitPrice: 1000, // number
    });

    // Should have both compute limit and price instructions
    const computeBudgetInstructions = prepared.instructions.filter(
      ix => String(ix.programAddress) === String(COMPUTE_BUDGET_PROGRAM_ADDRESS)
    );
    expect(computeBudgetInstructions.length).toBe(2);

    // Find the price instruction
    const priceInstruction = computeBudgetInstructions.find(
      ix => ix.data && ix.data[0] === 3 // SetComputeUnitPrice instruction discriminator
    );
    expect(priceInstruction).toBeDefined();
  });
  it("should accept computeUnitPrice as bigint", async () => {
    const transaction = pipe(
      createTransactionMessage({ version: 0 }),
      tx => setTransactionMessageFeePayerSigner(mockFeePayer, tx),
      tx => appendTransactionMessageInstruction(
        getTransferSolInstruction({
          source: mockFeePayer,
          destination: mockDestination,
          amount: 1_000_000n,
        }),
        tx
      )
    );

    const mockRpc = {
      getLatestBlockhash: () => ({
        send: async () => ({
          value: {
            blockhash: "GHtXQBsoZHVnNFa9YevAzFr17DJjgHXk3ycTKD5xD3Zi" as Blockhash,
            lastValidBlockHeight: 100n,
          },
        }),
      }),
      simulateTransaction: () => ({
        send: async () => ({
          value: {
            err: null,
            unitsConsumed: 5000n,
            logs: [],
          },
        }),
      }),
    } as Rpc<any>;

    const prepared = await prepareTransaction({
      transaction,
      rpc: mockRpc,
      computeUnitPrice: 2000n, // bigint
    });

    // Should have both compute limit and price instructions
    const computeBudgetInstructions = prepared.instructions.filter(
      ix => String(ix.programAddress) === String(COMPUTE_BUDGET_PROGRAM_ADDRESS)
    );
    expect(computeBudgetInstructions.length).toBe(2);
  });
  it("should accept computeUnitPrice as MicroLamports", async () => {

    const transaction = pipe(
      createTransactionMessage({ version: 0 }),
      tx => setTransactionMessageFeePayerSigner(mockFeePayer, tx),
      tx => appendTransactionMessageInstruction(
        getTransferSolInstruction({
          source: mockFeePayer,
          destination: mockDestination,
          amount: 1_000_000n,
        }),
        tx
      )
    );

    const mockRpc = {
      getLatestBlockhash: () => ({
        send: async () => ({
          value: {
            blockhash: "GHtXQBsoZHVnNFa9YevAzFr17DJjgHXk3ycTKD5xD3Zi" as Blockhash,
            lastValidBlockHeight: 100n,
          },
        }),
      }),
      simulateTransaction: () => ({
        send: async () => ({
          value: {
            err: null,
            unitsConsumed: 5000n,
            logs: [],
          },
        }),
      }),
    } as Rpc<any>;

    const prepared = await prepareTransaction({
      transaction,
      rpc: mockRpc,
      computeUnitPrice: 3000n as MicroLamports,
    });

    // Should have both compute limit and price instructions
    const computeBudgetInstructions = prepared.instructions.filter(
      ix => String(ix.programAddress) === String(COMPUTE_BUDGET_PROGRAM_ADDRESS)
    );
    expect(computeBudgetInstructions.length).toBe(2);
  });

  // Blockhash scenarios
  it("should preserve existing blockhash when blockhashReset is false", async () => {
    const existingBlockhash = "9WzDXwBbmkg8ZTbNMqUxvQRAyrZzDsGYdLVL9zYtAWWM";

    const transaction = pipe(
      createTransactionMessage({ version: 0 }),
      tx => setTransactionMessageFeePayerSigner(mockFeePayer, tx),
      tx => ({
        ...tx,
        lifetimeConstraint: {
          blockhash: existingBlockhash as Blockhash,
          lastValidBlockHeight: 50n,
        },
      }),
      tx => appendTransactionMessageInstruction(
        getTransferSolInstruction({
          source: mockFeePayer,
          destination: mockDestination,
          amount: 1_000_000n,
        }),
        tx
      )
    );

    const mockRpc = {
      getLatestBlockhash: () => ({
        send: async () => ({
          value: {
            blockhash: "5eykt4UsFv8P8NJdTREpY1vzqKqZKvdpKuc147dw2N9d" as Blockhash,
            lastValidBlockHeight: 100n,
          },
        }),
      }),
      simulateTransaction: () => ({
        send: async () => ({
          value: {
            err: null,
            unitsConsumed: 5000n,
            logs: [],
          },
        }),
      }),
    } as Rpc<any>;

    const prepared = await prepareTransaction({
      transaction,
      rpc: mockRpc,
      blockhashReset: false,
    });

    // Should preserve the original blockhash
    expect(prepared.lifetimeConstraint.blockhash).toBe(existingBlockhash);
    expect(prepared.lifetimeConstraint.lastValidBlockHeight).toBe(50n);
  });
  it("should update existing blockhash when blockhashReset is true", async () => {
    const existingBlockhash = "9WzDXwBbmkg8ZTbNMqUxvQRAyrZzDsGYdLVL9zYtAWWM";
    const newBlockhash = "5eykt4UsFv8P8NJdTREpY1vzqKqZKvdpKuc147dw2N9d";

    const transaction = pipe(
      createTransactionMessage({ version: 0 }),
      tx => setTransactionMessageFeePayerSigner(mockFeePayer, tx),
      tx => ({
        ...tx,
        lifetimeConstraint: {
          blockhash: existingBlockhash as Blockhash,
          lastValidBlockHeight: 50n,
        },
      }),
      tx => appendTransactionMessageInstruction(
        getTransferSolInstruction({
          source: mockFeePayer,
          destination: mockDestination,
          amount: 1_000_000n,
        }),
        tx
      )
    );

    const mockRpc = {
      getLatestBlockhash: () => ({
        send: async () => ({
          value: {
            blockhash: newBlockhash as Blockhash,
            lastValidBlockHeight: 100n,
          },
        }),
      }),
      simulateTransaction: () => ({
        send: async () => ({
          value: {
            err: null,
            unitsConsumed: 5000n,
            logs: [],
          },
        }),
      }),
    } as Rpc<any>;

    const prepared = await prepareTransaction({
      transaction,
      rpc: mockRpc,
      blockhashReset: true,
    });

    // Should use the new blockhash
    expect(prepared.lifetimeConstraint.blockhash).toBe(newBlockhash);
    expect(prepared.lifetimeConstraint.lastValidBlockHeight).toBe(100n);
  });
  it("should add blockhash when transaction has none and blockhashReset is false", async () => {
    // Create transaction without blockhash
    const transaction = pipe(
      createTransactionMessage({ version: 0 }),
      tx => setTransactionMessageFeePayerSigner(mockFeePayer, tx),
      tx => appendTransactionMessageInstruction(
        getTransferSolInstruction({
          source: mockFeePayer,
          destination: mockDestination,
          amount: 1_000_000n,
        }),
        tx
      )
    );

    const newBlockhash = "5eykt4UsFv8P8NJdTREpY1vzqKqZKvdpKuc147dw2N9d";

    const mockRpc = {
      getLatestBlockhash: () => ({
        send: async () => ({
          value: {
            blockhash: newBlockhash as Blockhash,
            lastValidBlockHeight: 100n,
          },
        }),
      }),
      simulateTransaction: () => ({
        send: async () => ({
          value: {
            err: null,
            unitsConsumed: 5000n,
            logs: [],
          },
        }),
      }),
    } as Rpc<any>;

    const prepared = await prepareTransaction({
      transaction,
      rpc: mockRpc,
      blockhashReset: false, // Even with false, it should add blockhash if none exists
      computeUnitLimitReset: false, // Disable estimation to avoid simulation errors
    });

    // Should add the blockhash even when blockhashReset is false
    expect(prepared.lifetimeConstraint.blockhash).toBe(newBlockhash);
    expect(prepared.lifetimeConstraint.lastValidBlockHeight).toBe(100n);
  });

  // Configuration combinations
  it("should handle computeUnitLimitReset=true and blockhashReset=false", async () => {
    const existingBlockhash = "9WzDXwBbmkg8ZTbNMqUxvQRAyrZzDsGYdLVL9zYtAWWM";

    const transaction = pipe(
      createTransactionMessage({ version: 0 }),
      tx => setTransactionMessageFeePayerSigner(mockFeePayer, tx),
      tx => ({
        ...tx,
        lifetimeConstraint: {
          blockhash: existingBlockhash as Blockhash,
          lastValidBlockHeight: 50n,
        },
      }),
      tx => appendTransactionMessageInstruction(
        getTransferSolInstruction({
          source: mockFeePayer,
          destination: mockDestination,
          amount: 1_000_000n,
        }),
        tx
      )
    );

    const mockRpc = {
      getLatestBlockhash: () => ({
        send: async () => ({
          value: {
            blockhash: "5eykt4UsFv8P8NJdTREpY1vzqKqZKvdpKuc147dw2N9d" as Blockhash,
            lastValidBlockHeight: 100n,
          },
        }),
      }),
      simulateTransaction: () => ({
        send: async () => ({
          value: {
            err: null,
            unitsConsumed: 5000n,
            logs: [],
          },
        }),
      }),
    } as Rpc<any>;

    const prepared = await prepareTransaction({
      transaction,
      rpc: mockRpc,
      computeUnitLimitReset: true, // Should estimate compute units
      blockhashReset: false, // Should preserve existing blockhash
    });

    // Should preserve the original blockhash
    expect(prepared.lifetimeConstraint.blockhash).toBe(existingBlockhash);
    expect(prepared.lifetimeConstraint.lastValidBlockHeight).toBe(50n);

    // Should have compute unit limit instruction added
    const hasComputeUnitLimit = prepared.instructions.some(
      ix => String(ix.programAddress) === String(COMPUTE_BUDGET_PROGRAM_ADDRESS) &&
        ix.data && ix.data[0] === 2 // SetComputeUnitLimit instruction discriminator
    );
    expect(hasComputeUnitLimit).toBe(true);
  });
  it("should handle computeUnitLimitReset=false and blockhashReset=true", async () => {
    const { updateOrAppendSetComputeUnitLimitInstruction } = await import("@solana-program/compute-budget");

    const existingBlockhash = "9WzDXwBbmkg8ZTbNMqUxvQRAyrZzDsGYdLVL9zYtAWWM";
    const newBlockhash = "5eykt4UsFv8P8NJdTREpY1vzqKqZKvdpKuc147dw2N9d";

    const transaction = pipe(
      createTransactionMessage({ version: 0 }),
      tx => setTransactionMessageFeePayerSigner(mockFeePayer, tx),
      tx => ({
        ...tx,
        lifetimeConstraint: {
          blockhash: existingBlockhash as Blockhash,
          lastValidBlockHeight: 50n,
        },
      }),
      tx => updateOrAppendSetComputeUnitLimitInstruction(100_000, tx), // Pre-add compute limit
      tx => appendTransactionMessageInstruction(
        getTransferSolInstruction({
          source: mockFeePayer,
          destination: mockDestination,
          amount: 1_000_000n,
        }),
        tx
      )
    );

    const mockRpc = {
      getLatestBlockhash: () => ({
        send: async () => ({
          value: {
            blockhash: newBlockhash as Blockhash,
            lastValidBlockHeight: 100n,
          },
        }),
      }),
      simulateTransaction: () => ({
        send: async () => ({
          value: {
            err: null,
            unitsConsumed: 5000n,
            logs: [],
          },
        }),
      }),
    } as Rpc<any>;

    const prepared = await prepareTransaction({
      transaction,
      rpc: mockRpc,
      computeUnitLimitReset: false, // Should not estimate compute units
      blockhashReset: true, // Should update blockhash
    });

    // Should use the new blockhash
    expect(prepared.lifetimeConstraint.blockhash).toBe(newBlockhash);
    expect(prepared.lifetimeConstraint.lastValidBlockHeight).toBe(100n);

    // Should have kept the existing compute unit limit instruction (no re-estimation)
    const computeLimitInstructions = prepared.instructions.filter(
      ix => String(ix.programAddress) === String(COMPUTE_BUDGET_PROGRAM_ADDRESS) &&
        ix.data && ix.data[0] === 2 // SetComputeUnitLimit instruction discriminator
    );
    expect(computeLimitInstructions.length).toBe(1);
  });
  it("should handle both computeUnitLimitReset=false and blockhashReset=false", async () => {
    const { updateOrAppendSetComputeUnitLimitInstruction } = await import("@solana-program/compute-budget");

    const existingBlockhash = "9WzDXwBbmkg8ZTbNMqUxvQRAyrZzDsGYdLVL9zYtAWWM";

    const transaction = pipe(
      createTransactionMessage({ version: 0 }),
      tx => setTransactionMessageFeePayerSigner(mockFeePayer, tx),
      tx => ({
        ...tx,
        lifetimeConstraint: {
          blockhash: existingBlockhash as Blockhash,
          lastValidBlockHeight: 50n,
        },
      }),
      tx => updateOrAppendSetComputeUnitLimitInstruction(100_000, tx), // Pre-add compute limit
      tx => appendTransactionMessageInstruction(
        getTransferSolInstruction({
          source: mockFeePayer,
          destination: mockDestination,
          amount: 1_000_000n,
        }),
        tx
      )
    );

    const mockRpc = {
      getLatestBlockhash: () => ({
        send: async () => ({
          value: {
            blockhash: "5eykt4UsFv8P8NJdTREpY1vzqKqZKvdpKuc147dw2N9d" as Blockhash,
            lastValidBlockHeight: 100n,
          },
        }),
      }),
      simulateTransaction: () => ({
        send: async () => ({
          value: {
            err: null,
            unitsConsumed: 5000n,
            logs: [],
          },
        }),
      }),
    } as Rpc<any>;

    const prepared = await prepareTransaction({
      transaction,
      rpc: mockRpc,
      computeUnitLimitReset: false, // Should not estimate compute units
      blockhashReset: false, // Should preserve existing blockhash
    });

    // Should preserve the original blockhash
    expect(prepared.lifetimeConstraint.blockhash).toBe(existingBlockhash);
    expect(prepared.lifetimeConstraint.lastValidBlockHeight).toBe(50n);

    // Should have kept the existing compute unit limit instruction unchanged
    const computeLimitInstructions = prepared.instructions.filter(
      ix => String(ix.programAddress) === String(COMPUTE_BUDGET_PROGRAM_ADDRESS) &&
        ix.data && ix.data[0] === 2 // SetComputeUnitLimit instruction discriminator
    );
    expect(computeLimitInstructions.length).toBe(1);
  });

  // Complex scenarios
  it("should handle transactions that already have both compute limit and price instructions", async () => {
    const { updateOrAppendSetComputeUnitLimitInstruction, updateOrAppendSetComputeUnitPriceInstruction } = await import("@solana-program/compute-budget");

    const transaction = pipe(
      createTransactionMessage({ version: 0 }),
      tx => setTransactionMessageFeePayerSigner(mockFeePayer, tx),
      tx => updateOrAppendSetComputeUnitLimitInstruction(80_000, tx), // Pre-add compute limit
      tx => updateOrAppendSetComputeUnitPriceInstruction(1000n as MicroLamports, tx), // Pre-add priority fee
      tx => appendTransactionMessageInstruction(
        getTransferSolInstruction({
          source: mockFeePayer,
          destination: mockDestination,
          amount: 1_000_000n,
        }),
        tx
      )
    );

    const mockRpc = {
      getLatestBlockhash: () => ({
        send: async () => ({
          value: {
            blockhash: "9WzDXwBbmkg8ZTbNMqUxvQRAyrZzDsGYdLVL9zYtAWWM" as Blockhash,
            lastValidBlockHeight: 100n,
          },
        }),
      }),
      simulateTransaction: () => ({
        send: async () => ({
          value: {
            err: null,
            unitsConsumed: 5000n,
            logs: [],
          },
        }),
      }),
    } as Rpc<any>;

    const prepared = await prepareTransaction({
      transaction,
      rpc: mockRpc,
      computeUnitLimitReset: true, // Should re-estimate despite existing limit
      computeUnitPrice: 2000n, // Should update the existing price
    });

    // Should still have both compute limit and price instructions
    const computeBudgetInstructions = prepared.instructions.filter(
      ix => String(ix.programAddress) === String(COMPUTE_BUDGET_PROGRAM_ADDRESS)
    );
    expect(computeBudgetInstructions.length).toBe(2);

    // Should have updated limit through re-estimation (5000 * 1.1 = 5500)
    const computeLimitInstruction = computeBudgetInstructions.find(
      ix => ix.data && ix.data[0] === 2 // SetComputeUnitLimit instruction discriminator
    );
    expect(computeLimitInstruction).toBeDefined();

    // Should have updated price instruction
    const computePriceInstruction = computeBudgetInstructions.find(
      ix => ix.data && ix.data[0] === 3 // SetComputeUnitPrice instruction discriminator
    );
    expect(computePriceInstruction).toBeDefined();
  });

  // Default values
  it("should use default computeUnitLimitMultiplier of 1.1 when not specified", async () => {
    const transaction = pipe(
      createTransactionMessage({ version: 0 }),
      tx => setTransactionMessageFeePayerSigner(mockFeePayer, tx),
      tx => appendTransactionMessageInstruction(
        getTransferSolInstruction({
          source: mockFeePayer,
          destination: mockDestination,
          amount: 1_000_000n,
        }),
        tx
      )
    );

    const mockRpc = {
      getLatestBlockhash: () => ({
        send: async () => ({
          value: {
            blockhash: "9WzDXwBbmkg8ZTbNMqUxvQRAyrZzDsGYdLVL9zYtAWWM" as Blockhash,
            lastValidBlockHeight: 100n,
          },
        }),
      }),
      simulateTransaction: () => ({
        send: async () => ({
          value: {
            err: null,
            unitsConsumed: 10000n, // 10k * 1.1 = 11k
            logs: [],
          },
        }),
      }),
    } as Rpc<any>;

    const prepared = await prepareTransaction({
      transaction,
      rpc: mockRpc,
      // No computeUnitLimitMultiplier specified - should default to 1.1
    });

    // Find the compute unit limit instruction and verify it used the 1.1 multiplier
    const computeLimitInstruction = prepared.instructions.find(
      ix => String(ix.programAddress) === String(COMPUTE_BUDGET_PROGRAM_ADDRESS) &&
        ix.data && ix.data[0] === 2 // SetComputeUnitLimit instruction discriminator
    );

    expect(computeLimitInstruction).toBeDefined();
    if (computeLimitInstruction?.data) {
      // Extract units from instruction data (bytes 1-4 in little-endian format)
      const unitsBytes = computeLimitInstruction.data.slice(1, 5);
      const units = new DataView(unitsBytes.buffer).getUint32(0, true);
      expect(units).toBe(11000); // 10000 * 1.1 = 11000
    }
  });

});