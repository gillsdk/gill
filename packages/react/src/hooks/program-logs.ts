"use client";

import { useQuery } from "@tanstack/react-query";
import type { Address, Commitment, SolanaClient, TransactionError } from "gill";
import { useCallback, useEffect, useRef, useState } from "react";
import { useSolanaClient } from "./client.js";

// Re-export types from core
export type LogFilter = "all" | "error" | "success";

export type ProgramLog = {
  signature: string;
  err: TransactionError | null;
  logs: string[];
  slot: number;
};

type WatchProgramLogsOptions = {
  filter?: LogFilter;
  commitment?: Commitment;
  maxItems?: number;
  onLog?: (log: ProgramLog) => void;
  onError?: (error: Error) => void;
};

type ProgramLogsSubscription = {
  unsubscribe: () => Promise<void>;
  isActive: () => boolean;
};

async function watchProgramLogs(
  client: SolanaClient,
  programId: Address | string,
  options: WatchProgramLogsOptions = {},
): Promise<ProgramLogsSubscription> {
  const { filter = "all", commitment = "confirmed", onLog, onError } = options;

  let isActive = true;
  let unsubscribePromise: Promise<void> | null = null;

  try {
    // SolanaRpcSubscriptionsApi includes logsSubscribe
    const subscription = await (client.rpcSubscriptions as any).logsSubscribe(
      { mentions: [programId] },
      { commitment },
    );

    // Process incoming notifications
    (async () => {
      try {
        for await (const notification of subscription.notifications) {
          if (!isActive) break;

          const log = notification.value;
          if (!log) continue;

          // Apply filter
          const shouldEmit =
            filter === "all" ||
            (filter === "success" && !log.err) ||
            (filter === "error" && !!log.err);

          if (shouldEmit && onLog) {
            onLog(log as ProgramLog);
          }
        }
      } catch (error) {
        if (onError && isActive) {
          onError(error instanceof Error ? error : new Error(String(error)));
        }
      }
    })();

    return {
      unsubscribe: async () => {
        if (!unsubscribePromise) {
          isActive = false;
          unsubscribePromise = (async () => {
            try {
              await subscription.subscribeResponseIter.return?.();
            } catch (err) {
              console.warn("Failed to unsubscribe from program logs:", err);
            }
          })();
        }
        return unsubscribePromise;
      },
      isActive: () => isActive,
    };
  } catch (error) {
    isActive = false;
    const err = error instanceof Error ? error : new Error("Failed to subscribe to program logs");
    if (onError) {
      onError(err);
    }
    throw err;
  }
}

export type UseWatchProgramLogsOptions = {
  filter?: LogFilter;
  commitment?: Commitment;
  maxItems?: number;
  /**
   * Enable or disable the subscription
   * @default true
   */
  enabled?: boolean;
};

export type UseWatchProgramLogsReturn = {
  logs: ProgramLog[];
  error: Error | null;
  isConnected: boolean;
  clear: () => void;
};

/**
 * React hook to watch program logs using React Query for caching and deduplication.
 * Multiple components watching the same program will share a single WebSocket subscription.
 */
export function useWatchProgramLogs(
  programId: Address | string | undefined,
  options: UseWatchProgramLogsOptions = {},
): UseWatchProgramLogsReturn {
  const { filter = "all", commitment = "confirmed", maxItems = 1000, enabled = true } = options;
  const client = useSolanaClient();

  const [logs, setLogs] = useState<ProgramLog[]>([]);
  const [error, setError] = useState<Error | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const subscriptionRef = useRef<ProgramLogsSubscription | null>(null);

  const queryKey = ["programLogs", programId, commitment, filter];

  const clear = useCallback(() => {
    setLogs([]);
    setError(null);
  }, []);

  // Use React Query to deduplicate subscriptions across components
  const { data: _sharedState } = useQuery({
    queryKey,
    enabled: enabled && !!programId,
    staleTime: Infinity,
    gcTime: 0, // Don't cache after unmount
    queryFn: async () => ({ isActive: true }),
  });

  useEffect(() => {
    if (!programId || !enabled) {
      setIsConnected(false);
      return;
    }

    let mounted = true;

    (async () => {
      try {
        const subscription = await watchProgramLogs(client, programId, {
          filter,
          commitment,
          onLog: (log: ProgramLog) => {
            if (!mounted) return;
            setLogs((prev) => {
              const next = prev.length >= maxItems ? prev.slice(-(maxItems - 1)) : prev;
              return [...next, log];
            });
          },
          onError: (err: Error) => {
            if (!mounted) return;
            setError(err);
            setIsConnected(false);
          },
        });

        if (mounted) {
          subscriptionRef.current = subscription;
          setIsConnected(true);
          setError(null);
        } else {
          // Component unmounted before subscription established
          await subscription.unsubscribe();
        }
      } catch (err) {
        if (mounted) {
          setError(err instanceof Error ? err : new Error("Failed to subscribe to program logs"));
          setIsConnected(false);
        }
      }
    })();

    return () => {
      mounted = false;
      if (subscriptionRef.current) {
        const sub = subscriptionRef.current;
        subscriptionRef.current = null;
        // Fire-and-forget cleanup
        sub.unsubscribe().catch((err: unknown) => {
          console.warn("Error during program logs unsubscribe:", err);
        });
      }
      setIsConnected(false);
    };
  }, [programId, commitment, filter, maxItems, enabled, client]);

  return { logs, error, clear, isConnected };
}
