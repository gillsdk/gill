import { Address } from "gill";

export interface SolanaPayTransactionRequestGetRequest {
  // get request takes not data
}

export interface SolanaPayTransactionRequestPostRequest {
  account: Address;
}

export function validateSolanaPayRequestUrl(url: URL): void {
  if (url.protocol !== "https:") {
    throw new Error("URL must use HTTPS protocol");
  }
}
