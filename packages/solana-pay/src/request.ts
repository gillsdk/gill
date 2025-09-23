import { Address } from "gill";
import { SolanaPayError } from "./errors.js";

export interface SolanaPayTransactionRequestGetRequest {
  // get request takes not data
}

export interface SolanaPayTransactionRequestPostRequest {
  account: Address;
}

export function validateSolanaPayRequestUrl(url: URL): void {
  if (url.protocol !== "https:") {
    throw new SolanaPayError("URL must use HTTPS protocol");
  }
}
