/* eslint-disable @typescript-eslint/ban-ts-comment */
import {
  GetEpochInfoApi,
  GetLatestBlockhashApi,
  GetSignatureStatusesApi,
  Rpc,
  RpcDevnet,
  RpcMainnet,
  RpcSubscriptions,
  RpcSubscriptionsDevnet,
  RpcSubscriptionsMainnet,
  RpcSubscriptionsTestnet,
  RpcTestnet,
  SendTransactionApi,
  SignatureNotificationsApi,
  SimulateTransactionApi,
  SlotNotificationsApi,
} from "@solana/kit";
import { 
  sendAndConfirmTransactionWithSignersFactory,
  type SendAndConfirmTransactionPrepareConfig 
} from "../core/send-and-confirm-transaction-with-signers";

const rpc = null as unknown as Rpc<GetEpochInfoApi & GetLatestBlockhashApi & GetSignatureStatusesApi & SendTransactionApi & SimulateTransactionApi>;
const rpcDevnet = null as unknown as RpcDevnet<GetEpochInfoApi & GetLatestBlockhashApi & GetSignatureStatusesApi & SendTransactionApi & SimulateTransactionApi>;
const rpcTestnet = null as unknown as RpcTestnet<GetEpochInfoApi & GetLatestBlockhashApi & GetSignatureStatusesApi & SendTransactionApi & SimulateTransactionApi>;
const rpcMainnet = null as unknown as RpcMainnet<GetEpochInfoApi & GetLatestBlockhashApi & GetSignatureStatusesApi & SendTransactionApi & SimulateTransactionApi>;

const rpcSubscriptions = null as unknown as RpcSubscriptions<SignatureNotificationsApi & SlotNotificationsApi>;
const rpcSubscriptionsDevnet = null as unknown as RpcSubscriptionsDevnet<
  SignatureNotificationsApi & SlotNotificationsApi
>;
const rpcSubscriptionsMainnet = null as unknown as RpcSubscriptionsMainnet<
  SignatureNotificationsApi & SlotNotificationsApi
>;
const rpcSubscriptionsTestnet = null as unknown as RpcSubscriptionsTestnet<
  SignatureNotificationsApi & SlotNotificationsApi
>;

// [DESCRIBE] sendAndConfirmTransactionWithSignersFactory
{
  {
    // It typechecks when the RPC clusters match.
    sendAndConfirmTransactionWithSignersFactory({ rpc, rpcSubscriptions });
    sendAndConfirmTransactionWithSignersFactory({ rpc: rpcDevnet, rpcSubscriptions: rpcSubscriptionsDevnet });
    sendAndConfirmTransactionWithSignersFactory({ rpc: rpcTestnet, rpcSubscriptions: rpcSubscriptionsTestnet });
    sendAndConfirmTransactionWithSignersFactory({ rpc: rpcMainnet, rpcSubscriptions: rpcSubscriptionsMainnet });
  }
  {
    // It typechecks when either RPC is generic.
    sendAndConfirmTransactionWithSignersFactory({ rpc, rpcSubscriptions });
    sendAndConfirmTransactionWithSignersFactory({ rpc: rpcDevnet, rpcSubscriptions });
    sendAndConfirmTransactionWithSignersFactory({ rpc: rpcTestnet, rpcSubscriptions });
    sendAndConfirmTransactionWithSignersFactory({ rpc: rpcMainnet, rpcSubscriptions });
  }
  {
    // It fails to typecheck when explicit RPC clusters mismatch.
    // @ts-expect-error
    sendAndConfirmTransactionWithSignersFactory({ rpc: rpcDevnet, rpcSubscriptions: rpcSubscriptionsTestnet });
    // @ts-expect-error
    sendAndConfirmTransactionWithSignersFactory({ rpc: rpcDevnet, rpcSubscriptions: rpcSubscriptionsMainnet });
    // @ts-expect-error
    sendAndConfirmTransactionWithSignersFactory({ rpc: rpcTestnet, rpcSubscriptions: rpcSubscriptionsMainnet });
    // @ts-expect-error
    sendAndConfirmTransactionWithSignersFactory({ rpc: rpcTestnet, rpcSubscriptions: rpcSubscriptionsDevnet });
    // @ts-expect-error
    sendAndConfirmTransactionWithSignersFactory({ rpc: rpcMainnet, rpcSubscriptions: rpcSubscriptionsDevnet });
    // @ts-expect-error
    sendAndConfirmTransactionWithSignersFactory({ rpc: rpcMainnet, rpcSubscriptions: rpcSubscriptionsTestnet });
  }
}

// [DESCRIBE] SendAndConfirmTransactionConfig type tests
{
  const sendAndConfirmTxn = sendAndConfirmTransactionWithSignersFactory({ rpc, rpcSubscriptions });
  const mockTransaction = null as any;

  // Should allow no config
  sendAndConfirmTxn(mockTransaction);

  // Should allow config with only commitment
  sendAndConfirmTxn(mockTransaction, {
    commitment: "confirmed",
  });

  // Should allow config with prepareTransactionConfig
  sendAndConfirmTxn(mockTransaction, {
    commitment: "finalized",
    prepareTransactionConfig: {
      computeUnitLimitMultiplier: 1.5,
      allowComputeUnitLimitReset: false,
      forceBlockhashReset: true,
    },
  });

  // Should allow partial prepareTransactionConfig
  sendAndConfirmTxn(mockTransaction, {
    commitment: "confirmed",
    prepareTransactionConfig: {
      computeUnitLimitMultiplier: 1.2,
    },
  });

  // Should allow other sendAndConfirm options
  sendAndConfirmTxn(mockTransaction, {
    commitment: "processed",
    skipPreflight: true,
    maxRetries: 5n,
    prepareTransactionConfig: {
      forceBlockhashReset: false,
    },
  });
}

// [DESCRIBE] SendAndConfirmTransactionPrepareConfig standalone type
{
  // Should accept full config
  ({} as SendAndConfirmTransactionPrepareConfig) satisfies {
    computeUnitLimitMultiplier?: number;
    allowComputeUnitLimitReset?: boolean;
    forceBlockhashReset?: boolean;
  };

  // Should accept partial config
  ({
    computeUnitLimitMultiplier: 1.3,
  } satisfies SendAndConfirmTransactionPrepareConfig);

  // Should accept empty config
  ({} satisfies SendAndConfirmTransactionPrepareConfig);
}
