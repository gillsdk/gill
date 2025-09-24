import type { Address, Signature } from "gill";
import { assertIsAddress, assertIsSignature, getBase58Decoder } from "gill";

/**
 * Takes a base64 encoded string of a byte array, parses, then asserts it as an {@link Address}
 */
export function base64BytesToAddress(base64Bytes: string): Address {
  const maybeAddress = getBase58Decoder().decode(Buffer.from(base64Bytes, "base64"));
  assertIsAddress(maybeAddress);
  return maybeAddress;
}

/**
 * Takes a base64 encoded string of a byte array, parses, then asserts it as an {@link Signature}
 */
export function base64BytesToSignature(base64Bytes: string): Signature {
  const maybeSignature = getBase58Decoder().decode(Buffer.from(base64Bytes, "base64"));
  assertIsSignature(maybeSignature);
  return maybeSignature;
}

/**
 * Takes a base64 encoded string of a byte array, parses, then returns as a utf8 string
 */
export function base64BytesToString(base64Bytes: string): string {
  return new TextDecoder().decode(Buffer.from(base64Bytes, "base64"));
}
