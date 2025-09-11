import type { Address } from "@solana/kit";
import { isAddress } from "@solana/kit";
import type { SolanaPayData, TransactionRequestParams, TransferRequestParams, URLOptions } from "../types/solana-pay";
import { SolanaPayError } from "../types/solana-pay";

export function createTransferRequestURL(params: TransferRequestParams, options: URLOptions = {}): string {
  const { encode = true } = options;

  if (!isAddress(params.recipient)) {
    throw new SolanaPayError("Invalid recipient", "INVALID_RECIPIENT");
  }

  let url = "solana:" + params.recipient;
  const query = new URLSearchParams();

  if (params.amount !== undefined) {
    query.set("amount", params.amount.toString());
  }

  if (params.splToken) {
    if (!isAddress(params.splToken)) {
      throw new SolanaPayError("Invalid token address", "INVALID_SPL_TOKEN");
    }
    query.set("spl-token", params.splToken);
  }

  if (params.reference?.length) {
    params.reference.forEach((ref) => {
      if (!isAddress(ref)) {
        throw new SolanaPayError("Invalid reference", "INVALID_REFERENCE");
      }
      query.append("reference", ref);
    });
  }

  if (params.label) query.set("label", params.label);
  if (params.message) query.set("message", params.message);
  if (params.memo) query.set("memo", params.memo);

  const queryString = query.toString();
  if (queryString) url += "?" + queryString;

  return encode ? url : decodeURIComponent(url).replace(/\+/g, " ");
}

export function createTransactionRequestURL(params: TransactionRequestParams, options: URLOptions = {}): string {
  const { encode = true } = options;

  try {
    if (new URL(params.link).protocol !== "https:") {
      throw new Error();
    }
  } catch {
    throw new SolanaPayError("HTTPS required", "INVALID_LINK");
  }

  const url = "solana:" + params.link;
  return encode ? url : decodeURIComponent(url).replace(/\+/g, " ");
}

/**
 * Parse a Solana Pay URL into structured data
 */
export function parseSolanaPayURL(url: string): SolanaPayData {
  if (!url.startsWith("solana:")) {
    throw new SolanaPayError("Invalid scheme", "INVALID_SCHEME");
  }

  const content = url.slice(7); // Remove "solana:"

  if (content.startsWith("https://")) {
    return {
      type: "transaction",
      params: { link: content },
    };
  }

  const [address, queryString] = content.split("?", 2);

  if (!isAddress(address)) {
    throw new SolanaPayError("Invalid recipient", "INVALID_RECIPIENT");
  }

  const params: TransferRequestParams = { recipient: address as Address };

  if (queryString) {
    const query = new URLSearchParams(queryString);

    const amount = query.get("amount");
    if (amount) {
      const numAmount = parseFloat(amount);
      if (isNaN(numAmount) || numAmount < 0) {
        throw new SolanaPayError("Invalid amount", "INVALID_AMOUNT");
      }
      params.amount = numAmount;
    }

    const token = query.get("spl-token");
    if (token) {
      if (!isAddress(token)) {
        throw new SolanaPayError("Invalid token", "INVALID_SPL_TOKEN");
      }
      params.splToken = token as Address;
    }

    const refs = query.getAll("reference");
    if (refs.length) {
      refs.forEach((ref) => {
        if (!isAddress(ref)) {
          throw new SolanaPayError("Invalid reference", "INVALID_REFERENCE");
        }
      });
      params.reference = refs as Address[];
    }

    const label = query.get("label");
    if (label) params.label = decodeURIComponent(label);

    const message = query.get("message");
    if (message) params.message = decodeURIComponent(message);

    const memo = query.get("memo");
    if (memo) params.memo = decodeURIComponent(memo);
  }

  return { type: "transfer", params };
}

/**
 * Validate a Solana Pay URL
 */
export function validateSolanaPayURL(url: string): boolean {
  try {
    parseSolanaPayURL(url);
    return true;
  } catch {
    return false;
  }
}

/**
 * Extract reference keys from a Solana Pay URL
 */
export function extractReferenceKeys(url: string): Address[] {
  const data = parseSolanaPayURL(url);
  return data.type === "transfer" && data.params.reference ? data.params.reference : [];
}

/**
 * Convert a Solana Pay URL to a QR code-friendly format
 */
export function toQRCodeURL(url: string): string {
  if (!validateSolanaPayURL(url)) {
    throw new SolanaPayError("Invalid URL", "INVALID_URL");
  }
  return encodeURI(url);
}
