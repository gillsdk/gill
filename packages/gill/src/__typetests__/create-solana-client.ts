import type {
  RequestAirdropApi,
  Rpc,
  RpcDevnet,
  RpcMainnet,
  RpcTestnet,
  SolanaRpcApi,
  SolanaRpcApiMainnet,
} from "@solana/kit";
import { sendAndConfirmDurableNonceTransactionFactory, sendAndConfirmTransactionFactory } from "@solana/kit";

import { createSolanaClient } from "../core";

// [DESCRIBE] createSolanaClient
{
  // Mainnet cluster typechecks when the providing the moniker
  {
    const {
      rpc: mainnetRpc,
      rpcSubscriptions: mainnetRpcSubscriptions,
      simulateTransaction,
    } = createSolanaClient({
      cluster: "mainnet",
      urlOrMoniker: "mainnet",
    });
    mainnetRpc satisfies Rpc<SolanaRpcApiMainnet>;
    mainnetRpc satisfies RpcMainnet<SolanaRpcApiMainnet>;
    //@ts-expect-error Should not have `requestAirdrop` method
    mainnetRpc satisfies Rpc<RequestAirdropApi>;
    //@ts-expect-error Should not be a devnet RPC
    mainnetRpc satisfies RpcDevnet<SolanaRpcApi>;
    //@ts-expect-error Should not be a testnet RPC
    mainnetRpc satisfies RpcTestnet<SolanaRpcApi>;

    // should have access to `simulateTransaction`
    simulateTransaction;

    sendAndConfirmTransactionFactory({
      rpc: mainnetRpc,
      rpcSubscriptions: mainnetRpcSubscriptions,
    });
    sendAndConfirmDurableNonceTransactionFactory({
      rpc: mainnetRpc,
      rpcSubscriptions: mainnetRpcSubscriptions,
    });
  }

  // Devnet cluster typechecks when the providing the moniker
  {
    const {
      rpc: devnetRpc,
      rpcSubscriptions: devnetRpcSubscriptions,
      simulateTransaction,
    } = createSolanaClient({
      cluster: "devnet",
      urlOrMoniker: "devnet",
    });
    devnetRpc satisfies Rpc<SolanaRpcApi>;
    devnetRpc satisfies Rpc<RequestAirdropApi>;
    devnetRpc satisfies RpcDevnet<SolanaRpcApi>;
    //@ts-expect-error Should not be a testnet RPC
    devnetRpc satisfies RpcTestnet<SolanaRpcApi>;
    //@ts-expect-error Should not be a mainnet RPC
    devnetRpc satisfies RpcMainnet<SolanaRpcApiMainnet>;

    // should have access to `simulateTransaction`
    simulateTransaction;

    sendAndConfirmTransactionFactory({
      rpc: devnetRpc,
      rpcSubscriptions: devnetRpcSubscriptions,
    });
    sendAndConfirmDurableNonceTransactionFactory({
      rpc: devnetRpc,
      rpcSubscriptions: devnetRpcSubscriptions,
    });
  }

  // Testnet cluster typechecks when the providing the moniker
  {
    const {
      rpc: testnetRpc,
      rpcSubscriptions: testnetRpcSubscriptions,
      simulateTransaction,
    } = createSolanaClient({
      cluster: "testnet",
      urlOrMoniker: "testnet",
    });
    testnetRpc satisfies Rpc<SolanaRpcApi>;
    testnetRpc satisfies Rpc<RequestAirdropApi>;
    testnetRpc satisfies RpcTestnet<SolanaRpcApi>;
    //@ts-expect-error Should not be a devnet RPC
    testnetRpc satisfies RpcDevnet<SolanaRpcApi>;
    //@ts-expect-error Should not be a mainnet RPC
    testnetRpc satisfies RpcMainnet<SolanaRpcApiMainnet>;

    // should have access to `simulateTransaction`
    simulateTransaction;

    sendAndConfirmTransactionFactory({
      rpc: testnetRpc,
      rpcSubscriptions: testnetRpcSubscriptions,
    });
    sendAndConfirmDurableNonceTransactionFactory({
      rpc: testnetRpc,
      rpcSubscriptions: testnetRpcSubscriptions,
    });
  }

  // Localnet cluster typechecks when the providing the moniker
  {
    const {
      rpc: localnetRpc,
      rpcSubscriptions: localnetRpcSubscriptions,
      simulateTransaction,
    } = createSolanaClient({
      cluster: "localnet",
      urlOrMoniker: "localnet",
    });
    localnetRpc satisfies Rpc<SolanaRpcApi>;
    localnetRpc satisfies Rpc<RequestAirdropApi>;
    //@ts-expect-error Should not be a testnet RPC
    localnetRpc satisfies RpcTestnet<SolanaRpcApi>;
    //@ts-expect-error Should not be a devnet RPC
    localnetRpc satisfies RpcDevnet<SolanaRpcApi>;
    //@ts-expect-error Should not be a mainnet RPC
    localnetRpc satisfies RpcMainnet<SolanaRpcApiMainnet>;

    // should have access to `simulateTransaction`
    simulateTransaction;

    sendAndConfirmTransactionFactory({
      rpc: localnetRpc,
      // @ts-ignore - kit does not yet support `localnet` as a cluster
      rpcSubscriptions: localnetRpcSubscriptions,
    });
    sendAndConfirmDurableNonceTransactionFactory({
      rpc: localnetRpc,
      // @ts-ignore - kit does not yet support `localnet` as a cluster
      rpcSubscriptions: localnetRpcSubscriptions,
    });
  }

  // Localnet cluster typechecks when the providing the moniker
  {
    const {
      rpc: genericRpc,
      rpcSubscriptions: genericRpcSubscriptions,
      simulateTransaction,
    } = createSolanaClient({
      cluster: "mainnet",
      urlOrMoniker: "https://example-rpc.com",
    });
    genericRpc satisfies Rpc<SolanaRpcApi>;
    genericRpc satisfies Rpc<RequestAirdropApi>;
    //@ts-expect-error Should not be a testnet RPC
    genericRpc satisfies RpcTestnet<SolanaRpcApi>;
    //@ts-expect-error Should not be a devnet RPC
    genericRpc satisfies RpcDevnet<SolanaRpcApi>;
    //@ts-expect-error Should not be a mainnet RPC
    genericRpc satisfies RpcMainnet<SolanaRpcApiMainnet>;

    // should have access to `simulateTransaction`
    simulateTransaction;

    sendAndConfirmTransactionFactory({
      rpc: genericRpc,
      rpcSubscriptions: genericRpcSubscriptions,
    });
    sendAndConfirmDurableNonceTransactionFactory({
      rpc: genericRpc,
      rpcSubscriptions: genericRpcSubscriptions,
    });
  }
}
