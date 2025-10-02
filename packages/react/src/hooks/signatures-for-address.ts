"use client";

import { useQuery } from "@tanstack/react-query";
import { Address, GetSignaturesForAddressApi, Simplify } from "gill";

import { GILL_HOOK_CLIENT_KEY } from "../const.js";
import { useSolanaClient } from "./client.js";
import { GillUseRpcHook } from "./types.js";

type RpcConfig = Simplify<Parameters<GetSignaturesForAddressApi["getSignaturesForAddress"]>[1]>;

type UseSignaturesForAddressInput<TConfig extends RpcConfig = RpcConfig> = GillUseRpcHook<TConfig> & {
  /**
   * Address of the account to fetch signatures of
   */
  address: Address | string;
};

type UseSignaturesForAddressResponse = ReturnType<GetSignaturesForAddressApi["getSignaturesForAddress"]>;

/**
 * Returns signatures for confirmed transactions that include the given address
 * in their `accountKeys` list. Returns signatures backwards in time from the
 * provided signature or most recent confirmed block using the Solana RPC method of
 * [`getSignaturesForAddress`](https://solana.com/docs/rpc/http/getsignaturesforaddress)
 */
export function useSignaturesForAddress<TConfig extends RpcConfig = RpcConfig>({
  options,
  config,
  abortSignal,
  address,
}: UseSignaturesForAddressInput<TConfig>) {
  const { rpc, urlOrMoniker } = useSolanaClient();
  const { data, ...rest } = useQuery({
    networkMode: "offlineFirst",
    ...options,
    enabled: (options?.enabled ?? true) && !!address,
    queryFn: async () => {
      const signatures = await rpc.getSignaturesForAddress(address as Address, config).send({ abortSignal });
      return signatures;
    },
    queryKey: [GILL_HOOK_CLIENT_KEY, urlOrMoniker, "getSignaturesForAddress", address],
  });
  return {
    ...rest,
    signatures: data as UseSignaturesForAddressResponse,
  };
}
