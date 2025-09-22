import type { Address } from "gill";
import { SOLANA_PAY_PROTOCOL } from "./constants.js";

/**
 * Fields of a Solana Pay transaction request URL.
 */
export interface SolanaPayTransactionRequestURLFields {
  /** `link` in the [Solana Pay spec](https://github.com/solana-labs/solana-pay/blob/master/SPEC.md#link) */
  link: URL;
  /** `label` in the [Solana Pay spec](https://github.com/solana-labs/solana-pay/blob/master/SPEC.md#label-1) */
  label?: string;
  /** `message` in the [Solana Pay spec](https://github.com/solana-labs/solana-pay/blob/master/SPEC.md#message-1).  */
  message?: string;
}

/**
 * Fields of a Solana Pay transfer request URL.
 */
export interface SolanaPayTransferRequestURLFields {
  /** `recipient` in the [Solana Pay spec](https://github.com/solana-labs/solana-pay/blob/master/SPEC.md#recipient) */
  recipient: Address;
  /** `amount` in the [Solana Pay spec](https://github.com/solana-labs/solana-pay/blob/master/SPEC.md#amount) */
  amount?: number | string;
  /** `spl-token` in the [Solana Pay spec](https://github.com/solana-labs/solana-pay/blob/master/SPEC.md#spl-token) */
  splToken?: Address;
  /** `reference` in the [Solana Pay spec](https://github.com/solana-labs/solana-pay/blob/master/SPEC.md#reference) */
  reference?: Address | Address[];
  /** `label` in the [Solana Pay spec](https://github.com/solana-labs/solana-pay/blob/master/SPEC.md#label) */
  label?: string;
  /** `message` in the [Solana Pay spec](https://github.com/solana-labs/solana-pay/blob/master/SPEC.md#message).  */
  message?: string;
  /** `memo` in the [Solana Pay spec](https://github.com/solana-labs/solana-pay/blob/master/SPEC.md#memo) */
  memo?: string;
}

/**
 * Encode a Solana Pay URL
 *
 * @param fields Fields to encode in the URL
 */
export function encodeSolanaPayURL(
  fields: SolanaPayTransactionRequestURLFields | SolanaPayTransferRequestURLFields,
): URL {
  return "link" in fields ? encodeTransactionRequestURL(fields) : encodeTransferRequestURL(fields);
}

function encodeTransactionRequestURL({ link, label, message }: SolanaPayTransactionRequestURLFields): URL {
  if (link.protocol !== "https:") {
    throw new Error("Link must use HTTPS protocol");
  }

  // Remove trailing slashes
  const pathname = link.search
    ? encodeURIComponent(String(link).replace(/\/\?/, "?"))
    : String(link).replace(/\/$/, "");
  const url = new URL(SOLANA_PAY_PROTOCOL + pathname);

  if (label) {
    url.searchParams.append("label", label);
  }

  if (message) {
    url.searchParams.append("message", message);
  }

  return url;
}

function encodeTransferRequestURL({
  recipient,
  amount,
  splToken,
  reference,
  label,
  message,
  memo,
}: SolanaPayTransferRequestURLFields): URL {
  const url = new URL(SOLANA_PAY_PROTOCOL + recipient);

  if (amount) {
    url.searchParams.append("amount", amount.toString());
  }

  if (splToken) {
    url.searchParams.append("spl-token", splToken);
  }

  if (reference) {
    if (!Array.isArray(reference)) {
      reference = [reference];
    }

    for (const pubkey of reference) {
      url.searchParams.append("reference", pubkey);
    }
  }

  if (label) {
    url.searchParams.append("label", label);
  }

  if (message) {
    url.searchParams.append("message", message);
  }

  if (memo) {
    url.searchParams.append("memo", memo);
  }

  return url;
}
