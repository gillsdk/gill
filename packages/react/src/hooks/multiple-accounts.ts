"use client";

import { useQuery } from "@tanstack/react-query";
import type { Account, Address, Decoder, FetchAccountsConfig, Simplify } from "gill";
import { assertAccountsExist, decodeAccount, fetchEncodedAccounts } from "gill";

import { GILL_HOOK_CLIENT_KEY } from "../const.js";
import { useSolanaClient } from "./client.js";
import type { GillUseRpcHook } from "./types.js";

type RpcConfig = Simplify<Omit<FetchAccountsConfig, "abortSignal">>;

type UseMultipleAccountsInput<
  TConfig extends RpcConfig = RpcConfig,
  TAddress extends string = string,
  TDecodedData extends object = Uint8Array,
> = GillUseRpcHook<TConfig> & {
  /**
   * List of addresses to fetch accounts for.
   */
  addresses: Address<TAddress>[];
  /**
   * Optional decoder to decode the account's `data` buffer.
   */
  decoder?: Decoder<TDecodedData>;
};

type UseMultipleAccountsResponse<TAddress extends string = string, TDecodedData extends object = Uint8Array> = {
  accounts: Account<TDecodedData, TAddress>[];
};

/**
 * Fetch multiple accounts using the Solana RPC method of
 * [`getMultipleAccounts`](https://solana.com/docs/rpc/http/getmultipleaccounts)
 *
 * Optionally provide a {@link Decoder | `decoder`} to automatically decode all Accounts using it.
 */
export function useMultipleAccounts<
  TConfig extends RpcConfig = RpcConfig,
  TAddress extends string = string,
  TDecodedData extends object = Uint8Array,
>({ addresses, decoder, config, options, abortSignal }: UseMultipleAccountsInput<TConfig, TAddress, TDecodedData>) {
  const { rpc, urlOrMoniker } = useSolanaClient();

  if (abortSignal) {
    // @ts-expect-error we stripped the `abortSignal` from the type but are now adding it back in
    config = {
      ...(config || {}),
      abortSignal,
    };
  }

  const { data, ...rest } = useQuery({
    networkMode: "offlineFirst",
    ...options,
    enabled: (options?.enabled ?? true) && addresses.length > 0,
    queryFn: async () => {
      const maybeAccounts = await fetchEncodedAccounts(rpc, addresses, config);
      assertAccountsExist(maybeAccounts);
      return maybeAccounts.map((acc) => (decoder ? decodeAccount(acc, decoder) : acc));
    },
    queryKey: [GILL_HOOK_CLIENT_KEY, urlOrMoniker, "getMultipleAccounts", addresses, config?.commitment],
  });

  return {
    ...rest,
    accounts: data,
  } as UseMultipleAccountsResponse<TAddress, TDecodedData>;
}
