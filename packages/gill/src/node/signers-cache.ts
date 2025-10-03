import type { KeyPairSigner, TransactionSigner } from "@solana/kit";

const CACHE_SYMBOL = Symbol.for("gill.signersCache");

type SignerCache = Map<string, TransactionSigner>;

function getGlobalCache(): SignerCache {
  const g = globalThis as unknown as Record<PropertyKey, unknown>;
  if (!g[CACHE_SYMBOL]) g[CACHE_SYMBOL] = new Map<string, TransactionSigner>();
  return g[CACHE_SYMBOL] as SignerCache;
}

export async function getOrCreateSigner(
  address: string,
  factory: () => Promise<KeyPairSigner> | KeyPairSigner,
): Promise<KeyPairSigner> {
  const cache = getGlobalCache();
  const key = String(address);
  const existing = cache.get(key);
  if (existing) return existing as KeyPairSigner;
  const created = await factory();
  cache.set(key, created);
  return created;
}

export function resetSignersCache(): void {
  getGlobalCache().clear();
}
