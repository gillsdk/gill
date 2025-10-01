"use client";

import React from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { GILL_HOOK_CLIENT_KEY } from "./const";
import type { SolanaClient } from "gill";

/**
 * Provider to utilize gill hooks for Solana
 */
export function SolanaProvider({
  client,
  children,
  queryClient = new QueryClient(),
}: {
  client: SolanaClient;
  children: React.ReactNode;
  queryClient?: QueryClient;
}) {
  queryClient.setQueryData([GILL_HOOK_CLIENT_KEY], client);
  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
}

interface SolanaClientContextValue {
  client: SolanaClient;
  setClient: (client: SolanaClient) => void;
}

const SolanaClientContext = React.createContext<SolanaClientContextValue | null>(null);

function SolanaClientProvider({ client, children }: { client: SolanaClient; children: React.ReactNode }) {
  const [currentClient, setCurrentClient] = React.useState<SolanaClient>(client);

  return (
    <SolanaClientContext.Provider value={{ client: currentClient, setClient: setCurrentClient }}>
      {children}
    </SolanaClientContext.Provider>
  );
}

export function useSolanaClientContext() {
  const context = React.useContext(SolanaClientContext);
  if (!context) {
    throw new Error("useSolanaClient must be used within SolanaProvider");
  }
  return context;
}
