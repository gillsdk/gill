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
  Transaction,
  TransactionMessage,
  TransactionMessageWithFeePayer,
  TransactionWithLifetime,
} from "@solana/kit";
import {
  assertIsFullySignedTransaction,
  assertIsSendableTransaction,
  assertIsTransactionMessageWithBlockhashLifetime,
  assertIsTransactionWithBlockhashLifetime,
  assertIsTransactionWithinSizeLimit,
  Commitment,
  getBase64EncodedWireTransaction,
  getSignatureFromTransaction,
  sendAndConfirmDurableNonceTransactionFactory,
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
  | (TransactionMessage & TransactionMessageWithFeePayer)
  | (FullySignedTransaction & TransactionWithLifetime)
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
  // @ts-ignore - TODO(FIXME)
  const sendAndConfirmDurableNonceTransaction = sendAndConfirmDurableNonceTransactionFactory({ rpc, rpcSubscriptions });
  
  return async function sendAndConfirmTransactionWithSigners(transaction, config = { commitment: "confirmed" }) {
    let signedTransaction: (Transaction & FullySignedTransaction) | undefined;

    if ("messageBytes" in transaction === false) {
      if ("lifetimeConstraint" in transaction === false) {
        const { value: latestBlockhash } = await rpc.getLatestBlockhash().send({ abortSignal: config.abortSignal });
        transaction = setTransactionMessageLifetimeUsingBlockhash(latestBlockhash, transaction);
        assertIsTransactionMessageWithBlockhashLifetime(transaction);
      }

      // Ensure the transaction has fee payer
      if ("feePayer" in transaction === false) {
        throw new Error("Transaction must have a fee payer");
      }

      // Sign the transaction and ensure it has all required properties
      signedTransaction = await signTransactionMessageWithSigners(transaction);
    }

    // If the signing branch didn't run above, `signedTx` will be undefined.
    // Use an explicit undefined check (instead of a truthy check) to avoid
    // accidental falsy value edge-cases and then assign the provided
    // `transaction` as a fully-signed transaction.
    if (!signedTransaction) {
      // Cast via unknown to acknowledge the developer intent: if the
      // caller passed a fully-signed transaction, treat it as such.
      signedTransaction = transaction as unknown as Transaction & FullySignedTransaction;
    }

    assertIsTransactionWithinSizeLimit(signedTransaction);
    assertIsFullySignedTransaction(signedTransaction);
    assertIsSendableTransaction(signedTransaction);

    debug(`Sending transaction: ${getExplorerLink({ transaction: getSignatureFromTransaction(signedTransaction) })}`);
    debug(`Transaction as base64: ${getBase64EncodedWireTransaction(signedTransaction)}`, "debug");

    // Check if the transaction has a durable nonce lifetime or blockhash lifetime
    if (
      "lifetimeConstraint" in signedTransaction &&
      signedTransaction.lifetimeConstraint &&
      typeof signedTransaction.lifetimeConstraint === "object" &&
      "nonce" in signedTransaction.lifetimeConstraint
    ) {
      // Durable nonce transaction
      await sendAndConfirmDurableNonceTransaction(signedTransaction as any, config);
    } else {
      // Blockhash-based transaction
      assertIsTransactionWithBlockhashLifetime(signedTransaction);
      await sendAndConfirmTransaction(signedTransaction, config);
    }

    return getSignatureFromTransaction(signedTransaction);
  };
}
