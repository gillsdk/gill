import type { Address } from "@solana/kit";
import { getAddressEncoder, getAddressDecoder } from "@solana/kit";
import BigNumber from "bignumber.js";
import type {
  CreateSolanaPayURLOptions,
  GillSolanaPayData,
  GillTransactionRequestParams,
  GillTransferRequestParams,
} from "../types/solana-pay";
import {
  SolanaPayError,
  InvalidSolanaPayURLError,
} from "../types/solana-pay";

/**
 * Creates a Solana Pay transfer request URL using gill's Address type
 * 
 * @param params - Transfer request parameters
 * @param options - URL creation options
 * @returns The Solana Pay URL string
 * 
 * @example
 * ```typescript
 * const url = createTransferRequestURL({
 *   recipient: "11111111111111111111111111111112" as Address,
 *   amount: 1000000n, // 0.001 SOL in lamports
 *   label: "Coffee Shop",
 *   message: "Thanks for your purchase!"
 * });
 * console.log(url); // "solana:11111111111111111111111111111112?amount=1000000&label=Coffee%20Shop&message=Thanks%20for%20your%20purchase!"
 * ```
 */
export async function createTransferRequestURL(
  params: GillTransferRequestParams,
  options: CreateSolanaPayURLOptions = {}
): Promise<string> {
  const { encode = true } = options;
  
  // Convert gill Address types to PublicKey for @solana/pay
  const addressEncoder = getAddressEncoder();
  
  // Dynamic import to handle ESM/CommonJS compatibility
  const { encodeURL } = await import("@solana/pay");
  
  // We need to create PublicKey objects for @solana/pay
  // Since @solana/pay expects @solana/web3.js PublicKey objects, we need to import that
  const { PublicKey } = await import("@solana/web3.js");
  
  // Create the transfer URL using the official @solana/pay package
  const transferParams = {
    recipient: new PublicKey(addressEncoder.encode(params.recipient)),
    amount: params.amount ? new BigNumber(params.amount.toString()) : undefined,
    splToken: params.splToken ? new PublicKey(addressEncoder.encode(params.splToken)) : undefined,
    reference: params.reference?.map((ref: Address) => new PublicKey(addressEncoder.encode(ref))),
    label: params.label,
    message: params.message,
    memo: params.memo,
  };
  
  const url = encodeURL(transferParams);
  const urlString = url.toString();
  
  if (!encode) {
    // Decode both percent encoding and plus signs to spaces
    return decodeURIComponent(urlString).replace(/\+/g, ' ');
  }
  
  return urlString;
}

/**
 * Creates a Solana Pay transaction request URL
 * 
 * @param params - Transaction request parameters
 * @param options - URL creation options
 * @returns The Solana Pay URL string
 * 
 * @example
 * ```typescript
 * const url = createTransactionRequestURL({
 *   link: "https://merchant.com/api/solana-pay"
 * });
 * console.log(url); // "solana:https://merchant.com/api/solana-pay"
 * ```
 */
export async function createTransactionRequestURL(
  params: GillTransactionRequestParams,
  options: CreateSolanaPayURLOptions = {}
): Promise<string> {
  const { encode = true } = options;
  
  // Validate HTTPS URL
  if (!params.link.startsWith("https://")) {
    throw new SolanaPayError("Transaction request link must use HTTPS", "INVALID_LINK");
  }
  
  // Dynamic import to handle ESM/CommonJS compatibility
  const { encodeURL } = await import("@solana/pay");
  
  const url = encodeURL({
    link: new URL(params.link),
  });
  
  const urlString = url.toString();
  
  if (!encode) {
    // Decode both percent encoding and plus signs to spaces
    return decodeURIComponent(urlString).replace(/\+/g, ' ');
  }
  
  return urlString;
}

/**
 * Parses a Solana Pay URL and returns the structured data with gill types
 * 
 * @param url - The Solana Pay URL to parse
 * @returns Parsed Solana Pay data
 * 
 * @example
 * ```typescript
 * const data = parseSolanaPayURL("solana:11111111111111111111111111111112?amount=1000000");
 * if (data.type === "transfer") {
 *   console.log(data.params.recipient); // "11111111111111111111111111111112"
 *   console.log(data.params.amount); // 1000000n
 * }
 * ```
 */
