import type {} from "@solana/kit";
import {
  type Address,
  getBase58Encoder,
  getPublicKeyFromAddress,
  type ReadonlyUint8Array,
  type Signature,
  type SignatureBytes,
  verifySignature,
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
 *   "GC5AFcYqshWUnNK23MbWTXPix3FUagZt4fjUAt88FT59" as Address,
 *   "jrZaHRqiRojydQMxHqqe7FEkfeyw64KfPdF2ww1mm3hpVtGyxBvEU5NmHdZFoawYnYu62ujgqw3gcL2XHYbxd9K",
 *   "Hello, Solana!!"
 * );
 * console.log(isValid); // true or false
 * ```
 */
export async function verifySignatureForAddress(
  address: Address,
  signature: ReadonlyUint8Array | Signature | SignatureBytes | Uint8Array | string,
  message: Uint8Array | string,
): Promise<boolean> {
  const publicKey = await getPublicKeyFromAddress(address);
  if (typeof message === "string") {
    message = new TextEncoder().encode(message);
  }
  // massage the signature into the branded type for `SignatureBytes`
  if (typeof signature === "string") {
    signature = getBase58Encoder().encode(signature);
  }
  return await verifySignature(publicKey, signature as SignatureBytes, message);
}
