import type { Address, GetSignaturesForAddressApi, Rpc } from "@solana/kit";
import { isSolanaError, SOLANA_ERROR__TRANSACTION_ERROR__UNKNOWN, SolanaError } from "@solana/kit";

import type { Simplify } from "../types/index";

type GetOldestSignatureForAddressRpc<TCluster> = Rpc<GetSignaturesForAddressApi> & {
  "~cluster"?: TCluster;
};

type GetOldestSignatureForAddressConfig = Simplify<
  Parameters<GetSignaturesForAddressApi["getSignaturesForAddress"]>[1]
> & { abortSignal?: AbortSignal };

/**
 * Get the oldest signature for the provided `address`
 */
export async function getOldestSignatureForAddress<TCluster>(
  rpc: GetOldestSignatureForAddressRpc<TCluster>,
  address: Address,
  config?: GetOldestSignatureForAddressConfig,
): Promise<ReturnType<GetSignaturesForAddressApi["getSignaturesForAddress"]>[0]> {
  const signatures = await rpc.getSignaturesForAddress(address, config).send({ abortSignal: config?.abortSignal });

  if (!signatures.length) {
    throw new SolanaError(SOLANA_ERROR__TRANSACTION_ERROR__UNKNOWN, {
      errorName: "OldestSignatureNotFound",
    });
  }

  const oldest = signatures[signatures.length - 1];
  if (signatures.length < (config?.limit || 1000)) return oldest;

  try {
    // if signatures are found to the limit, recurse for find the oldest
    return await getOldestSignatureForAddress(rpc, address, { ...config, before: oldest.signature });
  } catch (err) {
    // if signatures found were exactly at the limit, there will be no more to find, so we return the oldest
    if (isSolanaError(err, SOLANA_ERROR__TRANSACTION_ERROR__UNKNOWN)) return oldest;
    throw err;
  }
}
