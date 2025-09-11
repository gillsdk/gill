import React from "react";
import "@testing-library/jest-dom";
import { renderHook } from "@testing-library/react";
import { createSolanaClient } from "gill";
import { SolanaProvider } from "../providers.js";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useSolanaClient } from "../hooks/client.js";

describe("useSolanaClient", () => {
  test("returns solana client from provider", () => {
    const client = createSolanaClient({ urlOrMoniker: "mainnet" });

    const { result } = renderHook(() => useSolanaClient(), {
      wrapper: ({ children }) => <SolanaProvider client={client}>{children}</SolanaProvider>,
    });

    expect(result.current).toBe(client);
    expect(result.current.rpc).toBeDefined();
  });

  test("returns fallback devnet client when no provider", () => {
    const queryClient = new QueryClient();

    const { result } = renderHook(() => useSolanaClient(), {
      wrapper: ({ children }) => <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>,
    });

    expect(result.current).toBeDefined();
    expect(result.current.rpc).toBeDefined();
  });
});
