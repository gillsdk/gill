"use client";

import { useQuery } from "@tanstack/react-query";
import type {
  AccountInfoBase,
  AccountInfoWithBase64EncodedData,
  AccountInfoWithBase64EncodedZStdCompressedData,
  AccountInfoWithJsonData,
  AccountInfoWithPubkey,
  Address,
  GetProgramAccountsApi,
  Simplify,
  SolanaRpcResponse,
} from "gill";

import { GILL_HOOK_CLIENT_KEY } from "../const.js";
import { useSolanaClient } from "./client.js";
import type { GillUseRpcHook } from "./types.js";

type Encoding = "base64" | "base64+zstd" | "jsonParsed";

type RpcConfig = Simplify<
  Parameters<GetProgramAccountsApi["getProgramAccounts"]>[1] &
    Readonly<{
      encoding?: Encoding;
    }>
>;

type UseProgramAccountsInput<TConfig extends RpcConfig = RpcConfig> = GillUseRpcHook<TConfig> & {
  /**
   * Address of the program used to call
   * [`getProgramAccounts`](https://solana.com/docs/rpc/http/getprogramaccounts)
   */
  program: Address | string;
};

type UseProgramAccountsResponse<TConfig extends RpcConfig> = TConfig extends {
  encoding: "base64";
  withContext: true;
}
  ? SolanaRpcResponse<AccountInfoWithPubkey<AccountInfoBase & AccountInfoWithBase64EncodedData>[]>
  : TConfig extends { encoding: "base64" }
    ? AccountInfoWithPubkey<AccountInfoBase & AccountInfoWithBase64EncodedData>[]
    : TConfig extends { encoding: "base64+zstd"; withContext: true }
      ? SolanaRpcResponse<AccountInfoWithPubkey<AccountInfoBase & AccountInfoWithBase64EncodedZStdCompressedData>[]>
      : TConfig extends { encoding: "base64+zstd" }
        ? AccountInfoWithPubkey<AccountInfoBase & AccountInfoWithBase64EncodedZStdCompressedData>[]
        : TConfig extends { encoding: "jsonParsed"; withContext: true }
          ? SolanaRpcResponse<AccountInfoWithPubkey<AccountInfoBase & AccountInfoWithJsonData>[]>
          : TConfig extends { encoding: "jsonParsed" }
            ? AccountInfoWithPubkey<AccountInfoBase & AccountInfoWithJsonData>[]
            : TConfig extends { withContext: true }
              ? SolanaRpcResponse<AccountInfoWithPubkey<AccountInfoBase & AccountInfoWithBase64EncodedData>[]>
              : AccountInfoWithPubkey<AccountInfoBase & AccountInfoWithBase64EncodedData>[];
/**
 * Get all the accounts owned by a `program` using the Solana RPC method of
 * [`getProgramAccounts`](https://solana.com/docs/rpc/http/getprogramaccounts)
 */
export function useProgramAccounts<TConfig extends RpcConfig = RpcConfig>({
  options,
  config,
  abortSignal,
  program,
}: UseProgramAccountsInput<TConfig>) {
  const { rpc, urlOrMoniker } = useSolanaClient();

  const { data, ...rest } = useQuery({
    ...options,
    enabled: !!program,
    queryFn: async () => {
      const accounts = await rpc.getProgramAccounts(program as Address, config).send({ abortSignal });
      return accounts;
    },
    queryKey: [GILL_HOOK_CLIENT_KEY, urlOrMoniker, "getProgramAccounts", program],
  });

  return {
    ...rest,
    accounts: data as Simplify<UseProgramAccountsResponse<TConfig>>,
  };
}
