"use client";
import { useQuery } from "@tanstack/react-query";
import type { SimulateTransactionApi, Simplify, Base64EncodedWireTransaction } from "gill";
import { GILL_HOOK_CLIENT_KEY } from "../const";
import { useSolanaClient } from "./client";
import type { GillUseRpcHook } from "./types";
type RpcConfig = Simplify<Parameters<SimulateTransactionApi["simulateTransaction"]>>[1];

const DEFAULT_CONFIG: RpcConfig = {
  replaceRecentBlockhash: true,
  sigVerify: false,
  encoding: "base64",
  commitment: "confirmed",
} as const;

type UseSimulateTransactionInput<TConfig extends RpcConfig = RpcConfig> = Omit<GillUseRpcHook<TConfig>, "config"> & {
  transaction: Base64EncodedWireTransaction;
  /**
   * @default { replaceRecentBlockhash: true, sigVerify: false, encoding: "base64", commitment: "confirmed" }
   */
  config?: TConfig;
};

type UseSimulateTransactionResponse = ReturnType<SimulateTransactionApi["simulateTransaction"]>;

/**
 * Simulate a transaction using the Solana RPC method of
 * [`simulateTransaction`](https://solana.com/docs/rpc/http/simulatetransaction)
 */
export function useSimulateTransaction<TConfig extends RpcConfig = RpcConfig>({
  options,
  config,
  abortSignal,
  transaction,
}: UseSimulateTransactionInput<TConfig>) {
  const { rpc } = useSolanaClient();

  const mergedConfig = { ...DEFAULT_CONFIG, ...config } as RpcConfig;

  const { data, ...rest } = useQuery({
    ...options,
    enabled: !!transaction,
    queryKey: [GILL_HOOK_CLIENT_KEY, "simulateTransaction", transaction, mergedConfig],
    queryFn: async () => {
      const simulation = await rpc.simulateTransaction(transaction, mergedConfig).send({ abortSignal });
      return simulation;
    },
  });

  return {
    ...rest,
    simulation: data as UseSimulateTransactionResponse,
  };
}
