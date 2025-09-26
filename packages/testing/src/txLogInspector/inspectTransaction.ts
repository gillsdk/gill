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
  signature: string; // Transaction signature
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
 * @param signature - Transaction signature to inspect
 * @returns InspectTransactionResult or null if transaction not found
 *
 * @example
 * const txInfo = await inspectTransaction(rpc, txSignature);
 * if (txInfo?.status === "failed") { console.error(txInfo.logs); }
 */
export default async function inspectTransaction(
  rpc: SolanaClient["rpc"],
  signature: Signature,
): Promise<InspectTransactionResult | null> {
  try {
    // Fetch transaction details with confirmed commitment
    const transactionData = await rpc
      .getTransaction(signature, {
        commitment: "confirmed",
        maxSupportedTransactionVersion: 0,
        encoding: "json",
      })
      .send();

    if (!transactionData) {
      return null; // Transaction not found
    }

    const meta = transactionData.meta;
    if (!meta) {
      throw new Error("Transaction metadata not available");
    }

    // Determine success/failure
    const status: TransactionStatus = meta.err === null ? "success" : "failed";

    // Optional: compute units consumed
    const computeUnits = meta.computeUnitsConsumed ? Number(meta.computeUnitsConsumed) : undefined;

    // Extract logs
    const logs = meta.logMessages ? [...meta.logMessages] : [];

    // Collect all accounts involved in the transaction
    const accountsTouched: Address[] = [];
    const transaction = transactionData.transaction;
    if (transaction?.message?.accountKeys) {
      accountsTouched.push(...transaction.message.accountKeys);
    }

    // Include loaded addresses (writable + readonly) if present
    if ("loadedAddresses" in meta && meta.loadedAddresses) {
      if (meta.loadedAddresses.writable) accountsTouched.push(...meta.loadedAddresses.writable);
      if (meta.loadedAddresses.readonly) accountsTouched.push(...meta.loadedAddresses.readonly);
    }

    // Deduplicate accounts
    const uniqueAccountsTouched = [...new Set(accountsTouched)];

    return {
      signature,
      slot: transactionData.slot,
      status,
      computeUnits,
      logs,
      accountsTouched: uniqueAccountsTouched,
    };
  } catch (error: unknown) {
    if (error instanceof Error) {
      throw new Error(`Failed to inspect transaction: ${error.message}`);
    }
    throw new Error("Failed to inspect transaction: Unknown error");
  }
}
