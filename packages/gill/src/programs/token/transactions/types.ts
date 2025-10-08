import type {
  Address,
  TransactionMessageWithBlockhashLifetime,
  TransactionSigner,
  TransactionVersion,
} from "@solana/kit";

import type { CreateTransactionInput, Simplify } from "../../../types";

export type TransactionBuilderInput<
  TVersion extends TransactionVersion = "legacy",
  TFeePayer extends Address | TransactionSigner = TransactionSigner,
  TLifetimeConstraint extends TransactionMessageWithBlockhashLifetime["lifetimeConstraint"] | undefined = undefined,
> = Simplify<
  Omit<CreateTransactionInput<TVersion, TFeePayer, TLifetimeConstraint>, "feePayer" | "instructions" | "version"> &
    Partial<Pick<CreateTransactionInput<TVersion, TFeePayer, TLifetimeConstraint>, "version">>
>;
