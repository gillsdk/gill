import type { Address } from "@solana/kit";
import QRCode from "qrcode";

export interface SolanaPayTransferRequest {
  amount?: number | string;
  label?: string;
  memo?: string;
  message?: string;
  recipient: Address;
  reference?: Address | Address[];
  "spl-token"?: Address;
}

export interface SolanaPayTransactionRequest {
  link: string;
}

export interface SolanaPayGetResponse {
  icon: string;
  label: string;
}

export interface SolanaPayPostRequest {
  account: Address;
}

export interface SolanaPayPostResponse {
  message?: string;
  transaction: string;
}

export type SolanaPayURL = `solana:${string}`;

export function createSolanaPayTransferURI(params: SolanaPayTransferRequest): SolanaPayURL {
  const { recipient, ...rest } = params;
  const searchParams = new URLSearchParams();

  Object.entries(rest).forEach(([key, value]) => {
    if (value !== undefined) {
      if (Array.isArray(value)) {
        value.forEach((v) => searchParams.append(key, v));
      } else {
        searchParams.set(key, String(value));
      }
    }
  });

  const queryString = searchParams.toString();
  return `solana:${recipient}${queryString ? `?${queryString}` : ""}` as SolanaPayURL;
}

export function createSolanaPayTransactionURI(link: string): SolanaPayURL {
  return `solana:${link}`;
}

export function parseSolanaPayURI(uri: SolanaPayURL): SolanaPayTransactionRequest | SolanaPayTransferRequest {
  if (!uri.startsWith("solana:")) {
    throw new Error('Invalid Solana Pay URI: must start with "solana:"');
  }

  const content = uri.slice(7);

  if (content.startsWith("http://") || content.startsWith("https://")) {
    return { link: content };
  }

  const [recipientPart, queryPart] = content.split("?");
  const recipient = recipientPart as Address;

  if (!queryPart) {
    return { recipient };
  }

  const params = new URLSearchParams(queryPart);
  const result: SolanaPayTransferRequest = { recipient };

  const amount = params.get("amount");
  if (amount) {
    result.amount = amount;
  }

  const splToken = params.get("spl-token");
  if (splToken) {
    result["spl-token"] = splToken as Address;
  }

  const references = params.getAll("reference");
  if (references.length > 0) {
    result.reference = references.length === 1 ? (references[0] as Address) : (references as Address[]);
  }

  const label = params.get("label");
  if (label) {
    result.label = decodeURIComponent(label);
  }

  const message = params.get("message");
  if (message) {
    result.message = decodeURIComponent(message);
  }

  const memo = params.get("memo");
  if (memo) {
    result.memo = decodeURIComponent(memo);
  }

  return result;
}

export function isSolanaPayTransferRequest(
  request: SolanaPayTransactionRequest | SolanaPayTransferRequest,
): request is SolanaPayTransferRequest {
  return "recipient" in request;
}

export function isSolanaPayTransactionRequest(
  request: SolanaPayTransactionRequest | SolanaPayTransferRequest,
): request is SolanaPayTransactionRequest {
  return "link" in request;
}

export interface SolanaPayQROptions {
  color?: {
    dark?: string;
    light?: string;
  };
  errorCorrectionLevel?: "H" | "L" | "M" | "Q";
  margin?: number;
  size?: number;
}

export type QROutputFormat = "png" | "svg" | "terminal" | "utf8";

export interface SolanaPayQRGenerateOptions extends SolanaPayQROptions {
  format?: QROutputFormat;
}

export async function createSolanaPayQR(uri: SolanaPayURL, options: SolanaPayQRGenerateOptions = {}): Promise<string> {
  const {
    size = 512,
    margin = 4,
    color = { dark: "#000000", light: "#FFFFFF" },
    errorCorrectionLevel = "M",
    format = "png",
  } = options;

  try {
    const qrOptions = {
      color: {
        dark: color.dark || "#000000",
        light: color.light || "#FFFFFF",
      },
      errorCorrectionLevel,
      margin,
      width: size,
    };

    switch (format) {
      case "png":
        return await QRCode.toDataURL(uri, qrOptions);
      case "svg":
        return await QRCode.toString(uri, { type: "svg", ...qrOptions });
      case "utf8":
        return await QRCode.toString(uri, { type: "utf8", ...qrOptions });
      case "terminal":
        return await QRCode.toString(uri, { type: "terminal", ...qrOptions });
      default:
        return await QRCode.toDataURL(uri, qrOptions);
    }
  } catch (error) {
    throw new Error(`Failed to generate QR code: ${error instanceof Error ? error.message : String(error)}`);
  }
}

export async function createSolanaPayQRString(uri: SolanaPayURL, options: SolanaPayQROptions = {}): Promise<string> {
  const { size = 512, margin = 4, color = { dark: "#000000", light: "#FFFFFF" } } = options;

  try {
    const qrOptions = {
      color: {
        dark: color.dark || "#000000",
        light: color.light || "#FFFFFF",
      },
      errorCorrectionLevel: "M" as const,
      margin,
      width: size,
    };

    return await QRCode.toString(uri, { type: "svg", ...qrOptions });
  } catch (error) {
    throw new Error(`Failed to generate QR code: ${error instanceof Error ? error.message : String(error)}`);
  }
}

export async function createSolanaPayTransferQR(
  params: SolanaPayTransferRequest,
  options: SolanaPayQRGenerateOptions = {},
): Promise<string> {
  const uri = createSolanaPayTransferURI(params);
  return await createSolanaPayQR(uri, options);
}

export async function createSolanaPayTransactionQR(
  link: string,
  options: SolanaPayQRGenerateOptions = {},
): Promise<string> {
  const uri = createSolanaPayTransactionURI(link);
  return await createSolanaPayQR(uri, options);
}
