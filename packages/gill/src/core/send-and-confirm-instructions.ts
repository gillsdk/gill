import {
  ITransactionMessageWithFeePayer,
  ITransactionMessageWithFeePayerSigner,
  SolanaError,
  type IInstruction,
  type Signature,
  type TransactionSigner,
  type TransactionVersion,
} from "@solana/kit";
import { FullTransaction, SolanaClient } from "../types";
import { createTransaction } from "./create-transaction";
import { PrepareCompilableTransactionMessage, prepareTransaction } from "./prepare-transaction";
import { MAX_COMPUTE_UNIT_LIMIT } from "../programs";
import { SendAndConfirmTransactionConfig } from "./send-and-confirm-transaction-with-signers";

export type SendAndConfirmInstructionsOptions = {
  /* CU Price in microLamports (default: 1) */
  computeUnitPrice?: number;
  /* Transaction version (default: "legacy") */
  version?: TransactionVersion;
  /* CU Limit (when not provided, the transaction will be simulated to get the correct value) */
  computeUnitLimit?: number;
  /* CU Limit Margin Multiplier (default: 1.1) */
  computeUnitLimitMultiplier?: number;
};

function asPreparableTransaction<
  T extends FullTransaction<
    TransactionVersion,
    ITransactionMessageWithFeePayer | ITransactionMessageWithFeePayerSigner
  >,
>(transaction: T): PrepareCompilableTransactionMessage {
  return transaction as PrepareCompilableTransactionMessage;
}

/**
 * A helper function to send and confirm an array of instructions
 * with automatic compute unit estimation and blockhash fetching and defaultnominal priority fees
 * @param client - The Solana client
 * @param feePayer - The fee payer
 * @param instructions - The instructions to send and confirm
 * @param options - The options for the send and confirm instructions
 *  - computeUnitPrice - The price of the compute unit in microLamports (default: 1)
 *  - version - The version of the transaction (default: "legacy")
 *  - computeUnitLimit - The compute unit limit (default: undefined, when not provided, the transaction will be simulated to get the correct value)
 *  - computeUnitLimitMultiplier - The margin multiplier for the compute unit limit (default: 1.1)
 * @param config - The config for the send and confirm instructions
 * @returns The signature of the transaction
 */
export async function sendAndConfirmInstructions(
  client: SolanaClient,
  feePayer: TransactionSigner,
  instructions: IInstruction[],
  options: SendAndConfirmInstructionsOptions = {},
  config?: SendAndConfirmTransactionConfig,
): Promise<Signature> {
  try {
    const { computeUnitLimit, computeUnitPrice = 1, version = "legacy", computeUnitLimitMultiplier = 1.1 } = options;

    const unpreparedTransaction = createTransaction({
      version,
      feePayer,
      instructions,
      computeUnitLimit: computeUnitLimit ?? MAX_COMPUTE_UNIT_LIMIT,
      computeUnitPrice,
    });

    const transaction = await prepareTransaction({
      transaction: asPreparableTransaction(unpreparedTransaction),
      rpc: client.rpc,
      computeUnitLimitMultiplier,
      computeUnitLimitReset: computeUnitLimit === undefined,
      blockhashReset: true,
    });

    const signature = await client.sendAndConfirmTransaction(transaction, config);
    return signature;
  } catch (error) {
    throw new Error(`Failed to send and confirm instructions:
      ${error instanceof SolanaError ? error.context + " - " : ""} 
      ${error instanceof Error ? error.message : "Unknown error"}`);
  }
}
