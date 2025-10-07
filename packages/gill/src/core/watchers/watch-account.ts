import { type Address, Commitment } from "@solana/kit";

import { SolanaClient } from "../../types/rpc.js";
import { createUnifiedWatcher, type UnifiedWatcherOptions, type WatcherStrategy } from "./unified-watcher";

type AccountInfoShape = {
  /**
   * Raw account data; its structure depends on the RPC encoding used.
   * Kept as unknown to remain generic.
   */
  data: unknown;
  /**
   * Whether the account is executable (program account).
   */
  executable: boolean;
  /**
   * Balance of the account in lamports.
   */
  lamports: bigint;
  /**
   * Owner program address of the account.
   */
  owner: Address;
  /**
   * Rent epoch for the account.
   */
  rentEpoch: bigint;
};

type AccountUpdate = {
  /**
   * Slot associated with the update. Monotonic and de-duplicated.
   */
  slot: bigint;
  /**
   * Account info at the given slot, or null if the account does not exist.
   */
  value: AccountInfoShape | null;
};

type OnUpdate = (u: AccountUpdate) => void;
/**
 * Invoked on each accepted update with the normalized account payload.
 */

type OnError = (e: unknown) => void;
/**
 * Notified on recoverable errors (WS connect failures, polling errors, etc.).
 * Use to log, metric, or decide whether to stop/retry at a higher level.
 */

type WatchAccountArgs = {
  /**
   * Target account address to watch.
   */
  accountAddress: Address;

  /**
   * Commitment level used for both RPC and WS subscription.
   * Defaults to 'confirmed'.
   */
  commitment?: Commitment;

  /**
   * Maximum number of WS connection retries before falling back to polling.
   * Defaults to 3.
   */
  maxRetries?: number;

  /**
   * Optional error callback for non-fatal failures.
   */
  onError?: OnError;

  /**
   * Update handler receiving { slot, value }.
   */
  onUpdate: OnUpdate;

  /**
   * Poll interval (ms) when in polling mode. Defaults to 5000.
   */
  pollIntervalMs?: number;

  /**
   * Delay (ms) between WS connection retries. Defaults to 2000.
   */
  retryDelayMs?: number;

  /**
   * RPC client for HTTP requests.
   */
  rpc: SolanaClient["rpc"];

  /**
   * RPC subscriptions (WS) client used to subscribe to account notifications.
   */
  rpcSubscriptions: SolanaClient["rpcSubscriptions"];

  /**
   * Timeout (ms) for initial WS connection attempts. Defaults to 8000.
   */
  wsConnectTimeoutMs?: number;
};

/**
 * Watches a Solana account for changes.
 *
 * This function builds on the unified watcher and provides a resource-specific
 * strategy for accounts. It tries WS subscription first and falls back to HTTP
 * polling when needed.
 *
 * @param args - Arguments to configure the account watcher.
 * @returns A function to stop the watcher.
 */
export const watchAccount = async ({
  rpc,
  rpcSubscriptions,
  commitment = "confirmed",
  pollIntervalMs = 5000,
  wsConnectTimeoutMs = 8000,
  accountAddress,
  onUpdate,
  onError,
  maxRetries,
  retryDelayMs,
}: WatchAccountArgs) => {
  const strategy: WatcherStrategy<AccountInfoShape, AccountInfoShape> = {
    normalize: (raw) => raw ?? null,
    poll: async (onEmit, abortSignal) => {
      const { context, value } = await rpc.getAccountInfo(accountAddress, { commitment }).send({ abortSignal });
      onEmit({ slot: context.slot, value: value ?? null });
    },
    subscribe: async (abortSignal) => {
      return await rpcSubscriptions.accountNotifications(accountAddress, { commitment }).subscribe({ abortSignal });
    },
  };

  const opts: UnifiedWatcherOptions<AccountInfoShape> = {
    maxRetries,
    onError,
    onUpdate: (slot, value) => onUpdate({ slot, value }),
    pollIntervalMs,
    retryDelayMs,
    wsConnectTimeoutMs,
  };

  const { stop } = await createUnifiedWatcher(strategy, opts);

  return stop;
};
