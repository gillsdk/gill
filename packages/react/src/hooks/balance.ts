"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import type { Address, GetBalanceApi, Simplify } from "gill";
import { useEffect } from "react";

import { GILL_HOOK_CLIENT_KEY } from "../const.js";
import { useSolanaClient } from "./client.js";
import type { GillUseRpcHook } from "./types.js";
type RpcConfig = Simplify<Parameters<GetBalanceApi["getBalance"]>>[1];

type UseBalanceResponse = ReturnType<GetBalanceApi["getBalance"]>["value"];

type UseBalanceInput<TConfig extends RpcConfig = RpcConfig> = GillUseRpcHook<TConfig> & {
  /**
   * Address of the account to get the balance of
   */
  address: Address | string;
  /**
   * Whether to subscribe to account changes and update the balance.
   */
  subscribe?: boolean;
};

/**
 * Get an account's balance (in lamports) using the Solana RPC method of
 * [`getBalance`](https://solana.com/docs/rpc/http/getbalance)
 */
export function useBalance<TConfig extends RpcConfig = RpcConfig>({
  options,
  config,
  abortSignal,
  address,
  subscribe = false,
}: UseBalanceInput<TConfig>) {
  const { rpc, rpcSubscriptions, urlOrMoniker } = useSolanaClient();
  const queryKey = [GILL_HOOK_CLIENT_KEY, urlOrMoniker, "getBalance", address];
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!subscribe || !address) {
      return;
    }

    const controller = new AbortController();
    const signal = AbortSignal.any([controller.signal, abortSignal].filter(Boolean) as AbortSignal[]);

    const subscribeFn = async () => {
      const accountNotifications = await rpcSubscriptions
        .accountNotifications(address as Address)
        .subscribe({ abortSignal: signal });

      for await (const notification of accountNotifications) {
        queryClient.setQueryData(queryKey, notification.value.lamports);
      }
    };

    void subscribeFn();

    return () => {
      controller.abort();
    };
  }, [subscribe, address, abortSignal, queryKey, queryClient, rpcSubscriptions]);

  const { data, ...rest } = useQuery({
    ...options,
    enabled: (options?.enabled ?? true) && !!address,
    networkMode: "offlineFirst",
    queryFn: async () => {
      const { value } = await rpc.getBalance(address as Address, config).send({ abortSignal });
      return value;
    },
    queryKey,
  });

  return {
    ...rest,
    balance: data as UseBalanceResponse,
  };
}
