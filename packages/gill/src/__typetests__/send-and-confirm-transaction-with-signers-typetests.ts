/* eslint-disable @typescript-eslint/ban-ts-comment */
import {
  GetEpochInfoApi,
  GetLatestBlockhashApi,
  GetSignatureStatusesApi,
  Instruction,
  Rpc,
  RpcDevnet,
  RpcMainnet,
  RpcSubscriptions,
  RpcSubscriptionsDevnet,
  RpcSubscriptionsMainnet,
  RpcSubscriptionsTestnet,
  RpcTestnet,
  SendTransactionApi,
  SignatureNotificationsApi,
  signTransactionMessageWithSigners,
  SlotNotificationsApi,
  TransactionSigner,
  TransactionWithBlockhashLifetime,
  TransactionWithDurableNonceLifetime,
} from "@solana/kit";

import { createTransaction } from "../core";
import { sendAndConfirmTransactionWithSignersFactory } from "../core/send-and-confirm-transaction-with-signers";

const rpc = null as unknown as Rpc<
  GetEpochInfoApi & GetLatestBlockhashApi & GetSignatureStatusesApi & SendTransactionApi
>;
const rpcDevnet = null as unknown as RpcDevnet<
  GetEpochInfoApi & GetLatestBlockhashApi & GetSignatureStatusesApi & SendTransactionApi
>;
const rpcTestnet = null as unknown as RpcTestnet<
  GetEpochInfoApi & GetLatestBlockhashApi & GetSignatureStatusesApi & SendTransactionApi
>;
const rpcMainnet = null as unknown as RpcMainnet<
  GetEpochInfoApi & GetLatestBlockhashApi & GetSignatureStatusesApi & SendTransactionApi
>;

const rpcSubscriptions = null as unknown as RpcSubscriptions<SignatureNotificationsApi & SlotNotificationsApi>;
const rpcSubscriptionsDevnet = null as unknown as RpcSubscriptionsDevnet<
  SignatureNotificationsApi & SlotNotificationsApi
>;
const rpcSubscriptionsMainnet = null as unknown as RpcSubscriptionsMainnet<
  SignatureNotificationsApi & SlotNotificationsApi
>;
const rpcSubscriptionsTestnet = null as unknown as RpcSubscriptionsTestnet<
  SignatureNotificationsApi & SlotNotificationsApi
>;

const signer = "" as unknown as TransactionSigner;
const instruction = "" as unknown as Instruction;
const latestBlockhash = "" as unknown as ReturnType<GetLatestBlockhashApi["getLatestBlockhash"]>["value"];

// [DESCRIBE] sendAndConfirmTransactionWithSignersFactory
{
  {
    // It typechecks when the RPC clusters match.
    sendAndConfirmTransactionWithSignersFactory({ rpc, rpcSubscriptions });
    sendAndConfirmTransactionWithSignersFactory({ rpc: rpcDevnet, rpcSubscriptions: rpcSubscriptionsDevnet });
    sendAndConfirmTransactionWithSignersFactory({ rpc: rpcTestnet, rpcSubscriptions: rpcSubscriptionsTestnet });
    sendAndConfirmTransactionWithSignersFactory({ rpc: rpcMainnet, rpcSubscriptions: rpcSubscriptionsMainnet });
  }
  {
    // It typechecks when either RPC is generic.
    sendAndConfirmTransactionWithSignersFactory({ rpc, rpcSubscriptions });
    sendAndConfirmTransactionWithSignersFactory({ rpc: rpcDevnet, rpcSubscriptions });
    sendAndConfirmTransactionWithSignersFactory({ rpc: rpcTestnet, rpcSubscriptions });
    sendAndConfirmTransactionWithSignersFactory({ rpc: rpcMainnet, rpcSubscriptions });
  }
  {
    // It fails to typecheck when explicit RPC clusters mismatch.
    // @ts-expect-error
    sendAndConfirmTransactionWithSignersFactory({ rpc: rpcDevnet, rpcSubscriptions: rpcSubscriptionsTestnet });
    // @ts-expect-error
    sendAndConfirmTransactionWithSignersFactory({ rpc: rpcDevnet, rpcSubscriptions: rpcSubscriptionsMainnet });
    // @ts-expect-error
    sendAndConfirmTransactionWithSignersFactory({ rpc: rpcTestnet, rpcSubscriptions: rpcSubscriptionsMainnet });
    // @ts-expect-error
    sendAndConfirmTransactionWithSignersFactory({ rpc: rpcTestnet, rpcSubscriptions: rpcSubscriptionsDevnet });
    // @ts-expect-error
    sendAndConfirmTransactionWithSignersFactory({ rpc: rpcMainnet, rpcSubscriptions: rpcSubscriptionsDevnet });
    // @ts-expect-error
    sendAndConfirmTransactionWithSignersFactory({ rpc: rpcMainnet, rpcSubscriptions: rpcSubscriptionsTestnet });
  }

  {
    const sendAndConfirmTransaction = sendAndConfirmTransactionWithSignersFactory({ rpc, rpcSubscriptions });

    const signedTransactionWithBlockhashLifetime = "" as unknown as Awaited<
      ReturnType<typeof signTransactionMessageWithSigners>
    > &
      TransactionWithBlockhashLifetime;

    // Should accept a signed transaction with a blockhash based lifetime
    sendAndConfirmTransaction(signedTransactionWithBlockhashLifetime);

    const signedTransactionWithNonceLifetime = "" as unknown as Awaited<
      ReturnType<typeof signTransactionMessageWithSigners>
    > &
      TransactionWithDurableNonceLifetime;

    // @ts-expect-error - durable nonce transactions are not currently supported
    // todo: add support for nonce based transactions
    sendAndConfirmTransaction(signedTransactionWithNonceLifetime);

    // Should accept a legacy transaction, with or without a latest blockhash
    {
      const transactionWithoutLatestBlockhash = createTransaction({
        feePayer: signer,
        instructions: [instruction],
        version: "legacy",
      });

      const transactionWithLatestBlockhash = createTransaction({
        feePayer: signer,
        instructions: [instruction],
        latestBlockhash,
        version: "legacy",
      });

      // Should accept a signable transaction WITHOUT the latest blockhash
      sendAndConfirmTransaction(transactionWithoutLatestBlockhash);

      // Should accept a signable transaction WITH the latest blockhash
      sendAndConfirmTransaction(transactionWithLatestBlockhash);
    }

    // Should accept a versioned transaction, with or without a latest blockhash
    {
      const transactionWithoutLatestBlockhash = createTransaction({
        feePayer: signer,
        instructions: [instruction],
        version: 0,
      });

      const transactionWithLatestBlockhash = createTransaction({
        feePayer: signer,
        instructions: [instruction],
        latestBlockhash,
        version: 0,
      });

      // Should accept a signable transaction WITHOUT the latest blockhash
      sendAndConfirmTransaction(transactionWithoutLatestBlockhash);

      // Should accept a signable transaction WITH the latest blockhash
      sendAndConfirmTransaction(transactionWithLatestBlockhash);
    }
  }
}
