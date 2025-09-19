/* eslint-disable @typescript-eslint/ban-ts-comment */

import type {
  BaseTransactionMessage,
  TransactionMessageWithFeePayer,
  Rpc,
  SolanaRpcApi,
  TransactionMessageWithBlockhashLifetime,
} from "@solana/kit";
import { signTransactionMessageWithSigners } from "@solana/kit";
import { prepareTransaction } from "../core";

// [DESCRIBE] prepareTransaction
async () => {
  const rpc = null as unknown as Rpc<SolanaRpcApi>;

  const transactionWithoutBlockhash = null as unknown as BaseTransactionMessage<"legacy"> &
    TransactionMessageWithFeePayer;

  const transactionWithBlockhash = null as unknown as BaseTransactionMessage<"legacy"> &
    TransactionMessageWithFeePayer &
    TransactionMessageWithBlockhashLifetime;

  // @ts-expect-error Base transaction should not be a signable
  signTransactionMessageWithSigners(transaction);

  signTransactionMessageWithSigners(transactionWithBlockhash);

  // Supports input transactions without a blockhash
  {
    const newTx = await prepareTransaction({
      rpc,
      transaction: transactionWithoutBlockhash,
    });

    signTransactionMessageWithSigners(newTx);
  }

  // Supports input transactions with a blockhash
  {
    const newTx = await prepareTransaction({
      rpc,
      transaction: transactionWithBlockhash,
    });

    signTransactionMessageWithSigners(newTx);
  }
};
