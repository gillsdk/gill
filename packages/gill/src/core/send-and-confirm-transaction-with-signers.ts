import type {
  BaseTransactionMessage,
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
  SlotNotificationsApi,
  TransactionMessageWithFeePayer,
  TransactionWithBlockhashLifetime,
} from "@solana/kit";
import {
  assertIsTransactionMessageWithBlockhashLifetime,
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

type SendableTransaction =
  | CompilableTransactionMessage
  | (FullySignedTransaction & TransactionWithBlockhashLifetime)
  | (BaseTransactionMessage & TransactionMessageWithFeePayer);

export type SendAndConfirmTransactionWithSignersFunction = (
  transaction: SendableTransaction,
  config?: Omit<
    SendAndConfirmTransactionWithBlockhashLifetimeConfig,
    "confirmRecentTransaction" | "rpc" | "transaction"
  >,
) => Promise<Signature>;

type SendAndConfirmTransactionWithSignersFactoryConfig = {
  rpc: Rpc<GetEpochInfoApi & GetSignatureStatusesApi & SendTransactionApi & GetLatestBlockhashApi>;
  rpcSubscriptions: RpcSubscriptions<SignatureNotificationsApi & SlotNotificationsApi>;
};

export function sendAndConfirmTransactionWithSignersFactory({
  rpc,
  rpcSubscriptions,
}: SendAndConfirmTransactionWithSignersFactoryConfig): SendAndConfirmTransactionWithSignersFunction {
  const sendAndConfirmTransaction = sendAndConfirmTransactionFactory({
    rpc,
    rpcSubscriptions,
  });
  return async function sendAndConfirmTransactionWithSigners(transaction, config = { commitment: "confirmed" }) {
    if ("messageBytes" in transaction == false) {
      if ("lifetimeConstraint" in transaction === false) {
        const { value: latestBlockhash } = await rpc.getLatestBlockhash().send({ abortSignal: config.abortSignal });
        transaction = setTransactionMessageLifetimeUsingBlockhash(latestBlockhash, transaction);
        assertIsTransactionMessageWithBlockhashLifetime(transaction);
      }
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
