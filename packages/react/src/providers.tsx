"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { SolanaClient } from "gill";
import React from "react";
import { GILL_HOOK_CLIENT_KEY } from "./const.js";
import { WalletContextProvider } from "./hooks/wallet.js";

/**
 * Provider to utilize gill hooks for Solana
 */
export function SolanaProvider({
  client,
  children,
  queryClient = new QueryClient(),
  autoConnect,
  walletAllowList,
}: {
  client: SolanaClient;
  children: React.ReactNode;
  queryClient?: QueryClient;
  autoConnect?: boolean;
  walletAllowList?: string[];
}) {
  queryClient.setQueryData([GILL_HOOK_CLIENT_KEY], client);

  return (
    <QueryClientProvider client={queryClient}>
      <WalletContextProvider autoConnect={autoConnect} walletAllowList={walletAllowList}>
        {children}
      </WalletContextProvider>
    </QueryClientProvider>
  );
}
