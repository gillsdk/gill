import { transactionFromBase64, type Transaction } from "gill";

export class SolanaPayResponseError extends Error {
  name = "SolanaPayResponseError";
}

export interface SolanaPayTransactionRequestGetResponse {
  label: string;
  icon: string;
}

export interface SolanaPayTransactionRequestPostResponse {
  transaction: string;
  message?: string;
}

export interface SolanaPayTransactionRequestGetResponseParsed {
  label: string;
  icon: URL;
}

export interface SolanaPayTransactionRequestPostResponseParsed {
  transaction: Transaction;
  message?: string;
}

/**
 * Parse provided input to be a valid Solana Pay Transaction Request's
 * [GET response](https://github.com/solana-foundation/solana-pay/blob/master/SPEC.md#get-response)
 * per the spec
 */
export function parseSolanaPayGetResponse(data: any): SolanaPayTransactionRequestGetResponseParsed {
  if (!data.label || typeof data.label !== "string") {
    throw new SolanaPayResponseError("Invalid response: missing or invalid label");
  }

  if (!data.icon || typeof data.icon !== "string") {
    throw new SolanaPayResponseError("Invalid response: missing or invalid icon");
  }

  let iconUrl: URL;
  try {
    iconUrl = new URL(data.icon);
  } catch {
    throw new SolanaPayResponseError("Invalid icon URL format");
  }

  if (iconUrl.protocol !== "http:" && iconUrl.protocol !== "https:") {
    throw new SolanaPayResponseError("Icon URL must use HTTP or HTTPS protocol");
  }

  // jpg is not in the v1.1 spec, but they should be :)
  const allowedExtensions = [".svg", ".png", ".webp", ".jpg", ".jpeg"];
  const hasValidExtension = allowedExtensions.some((ext) => iconUrl.pathname.toLowerCase().endsWith(ext));

  if (!hasValidExtension) {
    throw new SolanaPayResponseError("Icon must be SVG, PNG, WebP, or JPEG format");
  }

  return {
    label: data.label,
    icon: iconUrl,
  };
}

/**
 * Parse provided input to be a valid Solana Pay Transaction Request's
 * [POST response](https://github.com/solana-foundation/solana-pay/blob/master/SPEC.md#post-response)
 * per the spec
 */
export function parseSolanaPayPostResponse(data: any): SolanaPayTransactionRequestPostResponseParsed {
  if (!data.transaction || typeof data.transaction !== "string") {
    throw new SolanaPayResponseError("Invalid response: missing or invalid transaction");
  }

  if (data.message && typeof data.message !== "string") {
    throw new SolanaPayResponseError("Invalid response: message must be string");
  }

  let transaction: Transaction | null = null;

  try {
    transaction = transactionFromBase64(data.transaction);
  } catch {
    throw new SolanaPayResponseError("Invalid transaction data as base64");
  }

  return {
    transaction,
    message: data.message,
  };
}
