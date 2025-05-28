import type { Address } from "@solana/kit";

/**
 * Parameters for creating a Solana Pay transfer request
 */
export interface TransferRequestParams {
  recipient: Address;
  amount?: number; // Decimal amount (e.g., 0.001 for 0.001 SOL)
  splToken?: Address;
  reference?: Address[];
  label?: string;
  message?: string;
  memo?: string;
}

/**
 * Parameters for creating a Solana Pay transaction request
 */
export interface TransactionRequestParams {
  link: string;
}

/**
 * Parsed Solana Pay URL data
 */
export type SolanaPayData =
  | { type: "transfer"; params: TransferRequestParams }
  | { type: "transaction"; params: TransactionRequestParams };

/**
 * Options for URL creation
 */
export interface URLOptions {
  encode?: boolean;
}

/**
 * Base error for Solana Pay operations
 */
export class SolanaPayError extends Error {
  constructor(message: string, public code: string) {
    super(message);
    this.name = "SolanaPayError";
  }
}