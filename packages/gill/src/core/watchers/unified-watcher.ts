export type Slot = bigint;

export type SubscriptionContext = { slot: Slot };

export type SubscriptionItem<T> = { context: SubscriptionContext; value: T };

export type UnifiedWatcherOptions<TNormalized> = {
  /**
   * External AbortController to manage lifecycle.
   * If omitted, a new controller is created internally.
   */
  abortController?: AbortController;

  /**
   * Maximum number of consecutive WS connection attempts before falling back to polling.
   */
  maxRetries?: number;

  /**
   * Optional error handler for non-fatal errors:
   * - WS connection failures and retries
   * - Polling failures
   * - Stream processing errors
   */
  onError?: (e: unknown) => void;

  /**
   * Handler invoked for each accepted update (after slot de-duplication).
   */
  onUpdate: (u: { slot: Slot; value: TNormalized }) => void;

  /**
   * Polling interval (ms) used when in polling mode.
   * If omitted or <= 0, periodic polling is disabled (single poll may still run).
   */
  pollIntervalMs?: number;

  /**
   * Delay (ms) between WS connection attempts.
   */
  retryDelayMs?: number;

  /**
   * Maximum time (ms) to wait for WS connection before considering it failed
   * and proceeding with retry or fallback to polling.
   */
  wsConnectTimeoutMs: number;
};

export type WatcherStrategy<TRaw, TNormalized> = {
  /**
   * Converts a raw WS payload into the normalized value type consumed by onUpdate.
   */
  normalize: (raw: TRaw | null) => TNormalized;

  /**
   * Performs a single poll and emits at most one update via onEmit.
   * - slot is optional; if omitted, the watcher will synthesize one.
   * - value should be normalized or null.
   * Implementations should throw on fatal errors to allow retry/handling upstream.
   */
  poll?: (onEmit: (update: { slot?: Slot; value: TNormalized }) => void, abortSignal: AbortSignal) => Promise<void>;

  /**
   * Starts a WS subscription and returns an async iterable of updates.
   * Each item can be either:
   * - SubscriptionItem<TRaw> (preferred): includes context.slot.
   * - TRaw: raw payload without context; slot will be synthesized by the watcher.
   */
  subscribe: (abortSignal: AbortSignal) => Promise<AsyncIterable<SubscriptionItem<TRaw> | TRaw>>;
};

const attemptSubscription = async <TRaw>(
  subscribeFn: () => Promise<AsyncIterable<SubscriptionItem<TRaw> | TRaw>>,
  timeoutMs: number,
  abortSignal: AbortSignal,
): Promise<AsyncIterable<SubscriptionItem<TRaw> | TRaw>> => {
  if (abortSignal.aborted) {
    throw new Error("Aborted");
  }
  const connectPromise = subscribeFn();
  const timeoutPromise = new Promise<never>((_, reject) =>
    setTimeout(() => reject(new Error(`ws connect timeout (${timeoutMs}ms)`)), timeoutMs),
  );
  return await Promise.race([connectPromise, timeoutPromise]);
};

const executePoll = async <TNormalized>(
  poll: (onEmit: (update: { slot?: Slot; value: TNormalized }) => void, abortSignal: AbortSignal) => Promise<void>,
  onUpdate: (slot: Slot, value: TNormalized) => void,
  getLastSlot: () => Slot,
  closedRef: { value: boolean },
  abortSignal: AbortSignal,
  onError?: (e: unknown) => void,
) => {
  if (closedRef.value) {
    return;
  }

  try {
    const onEmitFromPoll = ({ slot, value }: { slot?: Slot; value: TNormalized }) => {
      const newSlot = slot ?? getLastSlot() + 1n;
      onUpdate(newSlot, value);
    };

    await poll(onEmitFromPoll, abortSignal);
  } catch (e) {
    if (!closedRef.value && onError) {
      onError(e);
    }
  }
};

export const createUnifiedWatcher = async <TRaw, TNormalized>(
  strategy: WatcherStrategy<TRaw, TNormalized>,
  opts: UnifiedWatcherOptions<TNormalized>,
): Promise<{ stop: () => void }> => {
  const {
    pollIntervalMs,
    wsConnectTimeoutMs,
    onUpdate,
    onError,
    abortController = new AbortController(),
    maxRetries = 3,
    retryDelayMs = 2000, // Default to a 2-second fixed retry delay
  } = opts;

  const closedRef = { value: false };

  let pollTimer: ReturnType<typeof setInterval> | null = null;

  let lastSlot: Slot = -1n;

  const hasPoll = typeof strategy.poll === "function";

  const stop = () => {
    if (closedRef.value) return;
    closedRef.value = true;
    if (pollTimer) clearInterval(pollTimer);
    abortController.abort();
  };

  const emitIfNewer = (slot: Slot, value: TNormalized) => {
    if (slot <= lastSlot) {
      return;
    }
    lastSlot = slot;
    onUpdate({ slot, value });
  };

  const singlePoll = () => {
    if (!strategy.poll) {
      return Promise.resolve();
    }
    return executePoll(strategy.poll, emitIfNewer, () => lastSlot, closedRef, abortController.signal, onError);
  };

  const startPollingFallback = async () => {
    if (closedRef.value || !hasPoll) return;
    await singlePoll();
    if (closedRef.value) return;
    if (pollIntervalMs && pollIntervalMs > 0) {
      pollTimer = setInterval(() => void singlePoll(), pollIntervalMs);
    }
  };

  // Main loop: attempts WS connection with retry; falls back to polling after max retries.
  const run = async () => {
    let connectAttempt = 0;

    while (!closedRef.value) {
      try {
        const stream = await attemptSubscription(
          () => strategy.subscribe(abortController.signal),
          wsConnectTimeoutMs,
          abortController.signal,
        );

        connectAttempt = 0; // Reset on successful connection.

        // Seed state via a poll (if available) before consuming the stream.
        if (hasPoll) {
          await singlePoll();
        }

        if (closedRef.value) {
          return;
        }

        for await (const item of stream) {
          if (closedRef.value) {
            break;
          }

          let slot: Slot;
          let value: TRaw;

          if (
            typeof item === "object" &&
            item !== null &&
            "context" in item &&
            typeof item.context === "object" &&
            item.context !== null &&
            "slot" in item.context
          ) {
            const subItem = item;
            slot = subItem.context.slot;
            value = subItem.value;
          } else {
            // No context provided by the stream; synthesize a monotonic slot.
            lastSlot = lastSlot + 1n;
            slot = lastSlot;
            value = item as TRaw;
          }

          emitIfNewer(slot, strategy.normalize(value));
        }

        if (closedRef.value) return;
        // If the stream ends naturally, loop to attempt reconnection again.
      } catch (e) {
        if (closedRef.value) return;

        onError?.(e);

        connectAttempt++;
        if (connectAttempt >= maxRetries) {
          onError?.(new Error(`Failed to connect to WebSocket after ${maxRetries} attempts.`));
          await startPollingFallback();
          return; // Exit loop and remain in polling mode.
        }

        // Fixed-delay retry (could be replaced with exponential backoff).
        await new Promise<void>((resolve) => setTimeout(resolve, retryDelayMs));
      }
    }
  };

  // Start the watcher loop.
  await run();

  return { stop };
};