export async function parseSolanaPayURL(url: string): Promise<GillSolanaPayData> {
  try {
    // Dynamic import to handle ESM/CommonJS compatibility
    const { parseURL } = await import("@solana/pay");
    const parsed = parseURL(url);
    const addressDecoder = getAddressDecoder();
    
    if ('recipient' in parsed) {
      // This is a transfer request
      return {
        type: "transfer",
        params: {
          recipient: addressDecoder.decode(new Uint8Array(parsed.recipient.toBuffer())) as Address,
          amount: parsed.amount ? BigInt(parsed.amount.toString()) : undefined,
          splToken: parsed.splToken ? addressDecoder.decode(new Uint8Array(parsed.splToken.toBuffer())) as Address : undefined,
          reference: parsed.reference?.map((ref: any) => addressDecoder.decode(new Uint8Array(ref.toBuffer())) as Address),
          label: parsed.label,
          message: parsed.message,
          memo: parsed.memo,
        },
      };
    } else {
      // This is a transaction request
      return {
        type: "transaction",
        params: {
          link: parsed.link.toString(),
        },
      };
    }
  } catch (error) {
    throw new InvalidSolanaPayURLError(`Failed to parse Solana Pay URL: ${error instanceof Error ? error.message : String(error)}`);
  }
}

/**
 * Validates a Solana Pay URL
 * 
 * @param url - The URL to validate
 * @returns True if the URL is valid, false otherwise
 * 
 * @example
 * ```typescript
 * const isValid = validateSolanaPayURL("solana:11111111111111111111111111111112");
 * console.log(isValid); // true
 * ```
 */
export async function validateSolanaPayURL(url: string): Promise<boolean> {
  try {
    // Dynamic import to handle ESM/CommonJS compatibility
    const { parseURL } = await import("@solana/pay");
    parseURL(url);
    return true;
  } catch {
    return false;
  }
}

/**
 * Converts a Solana Pay URL to a QR code-friendly format
 * This function URL-encodes the URL to ensure it's safe for QR codes
 * 
 * @param url - The Solana Pay URL
 * @returns URL-encoded string suitable for QR codes
 * 
 * @example
 * ```typescript
 * const qrUrl = toQRCodeURL("solana:11111111111111111111111111111112?label=Coffee Shop");
 * // Use qrUrl with your preferred QR code library
 * ```
 */
export async function toQRCodeURL(url: string): Promise<string> {
  if (!(await validateSolanaPayURL(url))) {
    throw new InvalidSolanaPayURLError("Invalid Solana Pay URL");
  }
  return encodeURI(url);
}

/**
 * Creates a QR code for a Solana Pay URL using the official @solana/pay createQR function
 * 
 * @param url - The Solana Pay URL
 * @param size - QR code size (default: 256)
 * @returns QR code element that can be appended to DOM
 * 
 * @example
 * ```typescript
 * const qrCode = createSolanaPayQR("solana:11111111111111111111111111111112");
 * document.getElementById('qr-container').appendChild(qrCode);
 * ```
 */
export async function createSolanaPayQR(url: string, size: number = 256) {
  if (!(await validateSolanaPayURL(url))) {
    throw new InvalidSolanaPayURLError("Invalid Solana Pay URL");
  }
  
  // Dynamic import to handle ESM/CommonJS compatibility
  const { createQR } = await import("@solana/pay");
  return createQR(url, size);
}

/**
 * Extracts reference keys from a Solana Pay transfer request
 * 
 * @param url - The Solana Pay URL
 * @returns Array of reference addresses
 * 
 * @example
 * ```typescript
 * const references = extractReferenceKeys("solana:11111111111111111111111111111112?reference=22222222222222222222222222222223");
 * console.log(references); // ["22222222222222222222222222222223"]
 * ```
 */
export async function extractReferenceKeys(url: string): Promise<Address[]> {
  const data = await parseSolanaPayURL(url);
  
  if (data.type === "transfer" && data.params.reference) {
    return data.params.reference;
  }
  
  return [];
}

/**
 * Helper function to find reference transactions (uses dynamic import)
 */
export async function findReference(connection: any, reference: Address, options?: any) {
  const { findReference: findRef } = await import("@solana/pay");
  const { PublicKey } = await import("@solana/web3.js");
  const addressEncoder = getAddressEncoder();
  const publicKey = new PublicKey(addressEncoder.encode(reference));
  return findRef(connection, publicKey, options);
}

/**
 * Helper function to validate transfers (uses dynamic import)
 */
export async function validateTransfer(connection: any, signature: string, options: any) {
  const { validateTransfer: validateTx } = await import("@solana/pay");
  return validateTx(connection, signature, options);
} 