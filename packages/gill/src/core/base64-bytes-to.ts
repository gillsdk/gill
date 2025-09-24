import type { Address, Signature } from "@solana/kit";
import { assertIsAddress, assertIsSignature, getBase58Decoder, getBase64Encoder } from "@solana/kit";

/**
 * Takes a base64 encoded string of a byte array, parses, then asserts it as an {@link Address}
 */
export function base64BytesToAddress(base64Bytes: string): Address {
  const maybeAddress = getBase58Decoder().decode(getBase64Encoder().encode(base64Bytes));
  assertIsAddress(maybeAddress);
  return maybeAddress;
}

/**
 * Takes a base64 encoded string of a byte array, parses, then asserts it as an {@link Signature}
 */
export function base64BytesToSignature(base64Bytes: string): Signature {
  const maybeSignature = getBase58Decoder().decode(getBase64Encoder().encode(base64Bytes));
  assertIsSignature(maybeSignature);
  return maybeSignature;
}

/**
 * Takes a base64 encoded string of a byte array, parses, then returns as a utf8 string
 */
export function base64BytesToString(base64Bytes: string): string {
  return new TextDecoder().decode(getBase64Encoder().encode(base64Bytes));
}
