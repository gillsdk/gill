import type { Address, BaseTransactionMessage } from "@solana/kit";
import { AccountRole, SOLANA_ERROR__INSTRUCTION_ERROR__GENERIC_ERROR, SolanaError } from "@solana/kit";

import type { getOldestSignatureForAddress } from "./get-oldest-signature";

/**
 * Insert a single of reference key {@link Address} into a transaction message
 *
 * Use {@link getOldestSignatureForAddress} to locate the oldest signature for a reference key's address
 *
 * Note: The `transaction` must have at least one non-memo instruction.
 */
export function insertReferenceKeyToTransactionMessage<TTransaction extends BaseTransactionMessage>(
  reference: Address,
  transaction: TTransaction,
): TTransaction {
  return insertReferenceKeysToTransactionMessage([reference], transaction);
}

/**
 * Insert multiple reference key {@link Address | Addresses} into a transaction message
 *
 * Use {@link getOldestSignatureForAddress} to locate the oldest signature for a reference key's address
 *
 * Note: The `transaction` must have at least one non-memo instruction.
 */
export function insertReferenceKeysToTransactionMessage<TTransaction extends BaseTransactionMessage>(
  references: Address[],
  transaction: TTransaction,
): TTransaction {
  const nonMemoIndex = transaction.instructions.findIndex(
    (ix) => ix.programAddress !== "MemoSq4gqABAXKb96qnH8TysNcWxMyWCqXgDLGmfcHr",
  );

  if (transaction.instructions.length == 0 || nonMemoIndex == -1) {
    throw new SolanaError(SOLANA_ERROR__INSTRUCTION_ERROR__GENERIC_ERROR, {
      cause: "At least one non-memo instruction is required",
      index: transaction.instructions.length || nonMemoIndex,
    });
  }

  const modifiedIx = {
    ...transaction.instructions[nonMemoIndex],
    accounts: [
      ...(transaction.instructions[nonMemoIndex].accounts || []),
      // actually insert the reference keys
      ...references.map((ref) => ({
        address: ref,
        role: AccountRole.READONLY,
      })),
    ],
  };

  const instructions = [...transaction.instructions];
  instructions.splice(nonMemoIndex, 1, modifiedIx);

  return Object.freeze({
    ...transaction,
    instructions: Object.freeze(instructions),
  });
}
