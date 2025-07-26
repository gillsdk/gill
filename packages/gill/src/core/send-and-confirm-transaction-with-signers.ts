import type {
  CompilableTransactionMessage,
  FullySignedTransaction,
  GetEpochInfoApi,
  GetSignatureStatusesApi,
  Rpc,
  RpcSubscriptions,
  SendTransactionApi,
  Signature,
  SignatureNotificationsApi,
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

export type SendAndConfirmTransactionConfig = Omit<
  SendAndConfirmTransactionWithBlockhashLifetimeConfig,
  "confirmRecentTransaction" | "rpc" | "transaction"
>;

export type SendAndConfirmTransactionWithSignersFunction = (
  transaction: (FullySignedTransaction & TransactionWithBlockhashLifetime) | CompilableTransactionMessage,
  config?: SendAndConfirmTransactionConfig,
) => Promise<Signature>;

type SendAndConfirmTransactionWithSignersFactoryConfig<TCluster> = {
  rpc: Rpc<GetEpochInfoApi & GetSignatureStatusesApi & SendTransactionApi> & {
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
