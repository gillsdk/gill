import type { DevnetUrl, MainnetUrl, TestnetUrl } from "@solana/kit";

import type { LocalnetUrl, ModifiedClusterUrl, SolanaClusterMoniker } from "../types/rpc";

export function localnet(putativeString: string): LocalnetUrl {
  return putativeString as LocalnetUrl;
}

/**
 * Get a public Solana RPC endpoint for a cluster based on its moniker
 *
 * Note: These RPC URLs are rate limited and not suitable for production applications.
 */
export function getPublicSolanaRpcUrl(
  cluster: SolanaClusterMoniker | "localhost" | "mainnet-beta",
): ModifiedClusterUrl {
  switch (cluster) {
    case "devnet":
      return "https://api.devnet.solana.com" as DevnetUrl;
    case "testnet":
      return "https://api.testnet.solana.com" as TestnetUrl;
    case "mainnet-beta":
    case "mainnet":
      return "https://api.mainnet-beta.solana.com" as MainnetUrl;
    case "localnet":
    case "localhost":
      return "http://127.0.0.1:8899" as LocalnetUrl;
    default:
      throw new Error("Invalid cluster moniker");
  }
}
