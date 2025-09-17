"use client";

import { useQuery } from "@tanstack/react-query";
import type { GetSignatureStatusesApi, Signature, Simplify } from "gill";

import { GILL_HOOK_CLIENT_KEY } from "../const.js";
import { useSolanaClient } from "./client.js";
import type { GillUseRpcHook } from "./types.js";

type RpcConfig = Simplify<Parameters<GetSignatureStatusesApi["getSignatureStatuses"]>[1]>;

type UseSignatureStatusesInput<TConfig extends RpcConfig = RpcConfig> = GillUseRpcHook<TConfig> & {
  /**
   * List of signatures used to call
   * [`getSignatureStatuses`](https://solana.com/docs/rpc/http/getsignaturestatuses)
   */
  signatures: Signature[] | string[];
};

type UseSignatureStatusesResponse = ReturnType<GetSignatureStatusesApi["getSignatureStatuses"]>["value"];

/**
 * Get the statuses of signatures using the Solana RPC method of
 * [`getSignatureStatuses`](https://solana.com/docs/rpc/http/getsignaturestatuses)
 */
export function useSignatureStatuses<TConfig extends RpcConfig = RpcConfig>({
  options,
  config,
  abortSignal,
  signatures,
}: UseSignatureStatusesInput<TConfig>) {
  const { rpc, urlOrMoniker } = useSolanaClient();
  const { data, ...rest } = useQuery({
    ...options,
    enabled: signatures && signatures.length > 0,
    queryFn: async () => {
      const { value } = await rpc.getSignatureStatuses(signatures as Signature[], config).send({ abortSignal });
      return value;
    },
    queryKey: [GILL_HOOK_CLIENT_KEY, urlOrMoniker, "getSignatureStatuses", signatures],
  });
  return {
    ...rest,
    statuses: data as UseSignatureStatusesResponse,
  };
}
