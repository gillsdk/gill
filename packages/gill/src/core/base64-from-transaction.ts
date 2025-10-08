import { getBase64Encoder, getTransactionDecoder, type Transaction } from "@solana/kit";

import type { transactionToBase64, transactionToBase64WithSigners } from "./base64-to-transaction";

/**
 * Convert a base64 encoded transaction string into compiled transaction
 *
 * Use {@link transactionToBase64} or {@link transactionToBase64WithSigners} to create the base64 encoded transaction string
 */
export function transactionFromBase64(base64EncodedTransaction: string): Transaction {
  return getTransactionDecoder().decode(getBase64Encoder().encode(base64EncodedTransaction));
}
