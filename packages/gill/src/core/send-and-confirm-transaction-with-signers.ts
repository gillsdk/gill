import type {
  BaseTransactionMessage,
  FullySignedTransaction,
  GetEpochInfoApi,
  GetLatestBlockhashApi,
  GetSignatureStatusesApi,
  Rpc,
  RpcSubscriptions,
  SendTransactionApi,
  Signature,
  SignatureNotificationsApi,
  SlotNotificationsApi,
  TransactionMessage,
  TransactionMessageWithFeePayer,
  TransactionMessageWithSigners,
  TransactionWithBlockhashLifetime,
} from "@solana/kit";
import {
  assertIsTransactionMessageWithBlockhashLifetime,
  assertIsTransactionWithBlockhashLifetime,
  Commitment,
  getBase64EncodedWireTransaction,
  getSignatureFromTransaction,
  sendAndConfirmTransactionFactory,
  setTransactionMessageLifetimeUsingBlockhash,
  signTransactionMessageWithSigners,
} from "@solana/kit";
import { type waitForRecentTransactionConfirmation } from "@solana/transaction-confirmation";
import { debug } from "./debug";
import { getExplorerLink } from "./explorer";

interface SendAndConfirmTransactionWithBlockhashLifetimeConfig extends SendTransactionConfigWithoutEncoding {
  confirmRecentTransaction: (
    config: Omit<
      Parameters<typeof waitForRecentTransactionConfirmation>[0],
      "getBlockHeightExceedencePromise" | "getRecentSignatureConfirmationPromise"
    >,
  ) => Promise<void>;
  abortSignal?: AbortSignal;
  commitment: Commitment;
}

type SendTransactionConfigWithoutEncoding = Omit<
  NonNullable<Parameters<SendTransactionApi["sendTransaction"]>[1]>,
  "encoding"
>;

import type { SignaturesMap, TransactionMessageBytes, TransactionWithinSizeLimit } from "@solana/kit";



type SendableTransaction =
  | (TransactionMessage & TransactionMessageWithFeePayer)
  | (FullySignedTransaction & TransactionWithBlockhashLifetime)
  | (BaseTransactionMessage & TransactionMessageWithFeePayer);

export type SendAndConfirmTransactionWithSignersFunction = (
  transaction: SendableTransaction,
  config?: Omit<
    SendAndConfirmTransactionWithBlockhashLifetimeConfig,
    "confirmRecentTransaction" | "rpc" | "transaction"
  >,
) => Promise<Signature>;

type SendAndConfirmTransactionWithSignersFactoryConfig<TCluster> = {
  rpc: Rpc<GetEpochInfoApi & GetSignatureStatusesApi & SendTransactionApi & GetLatestBlockhashApi> & {
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
    let signedTx = transaction;
    
    // If the transaction is not already serialized
    if (!("messageBytes" in signedTx)) {
      // If it doesn't have a blockhash, add it
      if (!("lifetimeConstraint" in signedTx)) {
        const { value: latestBlockhash } = await rpc.getLatestBlockhash().send({ abortSignal: config.abortSignal });
        signedTx = setTransactionMessageLifetimeUsingBlockhash(latestBlockhash, signedTx);
        assertIsTransactionMessageWithBlockhashLifetime(signedTx);
      }

      // Ensure the transaction has fee payer
      if (!("feePayer" in signedTx)) {
        throw new Error("Transaction must have a fee payer");
      }

      // Sign the transaction and ensure it has all required properties
      const tempTx = await signTransactionMessageWithSigners(signedTx as TransactionMessage & TransactionMessageWithFeePayer & TransactionMessageWithSigners);
      assertIsTransactionWithBlockhashLifetime(tempTx); 
    }

    // Assert that we have a fully signed transaction with all required properties
    const finalTransaction = signedTx as unknown as FullySignedTransaction & 
      TransactionWithBlockhashLifetime & 
      TransactionWithinSizeLimit & 
      Readonly<{ messageBytes: TransactionMessageBytes; signatures: SignaturesMap }>;

    debug(`Sending transaction: ${getExplorerLink({ transaction: getSignatureFromTransaction(finalTransaction) })}`);
    debug(`Transaction as base64: ${getBase64EncodedWireTransaction(finalTransaction)}`, "debug");
    
    await sendAndConfirmTransaction(finalTransaction, config);
    return getSignatureFromTransaction(finalTransaction);
  };
}
