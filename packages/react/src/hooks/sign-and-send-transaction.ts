import { useWalletAccountTransactionSendingSigner } from "@solana/react";
import { useSignAndSendTransaction as useSignAndSendTransactionBase } from "@solana/react";
import { SolanaSignAndSendTransactionOutput } from "@solana/wallet-standard-features";
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

export type UseSignAndSendTransactionsInput = {
  options?: Omit<
    UseMutationOptions<
      SolanaSignAndSendTransactionOutput,
      DefaultError,
      CreateTransactionInputWithOptionalFeePayer<TransactionVersion | "auto", TransactionSigner>,
      unknown
    >,
    "mutationFn"
  >;
};

export function useSignAndSendTransaction({ options }: UseSignAndSendTransactionsInput = {}) {
  const { account } = useWallet();
  if (!account) {
    throw new Error("No wallet account connected");
  }

  const { rpc, cluster } = useSolanaClient();
  const signer = useWalletAccountTransactionSendingSigner(account, cluster);
  const signAndSendTransaction = useSignAndSendTransactionBase(account, cluster);

  const { mutate, mutateAsync, ...rest } = useMutation({
    ...options,
    mutationFn: async (
      input: CreateTransactionInputWithOptionalFeePayer<TransactionVersion | "auto", TransactionSigner>,
    ): Promise<SolanaSignAndSendTransactionOutput> => {
      const transaction = createTransaction({
        ...input,
        feePayer: input.feePayer ?? signer,
        latestBlockhash: input.latestBlockhash ?? (await rpc.getLatestBlockhash().send()).value,
        version: input.version ?? "legacy",
      });

      return await signAndSendTransaction({
        transaction: new Uint8Array(getTransactionEncoder().encode(compileTransaction(transaction))),
      });
    },
  });

  return {
    signAndSend: mutate,
    signAndSendAsync: mutateAsync,
    ...rest,
  };
}
