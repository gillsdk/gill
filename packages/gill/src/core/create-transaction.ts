import type { Simplify } from "../types";

import { getSetComputeUnitLimitInstruction, getSetComputeUnitPriceInstruction } from "@solana-program/compute-budget";
import type {
  Address,
  ITransactionMessageWithFeePayer,
  ITransactionMessageWithFeePayerSigner,
  TransactionMessageWithBlockhashLifetime,
  TransactionSigner,
  TransactionVersion,
} from "@solana/kit";
import {
  appendTransactionMessageInstruction,
  appendTransactionMessageInstructions,
  createTransactionMessage,
  isTransactionSigner,
  pipe,
  setTransactionMessageFeePayer,
  setTransactionMessageFeePayerSigner,
  setTransactionMessageLifetimeUsingBlockhash,
} from "@solana/kit";

import type { CreateTransactionInput, FullTransaction } from "../types/transactions";

/**
 * Simple interface for creating a Solana transaction
 */
export function createTransaction<TVersion extends TransactionVersion = "legacy", TFeePayer extends TransactionSigner = TransactionSigner>(
  props: CreateTransactionInput<TVersion, TFeePayer>,
): FullTransaction<TVersion, ITransactionMessageWithFeePayerSigner>;
export function createTransaction<TVersion extends TransactionVersion = "legacy", TFeePayer extends Address = Address>(
  props: CreateTransactionInput<TVersion, TFeePayer>,
): FullTransaction<TVersion, ITransactionMessageWithFeePayer>;
export function createTransaction<
  TVersion extends TransactionVersion = "legacy",
  TFeePayer extends TransactionSigner = TransactionSigner,
  TLifetimeConstraint extends TransactionMessageWithBlockhashLifetime["lifetimeConstraint"] = TransactionMessageWithBlockhashLifetime["lifetimeConstraint"],
>(
  props: CreateTransactionInput<TVersion, TFeePayer, TLifetimeConstraint>,
): Simplify<FullTransaction<TVersion, ITransactionMessageWithFeePayerSigner, TransactionMessageWithBlockhashLifetime>>;
export function createTransaction<
  TVersion extends TransactionVersion = "legacy",
  TFeePayer extends Address = Address,
  TLifetimeConstraint extends TransactionMessageWithBlockhashLifetime["lifetimeConstraint"] = TransactionMessageWithBlockhashLifetime["lifetimeConstraint"],
>(
  props: CreateTransactionInput<TVersion, TFeePayer, TLifetimeConstraint>,
): Simplify<FullTransaction<TVersion, ITransactionMessageWithFeePayer, TransactionMessageWithBlockhashLifetime>>;
export function createTransaction<
  TVersion extends TransactionVersion = "legacy",
  TFeePayer extends Address | TransactionSigner = Address | TransactionSigner,
  TLifetimeConstraint extends TransactionMessageWithBlockhashLifetime["lifetimeConstraint"] = TransactionMessageWithBlockhashLifetime["lifetimeConstraint"],
>(
  props: CreateTransactionInput<TVersion, TFeePayer, TLifetimeConstraint>,
): Simplify<FullTransaction<TVersion, ITransactionMessageWithFeePayer, TransactionMessageWithBlockhashLifetime>>;
export function createTransaction<TVersion extends TransactionVersion = "legacy", TFeePayer extends Address | TransactionSigner = TransactionSigner>({
  version = "legacy" as TVersion,
  feePayer,
  instructions,
  latestBlockhash,
  computeUnitLimit,
  computeUnitPrice,
}: CreateTransactionInput<TVersion, TFeePayer>): FullTransaction<
  TVersion,
  ITransactionMessageWithFeePayer | ITransactionMessageWithFeePayerSigner
> {
  return pipe(
    createTransactionMessage({ version }),
    (tx) => {
      if (latestBlockhash) {
        tx = setTransactionMessageLifetimeUsingBlockhash(latestBlockhash, tx);
      }
      if (typeof feePayer !== "string" && "address" in feePayer && isTransactionSigner(feePayer)) {
        return setTransactionMessageFeePayerSigner(feePayer, tx);
      } else return setTransactionMessageFeePayer(feePayer, tx);
    },
    (tx) => {
      if (typeof computeUnitLimit !== "undefined") {
        tx = appendTransactionMessageInstruction(
          getSetComputeUnitLimitInstruction({ units: Number(computeUnitLimit) }),
          tx,
        );
      }

      if (typeof computeUnitPrice !== "undefined") {
        tx = appendTransactionMessageInstruction(
          getSetComputeUnitPriceInstruction({ microLamports: Number(computeUnitPrice) }),
          tx,
        );
      }

      return appendTransactionMessageInstructions(instructions, tx);
    },
  );
}
