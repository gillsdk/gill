import type { GetTransactionApi, Rpc, Signature } from "@solana/kit";

/**
 * Gets a confirmed transaction from the blockchain with parsed JSON encoding
 * @param rpc - The RPC client with GetTransactionApi
 * @param signature - The transaction signature to fetch
 * @returns The transaction details or null if not found
 */
export const getConfirmedTransaction = async (rpc: Rpc<GetTransactionApi>, signature: Signature) => {
  return await rpc
    .getTransaction(signature, {
      commitment: "confirmed",
      encoding: "jsonParsed",
      maxSupportedTransactionVersion: 0,
    })
    .send();
};

/**
 * Type for a confirmed transaction fetched from the blockchain
 */
export type ConfirmedTransaction = NonNullable<Awaited<ReturnType<typeof getConfirmedTransaction>>>;
