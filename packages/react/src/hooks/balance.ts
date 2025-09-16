"use client";

import { useQuery } from "@tanstack/react-query";
import type { Address, GetBalanceApi, Simplify } from "gill";
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
}: UseBalanceInput<TConfig>) {
  const { rpc } = useSolanaClient();
  const { data, ...rest } = useQuery({
    networkMode: "offlineFirst",
    ...options,
    enabled: !!address,
    queryKey: [GILL_HOOK_CLIENT_KEY, "getBalance", address],
    queryFn: async () => {
      const { value } = await rpc.getBalance(address as Address, config).send({ abortSignal });
      return value;
    },
  });
  return {
    ...rest,
    balance: data as UseBalanceResponse,
  };
}
