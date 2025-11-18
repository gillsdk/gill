import type { Address, Signature } from "gill";
import type { SolanaClient } from "gill";

/**
 * Transaction status type
 */
type TransactionStatus = "success" | "failed";

/**
 * Result of inspecting a transaction
 */
type InspectTransactionResult = {
  transactionSignature: Signature; // Transaction signature
  slot: bigint; // Slot in which the transaction was confirmed
  status: TransactionStatus; // Transaction success/failure
  computeUnits?: number; // Optional: compute units consumed
  logs: string[]; // Transaction logs
  accountsTouched: Address[]; // All accounts touched by the transaction
};

/**
 * Inspect a Solana transaction by signature.
 *
 * Retrieves transaction metadata, logs, accounts involved, and status.
 *
 * @param rpc - Solana RPC client
 * @param transactionSignature - Transaction signature to inspect
 * @returns InspectTransactionResult or null if transaction not found
 *
 * @example
 * const txInfo = await inspectTransaction(rpc, txSignature);
 * if (txInfo?.status === "failed") { console.error(txInfo.logs); }
 */
export async function inspectTransaction(
  rpc: SolanaClient["rpc"],
  transactionSignature: Signature,
): Promise<InspectTransactionResult | null> {
  const transactionData = await rpc
    .getTransaction(transactionSignature, {
      commitment: "confirmed",
      maxSupportedTransactionVersion: 0,
      encoding: "json",
    })
    .send();

  if (!transactionData) {
    return null;
  }

  const meta = transactionData.meta;
  if (!meta) {
    throw new Error("Transaction metadata not available");
  }

  const status: TransactionStatus = meta.err === null ? "success" : "failed";

  const computeUnits = meta.computeUnitsConsumed ? Number(meta.computeUnitsConsumed) : undefined;

  const logs = meta.logMessages ? [...meta.logMessages] : [];

  const accountsTouched: Address[] = [];
  const transaction = transactionData.transaction;
  if (transaction?.message?.accountKeys) {
    accountsTouched.push(...transaction.message.accountKeys);
  }

  if ("loadedAddresses" in meta && meta.loadedAddresses) {
    if (meta.loadedAddresses.writable) accountsTouched.push(...meta.loadedAddresses.writable);
    if (meta.loadedAddresses.readonly) accountsTouched.push(...meta.loadedAddresses.readonly);
  }

  const uniqueAccountsTouched = [...new Set(accountsTouched)];

  return {
    transactionSignature,
    slot: transactionData.slot,
    status,
    computeUnits,
    logs,
    accountsTouched: uniqueAccountsTouched,
  };
}
