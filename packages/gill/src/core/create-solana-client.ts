import type { DevnetUrl, MainnetUrl, TestnetUrl } from "@solana/kit";
import { createSolanaRpc, createSolanaRpcSubscriptions } from "@solana/kit";

import type { CreateSolanaClientArgs, LocalnetUrl, ModifiedClusterUrl, SolanaClient } from "../types/rpc";
import { getPublicSolanaRpcUrl } from "./rpc";
import { sendAndConfirmTransactionWithSignersFactory } from "./send-and-confirm-transaction-with-signers";
import { simulateTransactionFactory } from "./simulate-transaction";

/**
 * Create a Solana `rpc` and `rpcSubscriptions` client
 */
export function createSolanaClient(
  props: Omit<CreateSolanaClientArgs<MainnetUrl | "mainnet">, "urlOrMoniker"> & {
    cluster: "mainnet";
    urlOrMoniker: "mainnet";
  },
): SolanaClient<MainnetUrl>;
export function createSolanaClient(
  props: Omit<CreateSolanaClientArgs<DevnetUrl | "devnet">, "urlOrMoniker"> & {
    cluster: "devnet";
    urlOrMoniker: "devnet";
  },
): SolanaClient<DevnetUrl>;
export function createSolanaClient(
  props: Omit<CreateSolanaClientArgs<TestnetUrl | "testnet">, "urlOrMoniker"> & {
    cluster: "testnet";
    urlOrMoniker: "testnet";
  },
): SolanaClient<TestnetUrl>;
export function createSolanaClient(
  props: Omit<CreateSolanaClientArgs<LocalnetUrl | "localnet">, "urlOrMoniker"> & {
    cluster: "localnet";
    urlOrMoniker: "localnet";
  },
): SolanaClient<LocalnetUrl>;
export function createSolanaClient<TClusterUrl extends ModifiedClusterUrl>(
  props: CreateSolanaClientArgs<TClusterUrl>,
): SolanaClient<TClusterUrl>;
export function createSolanaClient<TCluster extends ModifiedClusterUrl>({
  urlOrMoniker,
  rpcConfig,
  rpcSubscriptionsConfig,
  cluster,
}: CreateSolanaClientArgs<TCluster>) {
  if (!urlOrMoniker) throw new Error("Cluster url or moniker is required");
  if (urlOrMoniker instanceof URL == false) {
    try {
      urlOrMoniker = new URL(urlOrMoniker.toString());
    } catch (err) {
      try {
        urlOrMoniker = new URL(getPublicSolanaRpcUrl(urlOrMoniker.toString() as any));
      } catch (err) {
        throw new Error("Invalid URL or cluster moniker");
      }
    }
  }

  if (!urlOrMoniker.protocol.match(/^https?/i)) {
    throw new Error("Unsupported protocol. Only HTTP and HTTPS are supported");
  }

  if (rpcConfig?.port) {
    urlOrMoniker.port = rpcConfig.port.toString();
  }

  const rpc = createSolanaRpc<TCluster>(urlOrMoniker.toString() as TCluster, rpcConfig);

  urlOrMoniker.protocol = urlOrMoniker.protocol.replace("http", "ws");

  if (rpcSubscriptionsConfig?.port) {
    urlOrMoniker.port = rpcSubscriptionsConfig.port.toString();
  } else if (urlOrMoniker.hostname == "localhost" || urlOrMoniker.hostname.startsWith("127")) {
    urlOrMoniker.port = "8900";
  }

  const rpcSubscriptions = createSolanaRpcSubscriptions<TCluster>(
    urlOrMoniker.toString() as TCluster,
    rpcSubscriptionsConfig,
  );

  return {
    cluster: `solana:${cluster}`,
    rpc,
    rpcSubscriptions,
    sendAndConfirmTransaction: sendAndConfirmTransactionWithSignersFactory({
      // @ts-ignore - TODO(FIXME:nick)
      rpc,
      // @ts-ignore - TODO(FIXME:nick)
      rpcSubscriptions,
    }),
    // @ts-ignore
    simulateTransaction: simulateTransactionFactory({ rpc }),
    urlOrMoniker: urlOrMoniker.toString() as TCluster,
  };
}
