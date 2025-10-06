import { type Address, Commitment } from "@solana/kit";

import type { SolanaClient } from "../../types/rpc";
import { createUnifiedWatcher, type UnifiedWatcherOptions, type WatcherStrategy } from "./unified-watcher";

type AccountInfoShape = {
  // Data shape depends on encoding; keep generic.
  data: unknown;
  executable: boolean;
  lamports: bigint;
  owner: Address;
  rentEpoch: bigint;
};

type AccountUpdate = {
  slot: bigint;
  value: AccountInfoShape | null;
};

type OnUpdate = (u: AccountUpdate) => void;
type OnError = (e: unknown) => void;

type WatchAccountArgs = {
  accountAddress: Address;
  commitment?: Commitment;
  onError?: OnError;
  onUpdate: OnUpdate;
  pollIntervalMs?: number;
  rpc: SolanaClient["rpc"];
  wsConnectTimeoutMs?: number;
  wsSubscription: SolanaClient["rpcSubscriptions"];
};

/**
 * Watches a Solana account for changes.
 *
 * This function builds on the unified watcher and provides a resource-specific
 * strategy for accounts. It tries WS subscription first and falls back to HTTP
 * polling when needed.
 *
 * Consumer responsibilities:
 * - Implement any retry/backoff for persistent errors using `onError` and by
 *   calling the returned `stop` function as appropriate.
 *
 * @param args - Arguments to configure the account watcher.
 * @returns A function to stop the watcher.
 */
export const watchAccount = async ({
  rpc,
  wsSubscription,
  commitment = "confirmed",
  pollIntervalMs = 5000,
  wsConnectTimeoutMs = 8000,
  accountAddress,
  onUpdate,
  onError,
}: WatchAccountArgs) => {
  const strategy: WatcherStrategy<AccountInfoShape, AccountInfoShape> = {
    normalize: (raw) => raw ?? null,
    poll: async (onEmit, abortSignal) => {
      const { context, value } = await rpc.getAccountInfo(accountAddress, { commitment }).send({ abortSignal });
      onEmit(context.slot, value ?? null);
    },
    subscribe: async (abortSignal) => {
      return await wsSubscription.accountNotifications(accountAddress, { commitment }).subscribe({ abortSignal });
    },
  };

  const opts: UnifiedWatcherOptions<AccountInfoShape> = {
    onError,
    onUpdate,
    pollIntervalMs,
    wsConnectTimeoutMs,
  };

  const { stop } = await createUnifiedWatcher(strategy, opts);
  return stop;
};
