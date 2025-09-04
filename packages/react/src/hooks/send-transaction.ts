"use client";

import { GillUseRpcHook } from "./types";
import { useSolanaClient } from "./client";
import { GILL_HOOK_CLIENT_KEY } from "../const";
import { useMutation } from "@tanstack/react-query";
import { Base64EncodedWireTransaction, SendTransactionApi, Simplify } from "gill";

// Define the configuration type for the RPC method
type RpConfig = Simplify<Parameters<SendTransactionApi["sendTransaction"]>[1]>;

// Define the response type for the hook
type UseSendTransactionResponse = ReturnType<SendTransactionApi["sendTransaction"]>;

type UseSendTransactionInput<TConfig extends RpConfig = RpConfig> = GillUseRpcHook<TConfig> & {
  config?: TConfig;
  /**
   *  The signed transaction in wire format, as a base-64 encoded string.
   */
  transaction: Base64EncodedWireTransaction | string;
};

/**
 * Send a transaction using the Solana RPC method of
 * [`sendTransaction`](https://solana.com/docs/rpc/http/sendtransaction)
 *
 * @returns An object from useMutation, including `signature`(the transaction signature) in an object
 */
export function useSendTransaction<TConfig extends RpConfig = RpConfig>({
  transaction,
  config,
}: UseSendTransactionInput<TConfig>) {
  const { rpc } = useSolanaClient();

  const { data, ...rest } = useMutation({
    mutationFn: async () => {
      // The RPC method expects the base-64 encoded transaction as the first argument.
      const response = await rpc
        .sendTransaction(transaction as Base64EncodedWireTransaction, {
          encoding: "base64",
          preflightCommitment: "confirmed",
          skipPreflight: false,
          ...(config || {}),
        })
        .send();
      // return the transaction signature as a base-64 encoded string
      return response;
    },
    mutationKey: [GILL_HOOK_CLIENT_KEY, "sendTransaction"],
    networkMode: "offlineFirst",
  });

  return {
    ...rest,
    transaction: data as UseSendTransactionResponse,
  };
}
