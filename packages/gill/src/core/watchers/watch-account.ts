import { type Address, Commitment, createSolanaRpc, createSolanaRpcSubscriptions } from "@solana/kit";

import { createWebsocketWatcherWithFallback } from "./watcher-with-fallback";

type AccountInfoShape = {
  //   TODO: look into if this can be specified
  // data shape depends on encoding not sure yet how this can be type;  typing as unknown to stay generic
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

type WatchOptions = {
  accountAddress: Address;
  commitment?: Commitment;
  dataEncoding?: "base58" | "base64" | "base64+zstd" | "jsonParsed";
  // default 8000
  // background heartbeat poll even when WS is up
  heartbeatPollMs?: number;
  // polling only
  pollIntervalMs?: number;
  rpcUrl: string;
  // default 5000
  // ws connection timeout before falling back to pollling
  wsConnectTimeoutMs?: number;
  wsUrl?: string; // default 30000
};

type OnUpdate = (u: AccountUpdate) => void;
type OnError = (e: unknown) => void;

export const watchAccount = async (opts: WatchOptions, onUpdate: OnUpdate, onError?: OnError) => {
  const {
    rpcUrl,
    wsUrl,
    commitment = "confirmed",
    pollIntervalMs = 5000,
    wsConnectTimeoutMs = 8000,
    heartbeatPollMs = 30000,
    accountAddress,
  } = opts;

  const rpc = createSolanaRpc(rpcUrl);
  const wsSubscription = wsUrl ? createSolanaRpcSubscriptions(wsUrl) : null;

  const abortController = new AbortController();
  let closed = false;
  let lastSlot: bigint = -1n;

  //   TODO: investigate how to type the `value`
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const emitIfNewer = (slot: bigint, value: any) => {
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

  const pollFn = async (onEmit: (slot: bigint, value: unknown) => void, abortSignal: AbortSignal) => {
    const { context, value } = await rpc.getAccountInfo(accountAddress, { commitment, encoding: "base58" }).send({
      abortSignal,
    });
    onEmit(context.slot, value);
  };

  if (wsSubscription) {
    console.log("Initiating watch account using WebSocket");
    await createWebsocketWatcherWithFallback({
      abortController,
      closedRef: { value: closed },
      onError,
      onUpdate: emitIfNewer,
      opts: { heartbeatPollMs, pollIntervalMs, wsConnectTimeoutMs },
      pollFn,
      wsSubscribeFn: (abortSignal) =>
        wsSubscription
          .accountNotifications(accountAddress, { commitment, encoding: "base58" })
          .subscribe({ abortSignal }),
    });
  } else {
    console.log("WebSocket not available, starting polling");
    // Manual polling when no WS
    const startPolling = async () => {
      await pollFn(emitIfNewer, abortController.signal);

      const pollOnce = async () => {
        if (closed) {
          return;
        }
        try {
          await pollFn(emitIfNewer, abortController.signal);
        } catch (e) {
          if (!closed && onError) {
            onError(e);
          }
        }
      };

      const pollTimer = setInterval(() => void pollOnce(), pollIntervalMs);
      return pollTimer;
    };
    await startPolling();
  }

  // return unified stopper
  const stop = () => {
    if (closed) {
      return;
    }
    closed = true;
    abortController.abort();
    console.log("=== Watch Account Stopped ===");
  };

  return stop;
};
