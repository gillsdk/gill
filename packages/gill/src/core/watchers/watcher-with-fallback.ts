export type SubscriptionContext = { slot: bigint };
export type SubscriptionItem<T> = { context: SubscriptionContext; value: T };

export interface CreateWebsocketWatcherOptions<T> {
  abortController: AbortController;
  closedRef: { value: boolean };
  onError?: (onError: unknown) => void;
  onUpdate: (slot: bigint, value: T | null) => void;
  opts: {
    pollIntervalMs: number;
    wsConnectTimeoutMs: number;
  };
  pollFn: (onEmit: (slot: bigint, value: T | null) => void, abortSignal: AbortSignal) => Promise<void>;
  wsSubscribeFn: (abortSignal: AbortSignal) => Promise<AsyncIterable<SubscriptionItem<T>>>;
}

// Helper function to perform a single poll.
const executePoll = async <T>(
  pollFn: (onEmit: (slot: bigint, value: T | null) => void, abortSignal: AbortSignal) => Promise<void>,
  onUpdate: (slot: bigint, value: T | null) => void,
  closedRef: { value: boolean },
  abortSignal: AbortSignal,
  onError?: (e: unknown) => void,
) => {
  if (closedRef.value) {
    return;
  }
  try {
    await pollFn(onUpdate, abortSignal);
  } catch (e) {
    if (!closedRef.value && onError) {
      onError(e);
    }
  }
};

/**
 * This function creates a robust watcher that attempts to use a WebSocket subscription
 * and falls back to HTTP polling if the WebSocket connection is not available or fails.
 *
 * The logic is as follows:
 * 1. Race a WebSocket connection attempt against a timeout.
 * 2. If the WebSocket connects successfully:
 *    - Perform an initial poll to get the current state immediately.
 *    - Listen for updates from the WebSocket stream.
 *    - If the WebSocket stream closes or errors, it automatically transitions to polling mode.
 * 3. If the WebSocket connection fails (due to timeout or other errors):
 *    - Immediately fall back to polling mode.
 */
export const createWebsocketWatcherWithFallback = async <T>(
  args: CreateWebsocketWatcherOptions<T>,
): Promise<NodeJS.Timeout | null> => {
  const { wsSubscribeFn, pollFn, onUpdate, onError, opts, closedRef, abortController } = args;
  const { wsConnectTimeoutMs, pollIntervalMs } = opts;

  let pollTimer: NodeJS.Timeout | null = null;

  const singlePoll = () => executePoll(pollFn, onUpdate, closedRef, abortController.signal, onError);

  const startPolling = async () => {
    await singlePoll();
    if (closedRef.value) return;
    pollTimer = setInterval(() => void singlePoll(), pollIntervalMs);
  };

  // Race WS connect with timeout
  const connectPromise = wsSubscribeFn(abortController.signal);

  const timeoutPromise = new Promise<never>((_, reject) =>
    setTimeout(() => reject(new Error("ws connect timeout")), wsConnectTimeoutMs),
  );

  try {
    const stream = await Promise.race([connectPromise, timeoutPromise]);

    // Initial poll to seed
    await singlePoll();
    if (closedRef.value) return null;

    pollTimer = null;

    console.info("=== Web Socket Subscription Started ===");

    try {
      for await (const {
        context: { slot },
        value,
      } of stream) {
        if (closedRef.value) {
          break;
        }
        onUpdate(slot, value);
      }

      // If loop ends (WS closed), fallback to polling
      if (!closedRef.value) {
        await startPolling();
      }
    } catch (e) {
      if (!closedRef.value) {
        if (onError) onError(e);
        await startPolling();
      }
    }
  } catch (wsError) {
    if (!closedRef.value) {
      console.error(wsError);
      await startPolling();
    }
  }

  return pollTimer;
};
