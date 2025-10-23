import { isSolanaChain } from "@solana/wallet-standard-chains";
import { useWallets as useWalletsBase } from "@wallet-standard/react";

import { useWallet } from "./wallet.js";

export interface UseWalletsSolanaOptions {
  walletAllowList?: string[];
}

export function walletAllowed(walletName: string, walletAllowList: string[] = []) {
  return walletAllowList.length ? walletAllowList.includes(walletName) : true;
}

export function useWallets({ walletAllowList }: UseWalletsSolanaOptions = {}) {
  const { walletAllowList: contextWalletAllowList } = useWallet();
  const wallets = useWalletsBase();

  return wallets.filter((wallet) => {
    return walletAllowed(wallet.name, walletAllowList ?? contextWalletAllowList) && wallet.chains.some(isSolanaChain);
  });
}
