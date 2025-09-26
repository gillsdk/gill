import { type Address, Commitment, createSolanaRpc, createSolanaRpcSubscriptions } from "@solana/kit";

type AccountInfoShape = {
  //   TODO: look into if this can be specified
  // data shape depends on encoding not sure yet how this can be typed; we type it as unknown to stay generic
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
  // optional; if missing, we start in polling mode
  accountAddress: Address;
  commitment?: Commitment;
  dataEncoding?: "base58" | "base64" | "base64+zstd" | "jsonParsed";
  // default 8000
  // background heartbeat poll even when WS is up
  heartbeatPollMs?: number;
  // polling only
  pollIntervalMs?: number;
  rpcUrl: string; // default 5000
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

  let pollTimer: NodeJS.Timeout | null = null;
  let heartbeatTimer: NodeJS.Timeout | null = null;

  const clearTimers = () => {
    if (pollTimer) {
      clearInterval(pollTimer);
      pollTimer = null;
    }
    if (heartbeatTimer) {
      clearInterval(heartbeatTimer);
      heartbeatTimer = null;
    }
  };

  //   TODO: investigate how to type the `value`
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const emitIfNewer = (slot: bigint, value: any) => {
    if (slot <= lastSlot) return false;
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

  const doPollOnce = async () => {
    try {
      const { context, value } = await rpc.getAccountInfo(accountAddress, { commitment, encoding: "base58" }).send({
        abortSignal: abortController.signal,
      });
      emitIfNewer(context.slot, value);
    } catch (e) {
      if (!closed && onError) onError(e);
    }
  };

  const startPolling = async () => {
    // Initial poll immediately
    await doPollOnce();
    // Interval
    pollTimer = setInterval(() => {
      void doPollOnce();
    }, pollIntervalMs);
  };

  const startHeartbeat = () => {
    if (heartbeatPollMs <= 0) return;
    heartbeatTimer = setInterval(() => {
      void doPollOnce();
    }, heartbeatPollMs);
  };

  const startWebSocket = async () => {
    if (!wsSubscription) throw new Error("WebSocket URL not provided");

    // race connect with timeout, either connection established or timeout and fail the websocket
    const connect = wsSubscription
      .accountNotifications(accountAddress, { commitment, encoding: "base58" })
      .subscribe({ abortSignal: abortController.signal });

    const timeout = new Promise<never>((_, rej) =>
      setTimeout(() => rej(new Error("ws connect timeout")), wsConnectTimeoutMs),
    );

    const stream = await Promise.race([connect, timeout]);

    // initial fetch to seed state and slot
    await doPollOnce();

    // heartbeat poll to guard against silent stalls
    startHeartbeat();

    console.info("=== Web Socket Subscription Started ===");

    // consume stream
    try {
      for await (const {
        context: { slot },
        value,
      } of stream) {
        emitIfNewer(slot, value);
      }
      // if loop ends, WS closed; switch to polling
      if (!closed) {
        clearTimers();
        await startPolling();
      }
    } catch (e) {
      if (!closed && onError) onError(e);
      if (!closed) {
        clearTimers();
        await startPolling();
      }
    }
  };

  // Start: prefer WS if available; otherwise polling
  if (wsSubscription) {
    try {
      console.log("initiating watch account using web socket");
      await startWebSocket();
    } catch (wsError) {
      console.log("websocket failed to connect, changed to polling");
      console.error(wsError);
      await startPolling();
    }
  } else {
    await startPolling();
  }

  // return unified stopper
  const stop = () => {
    if (closed) return;
    closed = true;
    clearTimers();
    abortController.abort();
    console.log("=== Watch Account Stopped ===");
  };

  return stop;
};
