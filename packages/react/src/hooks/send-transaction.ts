"use client";

import { useSolanaClient } from "./client";
import { GILL_HOOK_CLIENT_KEY } from "../const";
import { useMutation, UseMutationOptions } from "@tanstack/react-query";
import { Base64EncodedWireTransaction, SendTransactionApi, Simplify } from "gill";

// Define the configuration type for the RPC method
type RpcConfig = Simplify<Parameters<SendTransactionApi["sendTransaction"]>[1]>;

// Define the response type for the hook
type UseSendTransactionResponse = ReturnType<SendTransactionApi["sendTransaction"]>;

type UseSendTransactionInput<TConfig extends RpcConfig = RpcConfig> = {
  /**
   * Signal used to abort the RPC operation
   *
   * See MDN docs for {@link https://developer.mozilla.org/en-US/docs/Web/API/AbortSignal | AbortSignal}
   */
  abortSignal?: AbortSignal;
  /**
   * RPC configuration passed to the RPC method being called
   */
  config?: TConfig;
  /**
   * Options passed to the {@link useMutation} hook
   */
  options?: UseMutationOptions<UseSendTransactionResponse, unknown, SendTransactionArgument, unknown>;
};

type SendTransactionArgument = Base64EncodedWireTransaction | string;

/**
 * Send a transaction using the Solana RPC method of
 * [`sendTransaction`](https://solana.com/docs/rpc/http/sendtransaction)
 *
 * @param config Optional RPC configuration (e.g. `skipPreflight`, `encoding`, `preflightCommitment`s).
 * @returns
 * - `sendTransaction`: async function to send a transaction
 * -  all standard `useMutation` fields (`isLoading`, `error`, etc.)
 *
 * The returned signature can be viewed in Solana Explorer.
 */
export function useSendTransaction<TConfig extends RpcConfig = RpcConfig>({
  options,
  config,
  abortSignal,
}: UseSendTransactionInput<TConfig>) {
  const { rpc } = useSolanaClient();

  const mutation = useMutation({
    mutationFn: async (tx: SendTransactionArgument) => {
      // The RPC method expects the base-64 encoded transaction as the first argument.
      const response = await rpc
        .sendTransaction(tx as Base64EncodedWireTransaction, {
          encoding: "base64",
          preflightCommitment: "confirmed",
          skipPreflight: false,
          ...(config),
        })
        .send({ abortSignal });
      // Returns a transaction Signature
      return response;
    },
    mutationKey: [GILL_HOOK_CLIENT_KEY, "sendTransaction"],
    networkMode: "offlineFirst",
    retry: false,
    ...options,
  });

  return {
    ...mutation,
    sendTransaction: mutation.mutateAsync,
  };
}
