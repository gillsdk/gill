import type { SolanaClusterMoniker } from "./rpc";

type ExplorerLinkAccount = {
  address: string;
};
type ExplorerLinkTransaction = {
  transaction: string;
};
type ExplorerLinkBlock = {
  block: string;
};

type ExplorerChoice = "default" | "solscan" | "orb" | "solanafm";

export const EXPLORER_CONFIGS: Record<ExplorerChoice, string> = {
  default: "https://explorer.solana.com/",
  solanafm: "https://solana.fm/",
  orb: "https://orb.helius.dev/",
  solscan: "https://solscan.io/",
} as const;

/**
 * @param cluster - Default: `mainnet`
 * @param explorer - Default: `default` (https://explorer.solana.com)
 */
export type GetExplorerLinkArgs = {
  cluster?: SolanaClusterMoniker | "mainnet-beta" | "localhost";
  explorer?: ExplorerChoice;
} & (ExplorerLinkAccount | ExplorerLinkTransaction | ExplorerLinkBlock | {});
