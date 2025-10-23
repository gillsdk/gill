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

export type UseSignTransactionInput = {
  options?: Omit<
    UseMutationOptions<
      SolanaSignTransactionOutput,
      DefaultError,
      CreateTransactionInputWithOptionalFeePayer<TransactionVersion | "auto", TransactionSigner>,
      unknown
    >,
    "mutationFn"
  >;
};

export function useSignTransaction({ options }: UseSignTransactionInput = {}) {
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
      input: CreateTransactionInputWithOptionalFeePayer<TransactionVersion | "auto", TransactionSigner>,
    ): Promise<SolanaSignTransactionOutput> => {
      const transaction = createTransaction({
        ...input,
        feePayer: input.feePayer ?? signer,
        latestBlockhash: input.latestBlockhash ?? (await rpc.getLatestBlockhash().send()).value,
        version: input.version ?? "legacy",
      });

      return await signTransaction({
        transaction: new Uint8Array(getTransactionEncoder().encode(compileTransaction(transaction))),
      });
    },
  });

  return {
    sign: mutate,
    signAsync: mutateAsync,
    ...rest,
  };
}
