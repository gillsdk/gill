import type {
  CompilableTransactionMessage,
  FullySignedTransaction,
  GetEpochInfoApi,
  GetLatestBlockhashApi,
  GetSignatureStatusesApi,
  Rpc,
  RpcSubscriptions,
  SendTransactionApi,
  Signature,
  SignatureNotificationsApi,
  SimulateTransactionApi,
  SlotNotificationsApi,
  TransactionWithBlockhashLifetime,
} from "@solana/kit";
import {
  Commitment,
  getBase64EncodedWireTransaction,
  getSignatureFromTransaction,
  sendAndConfirmTransactionFactory,
  signTransactionMessageWithSigners,
} from "@solana/kit";
import { type waitForRecentTransactionConfirmation } from "@solana/transaction-confirmation";
import { debug } from "./debug";
import { getExplorerLink } from "./explorer";
import { prepareTransaction } from "./prepare-transaction";
import { hasSetComputeLimitInstruction } from "../programs/compute-budget/utils";

interface SendAndConfirmTransactionWithBlockhashLifetimeConfig
  extends SendTransactionBaseConfig,
    SendTransactionConfigWithoutEncoding {
  confirmRecentTransaction: (
    config: Omit<
      Parameters<typeof waitForRecentTransactionConfirmation>[0],
      "getBlockHeightExceedencePromise" | "getRecentSignatureConfirmationPromise"
    >,
  ) => Promise<void>;
  transaction: FullySignedTransaction & TransactionWithBlockhashLifetime;
}

interface SendTransactionBaseConfig extends SendTransactionConfigWithoutEncoding {
  abortSignal?: AbortSignal;
  commitment: Commitment;
  rpc: Rpc<SendTransactionApi>;
  transaction: FullySignedTransaction;
}

type SendTransactionConfigWithoutEncoding = Omit<
  NonNullable<Parameters<SendTransactionApi["sendTransaction"]>[1]>,
  "encoding"
>;

/**
 * Configuration for automatic transaction preparation
 */
export type SendAndConfirmTransactionPrepareConfig = {
  /**
   * Multiplier applied to the simulated compute unit value obtained from simulation
   * @default 1.1
   */
  computeUnitLimitMultiplier?: number;
  /**
   * Whether to allow automatic compute unit limit estimation when missing
   * @default true
   */
  allowComputeUnitLimitReset?: boolean;
  /**
   * Whether to force automatic blockhash fetching
   * (this might be useful to get a fresher blockhash if you have to simulate to get CUs)
   * @default false
   */
  forceBlockhashReset?: boolean;
};

export type SendAndConfirmTransactionConfig = Omit<
  SendAndConfirmTransactionWithBlockhashLifetimeConfig,
  "confirmRecentTransaction" | "rpc" | "transaction"
> & {
  /**
   * Configuration for automatic transaction preparation
   */
  prepareTransactionConfig?: SendAndConfirmTransactionPrepareConfig;
};

export type SendAndConfirmTransactionWithSignersFunction = (
  transaction: (FullySignedTransaction & TransactionWithBlockhashLifetime) | CompilableTransactionMessage,
  config?: SendAndConfirmTransactionConfig,
) => Promise<Signature>;

type SendAndConfirmTransactionWithSignersFactoryConfig<TCluster> = {
  rpc: Rpc<GetEpochInfoApi & GetLatestBlockhashApi & GetSignatureStatusesApi & SendTransactionApi & SimulateTransactionApi> & {
    "~cluster"?: TCluster;
  };
  rpcSubscriptions: RpcSubscriptions<SignatureNotificationsApi & SlotNotificationsApi> & {
    "~cluster"?: TCluster;
  };
};

export function sendAndConfirmTransactionWithSignersFactory({
  rpc,
  rpcSubscriptions,
}: SendAndConfirmTransactionWithSignersFactoryConfig<"devnet">): SendAndConfirmTransactionWithSignersFunction;
export function sendAndConfirmTransactionWithSignersFactory({
  rpc,
  rpcSubscriptions,
}: SendAndConfirmTransactionWithSignersFactoryConfig<"testnet">): SendAndConfirmTransactionWithSignersFunction;
export function sendAndConfirmTransactionWithSignersFactory({
  rpc,
  rpcSubscriptions,
}: SendAndConfirmTransactionWithSignersFactoryConfig<"mainnet">): SendAndConfirmTransactionWithSignersFunction;
export function sendAndConfirmTransactionWithSignersFactory({
  rpc,
  rpcSubscriptions,
}: SendAndConfirmTransactionWithSignersFactoryConfig<"localnet">): SendAndConfirmTransactionWithSignersFunction;
export function sendAndConfirmTransactionWithSignersFactory<
  TCluster extends "devnet" | "mainnet" | "testnet" | "localnet" | undefined = undefined,
>({
  rpc,
  rpcSubscriptions,
}: SendAndConfirmTransactionWithSignersFactoryConfig<TCluster>): SendAndConfirmTransactionWithSignersFunction {
  // @ts-ignore - TODO(FIXME)
  const sendAndConfirmTransaction = sendAndConfirmTransactionFactory({ rpc, rpcSubscriptions });
  return async function sendAndConfirmTransactionWithSigners(transaction, config = { commitment: "confirmed" }) {
    // Merge user config with defaults
    const prepareTransactionConfig = {
      computeUnitLimitMultiplier: 1.1,
      allowComputeUnitLimitReset: true,
      forceBlockhashReset: false,
      ...config.prepareTransactionConfig,
    };
    
    // Check if transaction needs preparation (missing blockhash or compute units)
    const needsBlockhash = !("lifetimeConstraint" in transaction) || prepareTransactionConfig.forceBlockhashReset;
    const needsComputeUnits = "instructions" in transaction && !hasSetComputeLimitInstruction(transaction) && prepareTransactionConfig.allowComputeUnitLimitReset;
    
    if (needsBlockhash || needsComputeUnits) {
      debug("Preparing transaction: fetching blockhash and/or estimating compute units", "debug");
      transaction = await prepareTransaction({
        transaction: transaction as any,
        rpc,
        computeUnitLimitMultiplier: prepareTransactionConfig.computeUnitLimitMultiplier,
        computeUnitLimitReset: needsComputeUnits,
        blockhashReset: needsBlockhash,
      });
    }
    
    if ("messageBytes" in transaction == false) {
      transaction = (await signTransactionMessageWithSigners(transaction)) as Readonly<
        FullySignedTransaction & TransactionWithBlockhashLifetime
      >;
    }
    debug(`Sending transaction: ${getExplorerLink({ transaction: getSignatureFromTransaction(transaction) })}`);
    debug(`Transaction as base64: ${getBase64EncodedWireTransaction(transaction)}`, "debug");
    await sendAndConfirmTransaction(transaction, config);
    return getSignatureFromTransaction(transaction);
  };
}

