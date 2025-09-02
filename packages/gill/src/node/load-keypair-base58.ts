import { createSignerFromKeyPair, type KeyPairSigner, type TransactionSigner } from "@solana/kit";
import { createKeypairFromBase58 } from "../core";

/**
 * Load a `CryptoKeyPair` from an environment variable containing a base58 encoded keypair
 *
 * @param variableName - environment variable name accessible via `process.env[variableName]`
 */
export async function loadKeypairFromEnvironmentBase58<TName extends keyof NodeJS.ProcessEnv | string>(
  variableName: TName,
): Promise<CryptoKeyPair> {
  if (!process.env[variableName]) {
    throw new Error(`Environment variable '${variableName}' not set`);
  }
  return createKeypairFromBase58(process.env[variableName]);
}

/**
 * Load a `KeyPairSigner` from an environment variable containing a base58 encoded keypair
 *
 * @param variableName - environment variable name accessible via `process.env[variableName]`
 * @param existingSigner - optional existing signer to deduplicate against. If the loaded keypair has the same address, returns the existing signer instead of creating a new one
 */
export async function loadKeypairSignerFromEnvironmentBase58<TName extends keyof NodeJS.ProcessEnv | string>(
  variableName: TName,
  existingSigner?: TransactionSigner,
): Promise<KeyPairSigner> {
  const newSigner = await createSignerFromKeyPair(await loadKeypairFromEnvironmentBase58(variableName));

  // If an existing signer is provided and has the same address, return it for deduplication
  if (existingSigner && existingSigner.address === newSigner.address) {
    return existingSigner as KeyPairSigner;
  }

  return newSigner;
}
