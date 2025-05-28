import type { Address } from "@solana/kit";

// Note: We don't re-export types from @solana/pay due to module system compatibility issues
// Users can import them directly from @solana/pay if needed

/**
 * Solana Pay URL scheme types and interfaces
 * Based on the Solana Pay specification: https://docs.solanapay.com/
 * 
 * This module extends the official @solana/pay package with gill-specific functionality
 */

/**
 * Base interface for Solana Pay URLs
 */
export interface SolanaPayURL {
  /** The protocol scheme, always 'solana' */
  protocol: "solana";
  /** The URL link for transaction or transfer requests */
  link: string;
}

/**
 * Transfer request parameters compatible with gill's Address type
 * Extends the official Solana Pay transfer request with gill-specific types
 */
export interface GillTransferRequestParams {
  /** The recipient's wallet address */
  recipient: Address;
  /** The amount to transfer (in lamports for SOL, or token units for SPL) */
  amount?: bigint;
  /** The SPL token mint address (omit for SOL transfers) */
  splToken?: Address;
  /** Reference keys for transaction tracking */
  reference?: Address[];
  /** A human-readable description of the payment */
  label?: string;
  /** A human-readable message describing the payment */
  message?: string;
  /** An optional memo to include in the transaction */
  memo?: string;
}

/**
 * Transaction request parameters compatible with gill
 */
export interface GillTransactionRequestParams {
  /** The HTTPS URL endpoint for the transaction request */
  link: string;
}

/**
 * GET request response for transaction requests
 * Returned by the merchant's server on GET requests
 */
export interface TransactionRequestGetResponse {
  /** A human-readable description of the source of the transaction request */
  label: string;
  /** An icon image URL (SVG, PNG, or WebP) */
  icon: string;
}

/**
 * POST request body for transaction requests
 * Sent by the wallet to the merchant's server
 */
export interface TransactionRequestPostRequest {
  /** The user's wallet address */
  account: string;
}

/**
 * POST request response for transaction requests
 * Returned by the merchant's server with the transaction to sign
 */
export interface TransactionRequestPostResponse {
  /** Base64-encoded serialized transaction */
  transaction: string;
  /** Optional message describing the transaction */
  message?: string;
}

/**
 * Parsed Solana Pay URL data with gill types
 */
export type GillSolanaPayData = 
  | { type: "transfer"; params: GillTransferRequestParams }
  | { type: "transaction"; params: GillTransactionRequestParams };

/**
 * Options for creating Solana Pay URLs
 */
export interface CreateSolanaPayURLOptions {
  /** Whether to URL-encode the parameters (default: true) */
  encode?: boolean;
}

/**
 * Error types for Solana Pay operations
 */
export class SolanaPayError extends Error {
  constructor(message: string, public readonly code?: string) {
    super(message);
    this.name = "SolanaPayError";
  }
}

export class InvalidSolanaPayURLError extends SolanaPayError {
  constructor(message: string) {
    super(message, "INVALID_URL");
    this.name = "InvalidSolanaPayURLError";
  }
}

export class UnsupportedSolanaPayVersionError extends SolanaPayError {
  constructor(message: string) {
    super(message, "UNSUPPORTED_VERSION");
    this.name = "UnsupportedSolanaPayVersionError";
  }
}