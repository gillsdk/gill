import { SolanaPayTransactionRequestPostRequest, validateSolanaPayRequestUrl } from "./request.js";
import {
  parseSolanaPayGetResponse,
  parseSolanaPayPostResponse,
  SolanaPayTransactionRequestGetResponse,
  SolanaPayTransactionRequestPostResponse,
} from "./response.js";

export async function getTransactionRequest(
  url: URL,
  options?: RequestInit,
): Promise<SolanaPayTransactionRequestGetResponse> {
  validateSolanaPayRequestUrl(url);

  const response = await fetch(url, {
    method: "GET",
    headers: {
      Accept: "application/json",
      "Accept-Encoding": "gzip, deflate, br",
      ...options?.headers,
    },
    ...options,
  });

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
  }

  const data = await response.json();
  return parseSolanaPayGetResponse(data);
}

export async function postTransactionRequest(
  url: URL,
  body: SolanaPayTransactionRequestPostRequest,
  options?: RequestInit,
): Promise<SolanaPayTransactionRequestPostResponse> {
  validateSolanaPayRequestUrl(url);

  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      "Accept-Encoding": "gzip, deflate, br",
      ...options?.headers,
    },
    body: JSON.stringify(body),
    ...options,
  });

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
  }

  const data = await response.json();
  return parseSolanaPayPostResponse(data);
}

/**
 *
 */
export const solanaPayTransactionRequest = {
  get: getTransactionRequest,
  post: postTransactionRequest,
};
