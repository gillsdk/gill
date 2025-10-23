import { useWalletAccountTransactionSigner } from "@solana/react";
import { useSignTransaction as useSignTransactionBase } from "@solana/react";
import { SolanaSignTransactionOutput } from "@solana/wallet-standard-features";
import { DefaultError, useMutation, UseMutationOptions } from "@tanstack/react-query";
import {
  compileTransaction,
  createTransaction,
  CreateTransactionInput,
  getTransactionEncoder,
  TransactionSigner,
  TransactionVersion,
} from "gill";

import { useSolanaClient } from "./client.js";
import { useWallet } from "./wallet.js";

type CreateTransactionInputWithOptionalFeePayer<
  TVersion extends TransactionVersion | "auto",
  TFeePayer extends TransactionSigner,
> = Omit<CreateTransactionInput<TVersion, TFeePayer>, "feePayer"> & {
  feePayer?: TFeePayer;
};

export type UseSignAllTransactionsInput = {
  options?: Omit<
    UseMutationOptions<
      SolanaSignTransactionOutput[],
      DefaultError,
      CreateTransactionInputWithOptionalFeePayer<TransactionVersion | "auto", TransactionSigner>[],
      unknown
    >,
    "mutationFn"
  >;
};

export function useSignAllTransactions({ options }: UseSignAllTransactionsInput = {}) {
  const { account } = useWallet();
  if (!account) {
    throw new Error("No wallet account connected");
  }

  const { rpc, cluster } = useSolanaClient();
  const signer = useWalletAccountTransactionSigner(account, cluster);
  const signTransaction = useSignTransactionBase(account, cluster);

  const { mutate, mutateAsync, ...rest } = useMutation({
    ...options,
    mutationFn: async (
      inputs: CreateTransactionInputWithOptionalFeePayer<TransactionVersion | "auto", TransactionSigner>[],
    ): Promise<SolanaSignTransactionOutput[]> => {
      const results: SolanaSignTransactionOutput[] = [];
      const needsBlockhash = inputs.some((input) => !input.latestBlockhash);
      const latestBlockhash = needsBlockhash ? (await rpc.getLatestBlockhash().send()).value : undefined;

      for (const input of inputs) {
        const transaction = createTransaction({
          ...input,
          feePayer: input.feePayer ?? signer,
          latestBlockhash: input.latestBlockhash ?? latestBlockhash,
          version: input.version ?? "legacy",
        });

        results.push(
          await signTransaction({
            transaction: new Uint8Array(getTransactionEncoder().encode(compileTransaction(transaction))),
          }),
        );
      }

      return results;
    },
  });

  return {
    signAll: mutate,
    signAllAsync: mutateAsync,
    ...rest,
  };
}
