import { createSignerFromKeyPair, type KeyPairSigner } from "@solana/kit";

import { createKeypairFromBase58 } from "../core";

/**
 * Load a `CryptoKeyPair` from an environment variable containing a base58 encoded keypair
 *
 * @param variableName - environment variable name accessible via `process.env[variableName]`
 */
export async function loadKeypairFromEnvironmentBase58<TName extends string | keyof NodeJS.ProcessEnv>(
  variableName: TName,
): Promise<CryptoKeyPair> {
  if (!process.env[variableName]) {
    throw new Error(`Environment variable '${variableName}' not set`);
  }
  return await createKeypairFromBase58(process.env[variableName]);
}

/**
 * Load a `KeyPairSigner` from an environment variable containing a base58 encoded keypair
 *
 * @param variableName - environment variable name accessible via `process.env[variableName]`
 */
export async function loadKeypairSignerFromEnvironmentBase58<TName extends string | keyof NodeJS.ProcessEnv>(
  variableName: TName,
): Promise<KeyPairSigner> {
  return await createSignerFromKeyPair(await loadKeypairFromEnvironmentBase58(variableName));
}
