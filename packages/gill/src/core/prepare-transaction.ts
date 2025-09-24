import { COMPUTE_BUDGET_PROGRAM_ADDRESS, getSetComputeUnitLimitInstruction } from "@solana-program/compute-budget";
import type {
  CompilableTransactionMessage,
  GetLatestBlockhashApi,
  Rpc,
  SimulateTransactionApi,
  TransactionMessage,
  TransactionMessageWithBlockhashLifetime,
  TransactionMessageWithFeePayer,
} from "@solana/kit";
import {
  appendTransactionMessageInstruction,
  assertIsTransactionMessageWithBlockhashLifetime,
  getComputeUnitEstimateForTransactionMessageFactory,
  setTransactionMessageLifetimeUsingBlockhash,
} from "@solana/kit";
import { isSetComputeLimitInstruction } from "../programs/compute-budget";
import { transactionToBase64WithSigners } from "./base64-to-transaction";
import { debug, isDebugEnabled } from "./debug";

type PrepareCompilableTransactionMessage =
  | CompilableTransactionMessage
  | (TransactionMessageWithFeePayer & TransactionMessage);

export type PrepareTransactionConfig<TMessage extends PrepareCompilableTransactionMessage> = {
  /**
   * Transaction to prepare for sending to the blockchain
   */
  transaction: TMessage;
  /**
   * RPC client capable of simulating transactions and getting the latest blockhash
   **/
  rpc: Rpc<GetLatestBlockhashApi & SimulateTransactionApi>;
  /**
   * Multiplier applied to the simulated compute unit value obtained from simulation
   *
   * Default: `1.1`
   **/
  computeUnitLimitMultiplier?: number;
  /**
   * Whether or not you wish to force reset the compute unit limit value (if one is already set)
   * using the simulation response and `computeUnitLimitMultiplier`
   **/
  computeUnitLimitReset?: boolean;
  /**
   * Whether or not you wish to force reset the latest blockhash (if one is already set)
   *
   * Default: `true`
   **/
  blockhashReset?: boolean;
};

/**
 * Prepare a Transaction to be signed and sent to the network. Including:
 * - setting a compute unit limit (if not already set)
 * - fetching the latest blockhash (if not already set)
 * - (optional) simulating and resetting the compute unit limit
 * - (optional) resetting latest blockhash to the most recent
 */
export async function prepareTransaction<TMessage extends PrepareCompilableTransactionMessage>(
  config: PrepareTransactionConfig<TMessage>,
): Promise<TMessage & TransactionMessageWithBlockhashLifetime> {
  // set the config defaults
  if (!config.computeUnitLimitMultiplier) config.computeUnitLimitMultiplier = 1.1;
  if (config.blockhashReset !== false) config.blockhashReset = true;

  const computeBudgetIndex = {
    limit: -1,
    price: -1,
  };

  config.transaction.instructions.map((ix, index) => {
    if (ix.programAddress != COMPUTE_BUDGET_PROGRAM_ADDRESS) return;

    if (isSetComputeLimitInstruction(ix)) {
      computeBudgetIndex.limit = index;
    }
    // else if (isSetComputeUnitPriceInstruction(ix)) {
    //   computeBudgetIndex.price = index;
    // }
  });

  // set a compute unit limit instruction
  if (computeBudgetIndex.limit < 0 || config.computeUnitLimitReset) {
    const units = await getComputeUnitEstimateForTransactionMessageFactory({ rpc: config.rpc })(config.transaction);
    debug(`Obtained compute units from simulation: ${units}`, "debug");
    const ix = getSetComputeUnitLimitInstruction({
      units: units * config.computeUnitLimitMultiplier,
    });

    if (computeBudgetIndex.limit < 0) {
      config.transaction = appendTransactionMessageInstruction(ix, config.transaction) as unknown as TMessage;
    } else if (config.computeUnitLimitReset) {
      const nextInstructions = [...config.transaction.instructions];
      nextInstructions.splice(computeBudgetIndex.limit, 1, ix);
      config.transaction = Object.freeze({
        ...config.transaction,
        instructions: nextInstructions,
      } as TMessage);
    }
  }

  // update the latest blockhash
  if (config.blockhashReset || "lifetimeConstraint" in config.transaction == false) {
    const { value: latestBlockhash } = await config.rpc.getLatestBlockhash().send();
    if ("lifetimeConstraint" in config.transaction == false) {
      debug("Transaction missing latest blockhash, fetching one.", "debug");
      config.transaction = setTransactionMessageLifetimeUsingBlockhash(
        latestBlockhash,
        config.transaction,
      ) as unknown as TMessage;
    } else if (config.blockhashReset) {
      debug("Auto resetting the latest blockhash.", "debug");
      config.transaction = Object.freeze({
        ...config.transaction,
        lifetimeConstraint: latestBlockhash,
      } as TransactionMessageWithBlockhashLifetime & typeof config.transaction);
    }
  }

  assertIsTransactionMessageWithBlockhashLifetime(config.transaction);

  // skip the async call if debugging is off
  if (isDebugEnabled()) {
    debug(`Transaction as base64: ${await transactionToBase64WithSigners(config.transaction)}`, "debug");
  }

  return config.transaction;
}
