/**

 */

export type Slot = bigint;

export type SubscriptionContext = { slot: Slot };
export type SubscriptionItem<T> = { context: SubscriptionContext; value: T };

export type UnifiedUpdate<T> = {
  slot: Slot;
  value: T | null;
};

export type UnifiedWatcherOptions<TNormalized> = {
  /**
   * Optional external AbortController. If not provided, a new one is created.
   */
  abortController?: AbortController;

  /**
   * Optional error handler for non-fatal errors.
   */
  onError?: (e: unknown) => void;

  /**
   * Callback invoked on each new update (monotonic by slot).
   */
  onUpdate: (u: UnifiedUpdate<TNormalized>) => void;

  /**
   * Interval for polling mode in milliseconds.
   */
  pollIntervalMs: number;

  /**
   * Timeout for WebSocket connection attempt in milliseconds.
   */
  wsConnectTimeoutMs: number;
};

export type WatcherStrategy<TRaw, TNormalized> = {
  /**
   * Converts raw WS payload into the normalized value type.
   */
  normalize: (raw: TRaw | null) => TNormalized | null;

  /**
   * Performs a single poll of the current state and emits exactly once.
   */
  poll: (onEmit: (slot: Slot, value: TNormalized | null) => void, abortSignal: AbortSignal) => Promise<void>;

  /**
   * Creates a WebSocket subscription and returns an async iterable of updates.
   */
  subscribe: (abortSignal: AbortSignal) => Promise<AsyncIterable<SubscriptionItem<TRaw>>>;
};

// Helper function to perform a single poll.
const executePoll = async <TNormalized>(
  poll: (onEmit: (slot: Slot, value: TNormalized | null) => void, abortSignal: AbortSignal) => Promise<void>,
  onUpdate: (slot: Slot, value: TNormalized | null) => void,
  closedRef: { value: boolean },
  abortSignal: AbortSignal,
  onError?: (e: unknown) => void,
) => {
  if (closedRef.value) return;
  try {
    await poll(onUpdate, abortSignal);
  } catch (e) {
    if (!closedRef.value && onError) onError(e);
  }
};

/**
 * A unified watcher abstraction that prefers WebSocket subscriptions for
 * real-time updates and automatically falls back to HTTP polling if WS is
 * unavailable or fails.
 *
 * Flow:
 * 1. Race WS connect against a timeout.
 * 2. If WS connects:
 *    - Perform an initial poll to seed current state.
 *    - Stream updates from WS.
 *    - If WS ends or errors, fallback to polling.
 * 3. If WS connect fails (timeout/error):
 *    - Start polling immediately.
 *
 * @param strategy - Resource-specific poll/subscribe/normalize implementation.
 * @param opts - Timing and callbacks configuration.
 * @returns An object with a `stop()` function to terminate the watcher.
 */
export const createUnifiedWatcher = async <TRaw, TNormalized>(
  strategy: WatcherStrategy<TRaw, TNormalized>,
  opts: UnifiedWatcherOptions<TNormalized>,
) => {
  const { pollIntervalMs, wsConnectTimeoutMs, onUpdate, onError, abortController = new AbortController() } = opts;

  const closedRef = { value: false };
  let pollTimer: NodeJS.Timeout | null = null;
  let lastSlot: Slot = -1n;

  const emitIfNewer = (slot: Slot, value: TNormalized | null) => {
    if (slot <= lastSlot) return;
    lastSlot = slot;
    onUpdate({ slot, value });
  };

  const singlePoll = () => executePoll(strategy.poll, emitIfNewer, closedRef, abortController.signal, onError);

  const startPolling = async () => {
    await singlePoll();
    if (closedRef.value) return;
    pollTimer = setInterval(() => void singlePoll(), pollIntervalMs);
  };

  // Race WebSocket connect against a timeout.
  const connectPromise = strategy.subscribe(abortController.signal);
  const timeoutPromise = new Promise<never>((_, reject) =>
    setTimeout(() => reject(new Error("ws connect timeout")), wsConnectTimeoutMs),
  );

  /**
   * Stops the watcher, cancels timers and aborts in-flight operations.
   */
  const stop = () => {
    if (closedRef.value) return;
    closedRef.value = true;
    if (pollTimer) clearInterval(pollTimer);
    abortController.abort();
  };

  try {
    const stream = await Promise.race([connectPromise, timeoutPromise]);

    // Initial poll to seed current state.
    await singlePoll();

    if (closedRef.value) {
      return { stop };
    }

    try {
      for await (const {
        context: { slot },
        value,
      } of stream) {
        if (closedRef.value) break;
        emitIfNewer(slot, strategy.normalize(value));
      }

      // If the WS stream ends naturally, fallback to polling.
      if (!closedRef.value) {
        await startPolling();
      }
    } catch (e) {
      // On WS error, report and fallback to polling.
      if (!closedRef.value) {
        onError?.(e);
        await startPolling();
      }
    }
  } catch (e) {
    // On WS connect timeout/failure, start polling immediately.
    if (!closedRef.value) {
      onError?.(e);
      await startPolling();
    }
  }

  return { stop };
};
