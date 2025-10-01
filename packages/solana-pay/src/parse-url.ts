import { address, type Address } from "gill";
// import BigNumber from "bignumber.js";
import { SOLANA_PAY_PROTOCOL } from "./constants.js";

/**
 * A Solana Pay transaction request URL
 */
export interface SolanaPayTransactionRequestURL {
  /** `link` in the [Solana Pay spec](https://github.com/solana-labs/solana-pay/blob/master/SPEC.md#link) */
  link: URL;
  /** `label` in the [Solana Pay spec](https://github.com/solana-labs/solana-pay/blob/master/SPEC.md#label-1) */
  label?: string;
  /** `message` in the [Solana Pay spec](https://github.com/solana-labs/solana-pay/blob/master/SPEC.md#message-1) */
  message?: string;
}

/**
 * A Solana Pay transfer request URL
 */
export interface SolanaPayTransferRequestURL {
  /** `recipient` in the [Solana Pay spec](https://github.com/solana-labs/solana-pay/blob/master/SPEC.md#recipient) */
  recipient: Address;
  /** `amount` in the [Solana Pay spec](https://github.com/solana-labs/solana-pay/blob/master/SPEC.md#amount) */
  amount?: number;
  /** `spl-token` in the [Solana Pay spec](https://github.com/solana-labs/solana-pay/blob/master/SPEC.md#spl-token) */
  splToken: Address | undefined;
  /** `reference` in the [Solana Pay spec](https://github.com/solana-labs/solana-pay/blob/master/SPEC.md#reference) */
  reference?: Address[];
  /** `label` in the [Solana Pay spec](https://github.com/solana-labs/solana-pay/blob/master/SPEC.md#label) */
  label?: string;
  /** `message` in the [Solana Pay spec](https://github.com/solana-labs/solana-pay/blob/master/SPEC.md#message) */
  message?: string;
  /** `memo` in the [Solana Pay spec](https://github.com/solana-labs/solana-pay/blob/master/SPEC.md#memo) */
  memo?: string;
}

/**
 * Thrown when a URL can't be parsed as a Solana Pay URL
 */
export class SolanaPayParseURLError extends Error {
  name = "SolanaPayParseURLError";
}

/**
 * Parse a Solana Pay URL as a Transfer Request or Transaction Request
 *
 * @param url - URL to parse
 *
 * @throws {SolanaPayParseURLError}
 */
export function parseSolanaPayURL(url: string | URL): SolanaPayTransactionRequestURL | SolanaPayTransferRequestURL {
  if (typeof url === "string") {
    if (url.length > 2048) throw new SolanaPayParseURLError("length invalid");
    url = new URL(url);
  }

  if (url.protocol !== SOLANA_PAY_PROTOCOL) throw new SolanaPayParseURLError("protocol invalid");
  if (!url.pathname) throw new SolanaPayParseURLError("missing pathname");

  return /[:%]/.test(url.pathname) ? parseTransactionRequestURL(url) : parseTransferRequestURL(url);
}

function parseTransactionRequestURL({ pathname, searchParams }: URL): SolanaPayTransactionRequestURL {
  const link = new URL(decodeURIComponent(pathname));
  if (link.protocol !== "https:") throw new SolanaPayParseURLError("link invalid");

  const label = searchParams.get("label") || undefined;
  const message = searchParams.get("message") || undefined;

  return {
    link,
    label,
    message,
  };
}

function parseTransferRequestURL({ pathname, searchParams }: URL): SolanaPayTransferRequestURL {
  let recipient: Address;
  try {
    recipient = address(pathname);
  } catch (error: any) {
    throw new SolanaPayParseURLError("recipient invalid");
  }

  let amount: number | undefined;
  const amountParam = searchParams.get("amount");
  if (amountParam != null) {
    if (!/^\d+(\.\d+)?$/.test(amountParam)) throw new SolanaPayParseURLError("amount invalid");

    try {
      amount = parseFloat(amountParam);
    } catch (err) {
      throw new SolanaPayParseURLError("amount invalid");
    }
    if (!amount) throw new SolanaPayParseURLError("amount invalid");
    if (Number.isNaN(amount)) throw new SolanaPayParseURLError("amount NaN");
    if (amount < 0) throw new SolanaPayParseURLError("amount negative");
    // 0 is a valid `amount`
  }

  let splToken: Address | undefined;
  const splTokenParam = searchParams.get("spl-token");
  if (splTokenParam != null) {
    try {
      splToken = address(splTokenParam);
    } catch (error) {
      throw new SolanaPayParseURLError("spl-token invalid");
    }
  }

  let reference: Address[] | undefined;
  const referenceParams = searchParams.getAll("reference");
  if (referenceParams.length) {
    try {
      reference = referenceParams.map((reference) => address(reference));
    } catch (error) {
      throw new SolanaPayParseURLError("reference invalid");
    }
  }

  const label = searchParams.get("label") || undefined;
  const message = searchParams.get("message") || undefined;
  const memo = searchParams.get("memo") || undefined;

  return {
    recipient,
    amount,
    splToken,
    reference,
    label,
    message,
    memo,
  };
}
