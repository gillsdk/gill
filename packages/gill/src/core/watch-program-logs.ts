import type { Address, Commitment, TransactionError } from "@solana/kit";
import type { SolanaClient } from "../types/rpc.js";

export type LogFilter = "all" | "error" | "success";

export type ProgramLog = {
  signature: string;
  err: TransactionError | null;
  logs: string[];
  slot: number;
};

export type WatchProgramLogsOptions = {
  filter?: LogFilter;
  commitment?: Commitment;
  maxItems?: number;
  onLog?: (log: ProgramLog) => void;
  onError?: (error: Error) => void;
};

export type ProgramLogsSubscription = {
  unsubscribe: () => Promise<void>;
  isActive: () => boolean;
};

/**
 * Watch program logs from Solana RPC subscriptions
 * Platform-agnostic implementation (works in Node, browser, React)
 */
export async function watchProgramLogs(
  client: SolanaClient,
  programId: Address | string,
  options: WatchProgramLogsOptions = {},
): Promise<ProgramLogsSubscription> {
  const { filter = "all", commitment = "confirmed", onLog, onError } = options;

  let isActive = true;
  let unsubscribePromise: Promise<void> | null = null;

  try {
    // SolanaRpcSubscriptionsApi includes logsSubscribe
    // Type assertion here is acceptable since we know the API structure
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

    // Return subscription controller
    return {
      unsubscribe: async () => {
        if (!unsubscribePromise) {
          isActive = false;
          unsubscribePromise = (async () => {
            try {
              await subscription.subscribeResponseIter.return?.();
            } catch (err) {
              // Log but don't throw - cleanup should be fire-and-forget
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

