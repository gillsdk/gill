import {
  AccountInfoBase,
  type AccountInfoWithBase64EncodedData,
  type Address,
  assertAccountExists,
  Commitment,
  MaybeEncodedAccount,
  parseBase64RpcAccount,
} from "@solana/kit";

import { SolanaClient } from "../../types/rpc.js";
import { createUnifiedWatcher, type UnifiedWatcherOptions, type WatcherStrategy } from "./unified-watcher";

type AccountUpdate = {
  /**
   * Slot associated with the update. Monotonic and de-duplicated.
   */
  slot: bigint;
  /**
   * Account info at the given slot, or null if the account does not exist.
   */
  value: MaybeEncodedAccount;
};

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
  onError?: (e: unknown) => void;

  /**
   * Update handler receiving { slot, value }.
   */
  onUpdate: (u: AccountUpdate) => void;

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
type Base64EncodedRpcAccount = AccountInfoBase & AccountInfoWithBase64EncodedData;

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
  const strategy: WatcherStrategy<Base64EncodedRpcAccount, MaybeEncodedAccount> = {
    normalize: (raw) => {
      const parsed = parseBase64RpcAccount(accountAddress, raw);
      return parsed;
    },
    poll: async (onEmit, abortSignal) => {
      const { context, value } = await rpc
        .getAccountInfo(accountAddress, { commitment, encoding: "base64" })
        .send({ abortSignal });
      const parsedAccount = parseBase64RpcAccount(accountAddress, value);
      assertAccountExists(parsedAccount);
      onEmit({ slot: context.slot, value: parsedAccount });
    },
    subscribe: async (abortSignal) => {
      return await rpcSubscriptions
        .accountNotifications(accountAddress, { commitment, encoding: "base64" })
        .subscribe({ abortSignal });
    },
  };

  const opts: UnifiedWatcherOptions<MaybeEncodedAccount> = {
    maxRetries,
    onError,
    onUpdate,
    pollIntervalMs,
    retryDelayMs,
    wsConnectTimeoutMs,
  };

  const { stop } = await createUnifiedWatcher(strategy, opts);

  return stop;
};
