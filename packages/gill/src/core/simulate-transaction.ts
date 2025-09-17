import type { CompilableTransactionMessage, Rpc, SimulateTransactionApi, Transaction } from "@solana/kit";
import { getBase64EncodedWireTransaction, partiallySignTransactionMessageWithSigners } from "@solana/kit";
import type { Simplify } from "./../types/index";

export type SimulateTransactionFunction = (
  transaction: Transaction | CompilableTransactionMessage,
  config?: Simplify<Omit<Parameters<SimulateTransactionApi["simulateTransaction"]>[1], "encoding" | "sigVerify">>,
) => Promise<ReturnType<SimulateTransactionApi["simulateTransaction"]>>;

type SimulateTransactionFactoryConfig = {
  rpc: Rpc<SimulateTransactionApi>;
};

export function simulateTransactionFactory({ rpc }: SimulateTransactionFactoryConfig): SimulateTransactionFunction {
  return async function simulateTransaction(transaction, config) {
    if ("messageBytes" in transaction == false) {
      transaction = await partiallySignTransactionMessageWithSigners(transaction);
    }

    return rpc
      .simulateTransaction(getBase64EncodedWireTransaction(transaction), {
        replaceRecentBlockhash: true,
        // innerInstructions: true,
        ...config,
        sigVerify: false,
        encoding: "base64",
      })
      .send();
  };
}
