import { Base64EncodedWireTransaction, SimulateTransactionApi } from "gill";

import { useSimulateTransaction } from "../hooks/simulate-transaction.js";

// [DESCRIBE] useSimulateTransaction
{
  {
    const { simulation } = useSimulateTransaction({
      config: { commitment: "confirmed", encoding: "base64" },
      transaction: "123" as Base64EncodedWireTransaction,
    });
    simulation satisfies ReturnType<SimulateTransactionApi["simulateTransaction"]>;
  }

  {
    const { simulation } = useSimulateTransaction({
      config: { commitment: "confirmed", encoding: "base64" },
      options: {
        refetchInterval: 1000,
      },
      transaction: "123" as Base64EncodedWireTransaction,
    });
    simulation satisfies ReturnType<SimulateTransactionApi["simulateTransaction"]>;
  }

  {
    const { simulation } = useSimulateTransaction({
      abortSignal: new AbortController().signal,
      config: { commitment: "confirmed", encoding: "base64" },
      transaction: "123" as Base64EncodedWireTransaction,
    });
    simulation satisfies ReturnType<SimulateTransactionApi["simulateTransaction"]>;
  }
}
