import { useSignMessage as useSignMessageBase } from "@solana/react";
import { SolanaSignMessageOutput } from "@solana/wallet-standard-features";
import { DefaultError, useMutation, UseMutationOptions } from "@tanstack/react-query";
import { getUtf8Encoder } from "gill";

import { useWallet } from "./wallet.js";

export type UseSignMessageInput = {
  options?: Omit<UseMutationOptions<SolanaSignMessageOutput, DefaultError, string, unknown>, "mutationFn">;
};

export function useSignMessage({ options }: UseSignMessageInput = {}) {
  const { account } = useWallet();
  if (!account) {
    throw new Error("No wallet account connected");
  }

  const signMessage = useSignMessageBase(account);

  const { mutate, mutateAsync, ...rest } = useMutation({
    ...options,
    mutationFn: async (input: string): Promise<SolanaSignMessageOutput> => {
      return await signMessage({
        message: new Uint8Array(getUtf8Encoder().encode(input)),
      });
    },
  });

  return {
    sign: mutate,
    signAsync: mutateAsync,
    ...rest,
  };
}
