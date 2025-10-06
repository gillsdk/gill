import { type Address, Commitment } from "@solana/kit";

import type { SolanaClient } from "../../types/rpc";
import { createWebsocketWatcherWithFallback } from "./watcher-with-fallback";

type AccountInfoShape = {
  // data shape depends on encoding;  typing as unknown to stay generic
  data: unknown;
  executable: boolean;
  lamports: bigint;
  owner: Address;
  rentEpoch: bigint;
};

type AccountUpdate = {
  slot: bigint;
  value: AccountInfoShape | null; // null if account doesn't exist
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
 * This function uses a watching strategy that attempts to use a WebSocket
 * subscription for real-time updates and automatically falls back to HTTP
 * polling if the WebSocket is unavailable or fails.
 *
 * The consumer of this function is responsible for implementing any retry or
 * backoff logic for persistent errors by using the `onError` callback and
 * calling the returned `stop` function when appropriate.
 *
 * Note: This watcher requires a WebSocket client (`wsSubscription`) and does
 * not support a polling-only mode.
 *
 * @param args - The arguments for watching the account.
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
  const abortController = new AbortController();
  let closed = false;
  let lastSlot: bigint = -1n;

  const emitIfNewer = (slot: bigint, value: AccountInfoShape | null) => {
    if (slot <= lastSlot) {
      return false;
    }

    lastSlot = slot;

    onUpdate({
      slot,
      value:
        value == null
          ? null
          : {
              data: value.data,
              executable: value.executable,
              lamports: value.lamports,
              owner: value.owner,
              rentEpoch: value.rentEpoch,
            },
    });

    return true;
  };

  const pollFn = async (onEmit: (slot: bigint, value: AccountInfoShape | null) => void, abortSignal: AbortSignal) => {
    const { context, value } = await rpc.getAccountInfo(accountAddress, { commitment }).send({
      abortSignal,
    });
    onEmit(context.slot, value);
  };

  const wsSubscribeFn = async (abortSignal: AbortSignal) => {
    return await wsSubscription.accountNotifications(accountAddress, { commitment }).subscribe({ abortSignal });
  };

  await createWebsocketWatcherWithFallback({
    abortController,
    closedRef: { value: closed },
    onError,
    onUpdate: emitIfNewer,
    opts: { pollIntervalMs, wsConnectTimeoutMs },
    pollFn,
    wsSubscribeFn,
  });

  const stop = () => {
    if (closed) {
      return;
    }
    closed = true;
    abortController.abort();
  };

  return stop;
};
