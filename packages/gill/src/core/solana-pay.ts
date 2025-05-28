import type { Address } from "@solana/kit";
import { isAddress } from "@solana/kit";
import type { TransferRequestParams, TransactionRequestParams, SolanaPayData, URLOptions } from "../types/solana-pay";
import { SolanaPayError } from "../types/solana-pay";

const SCHEME = "solana:";

function isValidAddress(address: string): boolean {
  try {
    return isAddress(address);
  } catch {
    return false;
  }
}

function isHttpsUrl(url: string): boolean {
  try {
    return new URL(url).protocol === "https:";
  } catch {
    return false;
  }
}

/**
 * Create a Solana Pay transfer request URL
 */
export function createTransferRequestURL(params: TransferRequestParams, options: URLOptions = {}): string {
  const { encode = true } = options;
  
  if (!isValidAddress(params.recipient)) {
    throw new SolanaPayError("Invalid recipient address", "INVALID_RECIPIENT");
  }
  
  let url = SCHEME + params.recipient;
  const searchParams = new URLSearchParams();
  
  if (params.amount !== undefined) {
    searchParams.set("amount", params.amount.toString());
  }
  
  if (params.splToken) {
    if (!isValidAddress(params.splToken)) {
      throw new SolanaPayError("Invalid SPL token address", "INVALID_SPL_TOKEN");
    }
    searchParams.set("spl-token", params.splToken);
  }
  
  if (params.reference?.length) {
    for (const ref of params.reference) {
      if (!isValidAddress(ref)) {
        throw new SolanaPayError("Invalid reference address", "INVALID_REFERENCE");
      }
      searchParams.append("reference", ref);
    }
  }
  
  if (params.label) searchParams.set("label", params.label);
  if (params.message) searchParams.set("message", params.message);
  if (params.memo) searchParams.set("memo", params.memo);
  
  const query = searchParams.toString();
  if (query) url += "?" + query;
  
  return encode ? url : decodeURIComponent(url).replace(/\+/g, ' ');
}

/**
 * Create a Solana Pay transaction request URL
 */
export function createTransactionRequestURL(params: TransactionRequestParams, options: URLOptions = {}): string {
  const { encode = true } = options;
  
  if (!isHttpsUrl(params.link)) {
    throw new SolanaPayError("Transaction request link must use HTTPS", "INVALID_LINK");
  }
  
  const url = SCHEME + params.link;
  return encode ? url : decodeURIComponent(url).replace(/\+/g, ' ');
}

/**
 * Parse a Solana Pay URL into structured data
 */
export function parseSolanaPayURL(url: string): SolanaPayData {
  if (!url.startsWith(SCHEME)) {
    throw new SolanaPayError("URL must start with 'solana:' scheme", "INVALID_SCHEME");
  }
  
  const withoutScheme = url.slice(SCHEME.length);
  
  if (withoutScheme.startsWith("https://")) {
    return {
      type: "transaction",
      params: { link: withoutScheme },
    };
  }
  
  const [addressPart, queryPart] = withoutScheme.split("?", 2);
  
  if (!isValidAddress(addressPart)) {
    throw new SolanaPayError("Invalid recipient address in URL", "INVALID_RECIPIENT");
  }
  
  const params: TransferRequestParams = { recipient: addressPart as Address };
  
  if (queryPart) {
    const searchParams = new URLSearchParams(queryPart);
    
    const amountStr = searchParams.get("amount");
    if (amountStr) {
      const amount = parseFloat(amountStr);
      if (isNaN(amount) || amount < 0) {
        throw new SolanaPayError("Invalid amount parameter", "INVALID_AMOUNT");
      }
      params.amount = amount;
    }
    
    const splToken = searchParams.get("spl-token");
    if (splToken) {
      if (!isValidAddress(splToken)) {
        throw new SolanaPayError("Invalid SPL token address", "INVALID_SPL_TOKEN");
      }
      params.splToken = splToken as Address;
    }
    
    const references = searchParams.getAll("reference");
    if (references.length) {
      for (const ref of references) {
        if (!isValidAddress(ref)) {
          throw new SolanaPayError("Invalid reference address", "INVALID_REFERENCE");
        }
      }
      params.reference = references as Address[];
    }
    
    const label = searchParams.get("label");
    if (label) params.label = decodeURIComponent(label);
    
    const message = searchParams.get("message");
    if (message) params.message = decodeURIComponent(message);
    
    const memo = searchParams.get("memo");
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
    throw new SolanaPayError("Invalid Solana Pay URL", "INVALID_URL");
  }
  return encodeURI(url);
} 