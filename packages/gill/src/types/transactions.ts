import type {
  Address,
  BaseTransactionMessage,
  Instruction,
  TransactionMessageWithBlockhashLifetime,
  TransactionMessageWithDurableNonceLifetime,
  TransactionMessageWithFeePayer,
  TransactionMessageWithFeePayerSigner,
  TransactionSigner,
  TransactionVersion,
} from "@solana/kit";

import type { Simplify } from ".";

export type CreateTransactionInput<
  TVersion extends TransactionVersion | "auto",
  TFeePayer extends Address | TransactionSigner = TransactionSigner,
  TLifetimeConstraint extends
    | TransactionMessageWithBlockhashLifetime["lifetimeConstraint"] 
    | TransactionMessageWithDurableNonceLifetime["lifetimeConstraint"]
    | undefined = undefined,
> = {
  /** Compute unit limit value to set on this transaction */
  computeUnitLimit?: bigint | number;
  /** Compute unit price (in micro-lamports) to set on this transaction */
  computeUnitPrice?: bigint | number;
  /** Address or Signer that will pay transaction fees */
  feePayer: TFeePayer;
  /** List of instructions for this transaction */
  instructions: Instruction[];
  /**
   * Latest blockhash (aka transaction lifetime) for this transaction to
   * accepted for execution on the Solana network
   * */
  latestBlockhash?: TLifetimeConstraint;
  /**
   * Durable nonce lifetime for this transaction to
   * accepted for execution on the Solana network
   * */
  durableNonce?: TLifetimeConstraint;
  /**
   * Transaction version
   * - `auto` automatically selects based on instruction content (default)
   * - `legacy` for traditional transactions
   * - `0` for transactions using Address Lookup Tables
   *
   * @default `auto`
   * */
  version?: TVersion;
};

export type FullTransaction<
  TVersion extends TransactionVersion,
  TFeePayer extends TransactionMessageWithFeePayer | TransactionMessageWithFeePayerSigner,
  TLifetime extends 
    | TransactionMessageWithBlockhashLifetime 
    | TransactionMessageWithDurableNonceLifetime 
    | undefined = undefined,
> = Simplify<
  BaseTransactionMessage<TVersion> &
    TFeePayer &
    (TLifetime extends TransactionMessageWithBlockhashLifetime
      ? TransactionMessageWithBlockhashLifetime
      : TLifetime extends TransactionMessageWithDurableNonceLifetime
        ? TransactionMessageWithDurableNonceLifetime
        : object)
>;
