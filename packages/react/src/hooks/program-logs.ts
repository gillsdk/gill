"use client";

import type { Address, Commitment } from "gill";
import { useCallback, useEffect, useRef, useState } from "react";
import { useSolanaClient } from "./client.js";

type LogFilter = "all" | "error" | "success";

export type ProgramLog = {
  signature: string;
  err: unknown | null;
  logs: string[];
  slot: number;
};

export function useWatchProgramLogs(
  programId: Address | string | undefined,
  opts: { filter?: LogFilter; commitment?: Commitment; maxItems?: number } = {},
) {
  const { filter = "all", commitment = "confirmed", maxItems = 1000 } = opts;
  const { rpcSubscriptions } = useSolanaClient();

  const [logs, setLogs] = useState<ProgramLog[]>([]);
  const [error, setError] = useState<Error | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const unsubscribeRef = useRef<null | (() => void)>(null);

  const clear = useCallback(() => {
    setLogs([]);
    setError(null);
  }, []);

  useEffect(() => {
    if (!programId) return;

    // Cleanup any prior subscription before creating a new one
    if (unsubscribeRef.current) {
      try {
        unsubscribeRef.current();
      } catch {
        // ignore
      }
      unsubscribeRef.current = null;
    }

    setIsConnected(false);

    try {
      // Use Solana logs subscription with a program mention filter
      // @solana/kit provides logsSubscribe.
      const sub = (rpcSubscriptions as any).logsSubscribe(
        { filter: { mentions: [programId] }, commitment },
        (notification: { value: ProgramLog }) => {
          const v = notification?.value;
          if (!v) return;
          if (filter === "all" || (filter === "success" && !v.err) || (filter === "error" && !!v.err)) {
            setLogs((prev) => {
              const next = prev.length >= maxItems ? prev.slice(-maxItems + 1) : prev;
              return [...next, v];
            });
          }
        },
        (e: unknown) => setError(e instanceof Error ? e : new Error(String(e))),
      );

      unsubscribeRef.current = () => {
        try {
          sub?.unsubscribe?.();
        } catch {
          // ignore
        }
      };
      setIsConnected(true);
    } catch (e) {
      setError(e instanceof Error ? e : new Error("Failed to subscribe to program logs"));
      setIsConnected(false);
    }

    return () => {
      if (unsubscribeRef.current) {
        try {
          unsubscribeRef.current();
        } catch {
          // ignore
        }
        unsubscribeRef.current = null;
      }
      setIsConnected(false);
    };
  }, [programId, commitment, filter, maxItems, rpcSubscriptions]);

  return { logs, error, clear, isConnected } as const;
}
