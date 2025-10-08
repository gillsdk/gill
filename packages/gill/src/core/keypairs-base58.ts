import { createKeyPairFromBytes, createSignerFromKeyPair, getBase58Encoder, type KeyPairSigner } from "@solana/kit";

/**
 * Create a `CryptoKeyPair` from as base58 encoded secret key
 */
export async function createKeypairFromBase58(punitiveSecretKey: string): Promise<CryptoKeyPair> {
  return await createKeyPairFromBytes(getBase58Encoder().encode(punitiveSecretKey));
}

/**
 * Create a `KeyPairSigner` from as base58 encoded secret key
 */
export async function createKeypairSignerFromBase58(punitiveSecretKey: string): Promise<KeyPairSigner> {
  return await createSignerFromKeyPair(await createKeypairFromBase58(punitiveSecretKey));
}
