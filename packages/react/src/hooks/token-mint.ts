"use client";

import { useQuery } from "@tanstack/react-query";
import type { Account, Address, FetchAccountConfig, Simplify } from "gill";
import { assertAccountExists, fetchEncodedAccount } from "gill";
import { decodeMint, type Mint } from "gill/programs";

import { GILL_HOOK_CLIENT_KEY } from "../const.js";
import { useSolanaClient } from "./client.js";
import type { GillUseRpcHook } from "./types.js";

type RpcConfig = Simplify<Omit<FetchAccountConfig, "abortSignal">>;

type UseTokenMintResponse<TAddress extends string = string> = Simplify<
  Account<Mint, TAddress> & {
    exists: true;
  }
>;

type UseTokenMintInput<
  TConfig extends RpcConfig = RpcConfig,
  TAddress extends string = string,
> = GillUseRpcHook<TConfig> & {
  /**
   * Address of the Mint account to get and decode
   */
  mint: Address<TAddress> | TAddress;
};

/**
 * Get and parse a token's {@link https://solana.com/docs/tokens#mint-account | Mint account}
 */
export function useTokenMint<TConfig extends RpcConfig = RpcConfig, TAddress extends string = string>({
  options,
  config,
  abortSignal,
  mint,
}: UseTokenMintInput<TConfig, TAddress>) {
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
    enabled: !!mint,
    queryFn: async () => {
      const account = await fetchEncodedAccount(rpc, mint as Address<TAddress>, config);
      assertAccountExists(account);
      return decodeMint(account);
    },
    queryKey: [GILL_HOOK_CLIENT_KEY, urlOrMoniker, "getMintAccount", mint],
  });
  return {
    ...rest,
    account: data as UseTokenMintResponse<TAddress>,
  };
}
