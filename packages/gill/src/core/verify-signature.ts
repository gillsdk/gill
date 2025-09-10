import type {} from "@solana/kit";
import {
  getBase58Encoder,
  getPublicKeyFromAddress,
  verifySignature,
  type Address,
  type ReadonlyUint8Array,
  type Signature,
  type SignatureBytes,
} from "@solana/kit";

/**
 * Verifies a Solana Address had signed the given message.
 *
 * @param address - The Solana address expected to have signed the message
 * @param signature - The signature to verify
 * @param signedMessage - The original message that was signed
 * @returns Promise that resolves to `true` if the signature is valid, `false` otherwise
 *
 * @example
 * ```typescript
 * const isValid = await verifySignatureForAddress(
 *   "9WzDXwBbmkg8ZTbNMqUxvQRAyrZzDsGYdLVL9zYtAWWM" as Address,
 *   "signature_string_here",
 *   "Hello, world!"
 * );
 * console.log(isValid); // true or false
 * ```
 */
export async function verifySignatureForAddress(
  address: Address,
  signature: string | Signature | SignatureBytes | Uint8Array | ReadonlyUint8Array,
  message: string | Uint8Array,
): Promise<boolean> {
  const publicKey = await getPublicKeyFromAddress(address);
  if (typeof message === "string") {
    message = new TextEncoder().encode(message);
  }
  // massage the signature into the branded type for `SignatureBytes`
  if (typeof signature === "string") {
    signature = getBase58Encoder().encode(signature);
  }
  return verifySignature(publicKey, signature as SignatureBytes, message);
}
