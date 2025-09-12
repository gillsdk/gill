import type {
  Address,
  TransactionMessageWithBlockhashLifetime,
  TransactionMessageWithFeePayer,
  TransactionMessageWithFeePayerSigner,
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
import { getSetComputeUnitLimitInstruction, getSetComputeUnitPriceInstruction } from "@solana-program/compute-budget";

import type { Simplify } from "../types";
import type { CreateTransactionInput, FullTransaction } from "../types/transactions";

/**
 * Simple interface for creating a Solana transaction
 */
export function createTransaction<TVersion extends TransactionVersion, TFeePayer extends TransactionSigner>(
  props: CreateTransactionInput<TVersion, TFeePayer>,
): FullTransaction<TVersion, TransactionMessageWithFeePayerSigner>;
export function createTransaction<TVersion extends TransactionVersion, TFeePayer extends Address>(
  props: CreateTransactionInput<TVersion, TFeePayer>,
): FullTransaction<TVersion, TransactionMessageWithFeePayer>;
export function createTransaction<
  TVersion extends TransactionVersion,
  TFeePayer extends TransactionSigner,
  TLifetimeConstraint extends TransactionMessageWithBlockhashLifetime["lifetimeConstraint"],
>(
  props: CreateTransactionInput<TVersion, TFeePayer, TLifetimeConstraint>,
): Simplify<FullTransaction<TVersion, TransactionMessageWithFeePayerSigner, TransactionMessageWithBlockhashLifetime>>;
export function createTransaction<
  TVersion extends TransactionVersion,
  TFeePayer extends Address,
  TLifetimeConstraint extends TransactionMessageWithBlockhashLifetime["lifetimeConstraint"],
>(
  props: CreateTransactionInput<TVersion, TFeePayer, TLifetimeConstraint>,
): Simplify<FullTransaction<TVersion, TransactionMessageWithFeePayer, TransactionMessageWithBlockhashLifetime>>;
export function createTransaction<
  TVersion extends TransactionVersion,
  TFeePayer extends Address | TransactionSigner,
  TLifetimeConstraint extends TransactionMessageWithBlockhashLifetime["lifetimeConstraint"],
>(
  props: CreateTransactionInput<TVersion, TFeePayer, TLifetimeConstraint>,
): Simplify<FullTransaction<TVersion, TransactionMessageWithFeePayer, TransactionMessageWithBlockhashLifetime>>;
export function createTransaction<TVersion extends TransactionVersion, TFeePayer extends Address | TransactionSigner>({
  version,
  feePayer,
  instructions,
  latestBlockhash,
  computeUnitLimit,
  computeUnitPrice,
}: CreateTransactionInput<TVersion, TFeePayer>): FullTransaction<
  TVersion,
  TransactionMessageWithFeePayer | TransactionMessageWithFeePayerSigner
> {
  return pipe(
    // Auto-select version: if any provided instruction appears to use an Address Lookup Table (ALT),
    // choose `v0`. Otherwise default to `legacy`. If the caller explicitly provides `version`, use it.
    (() => {
      const hasAlt = (() => {
        if (!instructions || !Array.isArray(instructions)) return false;
        return instructions.some((ix) => {
          if (!ix || typeof ix !== "object") return false;
          if (
            "addressTableLookup" in ix ||
            "addressTableLookups" in ix ||
            "addressLookupTable" in ix ||
            "lookupTable" in ix
          ) {
            return true;
          }
          try {
            const s = JSON.stringify(ix);
            return /address\s*lookup|addressTable/i.test(s) || s.includes("addressTable");
          } catch {
            return false;
          }
        });
      })();

      const selectedVersion = version ?? (hasAlt ? ("v0" as TVersion) : ("legacy" as TVersion));
      return createTransactionMessage({ version: selectedVersion });
    })(),
    (tx) => {
      const withLifetime = latestBlockhash ? setTransactionMessageLifetimeUsingBlockhash(latestBlockhash, tx) : tx;
      if (typeof feePayer !== "string" && "address" in feePayer && isTransactionSigner(feePayer)) {
        return setTransactionMessageFeePayerSigner(feePayer, withLifetime);
      } else return setTransactionMessageFeePayer(feePayer, withLifetime);
    },
    (tx) => {
      const withComputeLimit =
        typeof computeUnitLimit !== "undefined"
          ? appendTransactionMessageInstruction(
              getSetComputeUnitLimitInstruction({ units: Number(computeUnitLimit) }),
              tx,
            )
          : tx;

      const withComputePrice =
        typeof computeUnitPrice !== "undefined"
          ? appendTransactionMessageInstruction(
              getSetComputeUnitPriceInstruction({ microLamports: Number(computeUnitPrice) }),
              withComputeLimit,
            )
          : withComputeLimit;

      return appendTransactionMessageInstructions(instructions, withComputePrice);
    },
  );
}
