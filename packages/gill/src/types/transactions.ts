import type {
  Address,
  BaseTransactionMessage,
  IInstruction,
  ITransactionMessageWithFeePayer,
  ITransactionMessageWithFeePayerSigner,
  TransactionMessageWithBlockhashLifetime,
  TransactionSigner,
  TransactionVersion
} from "@solana/kit";
import type { Simplify } from ".";

export type CreateTransactionInput<
  TVersion extends TransactionVersion,
  TFeePayer extends Address | TransactionSigner = TransactionSigner,
  TLifetimeConstraint extends TransactionMessageWithBlockhashLifetime["lifetimeConstraint"] | undefined = undefined,
> = {
  /**
   * Transaction version
   * - `legacy` is commonly used
   * - `0` is needed for use with Address Lookup Tables
   *
   * @default `legacy`
   * */
  version?: TVersion;
  /** List of instructions for this transaction */
  instructions: IInstruction[];
  /** Address or Signer that will pay transaction fees */
  feePayer: TFeePayer;
  /**
   * Latest blockhash (aka transaction lifetime) for this transaction to
   * accepted for execution on the Solana network
   * */
  latestBlockhash?: TLifetimeConstraint;
  /** Compute unit limit value to set on this transaction */
  computeUnitLimit?: number | bigint;
  /** Compute unit price (in micro-lamports) to set on this transaction */
  computeUnitPrice?: number | bigint;
};

export type FullTransaction<
  TVersion extends TransactionVersion,
  TFeePayer extends ITransactionMessageWithFeePayer | ITransactionMessageWithFeePayerSigner,
  TBlockhashLifetime extends TransactionMessageWithBlockhashLifetime | undefined = undefined,
> = Simplify<
  BaseTransactionMessage<TVersion> &
    TFeePayer &
    (TBlockhashLifetime extends TransactionMessageWithBlockhashLifetime ? TransactionMessageWithBlockhashLifetime : {})
>;

export type Plan<TArtifacts = {}> = {
  ixs: IInstruction[];
  artifacts: TArtifacts;
};
