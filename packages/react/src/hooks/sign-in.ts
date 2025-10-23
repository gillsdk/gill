import { useSignIn as useSignInBase } from "@solana/react";
import { SolanaSignInOutput } from "@solana/wallet-standard-features";
import { DefaultError, useMutation, UseMutationOptions } from "@tanstack/react-query";

import { useWallet } from "./wallet.js";

export type UseSignInTransactionsConfig = {
  options?: Omit<UseMutationOptions<SolanaSignInOutput, DefaultError, void, unknown>, "mutationFn">;
};

export function useSignIn({ options }: UseSignInTransactionsConfig = {}) {
  const { account } = useWallet();
  if (!account) {
    throw new Error("No wallet account connected");
  }

  const signIn = useSignInBase(account);

  const { mutate, mutateAsync, ...rest } = useMutation({
    ...options,
    mutationFn: async (): Promise<SolanaSignInOutput> => {
      return await signIn();
    },
  });

  return {
    signIn: mutate,
    signInAsync: mutateAsync,
    ...rest,
  };
}
