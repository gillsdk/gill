import type { CompilableTransactionMessage, Rpc, SimulateTransactionApi, Transaction } from "@solana/kit";
import { getBase64EncodedWireTransaction, partiallySignTransactionMessageWithSigners } from "@solana/kit";

import type { Simplify } from "./../types/index";

export type SimulateTransactionFunction = (
  transaction: CompilableTransactionMessage | Transaction,
  config?: Simplify<Omit<Parameters<SimulateTransactionApi["simulateTransaction"]>[1], "encoding" | "sigVerify">>,
) => Promise<ReturnType<SimulateTransactionApi["simulateTransaction"]>>;

type SimulateTransactionFactoryConfig<TCluster> = {
  rpc: Rpc<SimulateTransactionApi> & {
    "~cluster"?: TCluster;
  };
};

export function simulateTransactionFactory({
  rpc,
}: SimulateTransactionFactoryConfig<"devnet">): SimulateTransactionFunction;
export function simulateTransactionFactory({
  rpc,
}: SimulateTransactionFactoryConfig<"testnet">): SimulateTransactionFunction;
export function simulateTransactionFactory({
  rpc,
}: SimulateTransactionFactoryConfig<"mainnet">): SimulateTransactionFunction;
export function simulateTransactionFactory({
  rpc,
}: SimulateTransactionFactoryConfig<"localnet">): SimulateTransactionFunction;
export function simulateTransactionFactory<
  TCluster extends "devnet" | "localnet" | "mainnet" | "testnet" | void = void,
>({ rpc }: SimulateTransactionFactoryConfig<TCluster>): SimulateTransactionFunction {
  return async function simulateTransaction(transaction, config) {
    if ("messageBytes" in transaction == false) {
      transaction = await partiallySignTransactionMessageWithSigners(transaction);
    }

    return await rpc
      .simulateTransaction(getBase64EncodedWireTransaction(transaction), {
        replaceRecentBlockhash: true,
        // innerInstructions: true,
        ...config,
        encoding: "base64",
        sigVerify: false,
      })
      .send();
  };
}
