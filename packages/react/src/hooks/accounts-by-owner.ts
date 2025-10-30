"use client";

import { useQuery } from "@tanstack/react-query";
import type {
  AccountInfoBase,
  AccountInfoWithBase64EncodedData,
  AccountInfoWithPubkey,
  Address,
  Commitment,
  Decoder,
  GetProgramAccountsApi,
  Simplify,
} from "gill";
import { decodeAccount, parseBase64RpcAccount } from "gill";

import { GILL_HOOK_CLIENT_KEY } from "../const.js";
import { useSolanaClient } from "./client.js";
import type { GillUseRpcHook } from "./types.js";

type RpcConfig = Simplify<
  Omit<Parameters<GetProgramAccountsApi["getProgramAccounts"]>[1], "encoding" | "filters"> &
    Readonly<{
      commitment?: Commitment;
      encoding?: "base64";
    }>
>;

type UseAccountsByOwnerFilter = {
  /**
   * Optional data size filter to match accounts of a specific size
   */
  dataSize?: bigint;
  /**
   * Optional additional memcmp filter for more specific queries.
   * Note: The owner filter is automatically added, this is for additional filtering.
   */
  memcmp?: {
    bytes: string;
    encoding: "base58" | "base64";
    offset: bigint;
  };
  /**
   * Offset where the owner public key is stored in the account data.
   * For SPL Token accounts, this is typically 32.
   * Must be provided to filter by owner.
   */
  ownerOffset: bigint;
  /**
   * Program ID that owns the accounts to query
   */
  programId: Address | string;
};

type UseAccountsByOwnerInput<
  TConfig extends RpcConfig = RpcConfig,
  TDecodedData extends object = Uint8Array,
> = GillUseRpcHook<TConfig> & {
  /**
   * Account decoder that can decode the account's `data` byte array value.
   * If not provided, raw account data will be returned as Uint8Array.
   */
  decoder?: Decoder<TDecodedData>;
  /**
   * Filter configuration for querying accounts
   */
  filter: UseAccountsByOwnerFilter;
  /**
   * Address of the owner to query accounts for
   */
  owner: Address | string;
};

type UseAccountsByOwnerResponse<TDecodedData extends object = Uint8Array> = {
  /**
   * Array of decoded accounts
   */
  accounts: TDecodedData[];
};

/**
 * Query accounts owned by a specific owner address using the Solana RPC method of
 * [`getProgramAccounts`](https://solana.com/docs/rpc/http/getprogramaccounts) with filters.
 *
 * This hook allows you to fetch all accounts that:
 * 1. Are owned by a specific program (specified in `filter.programId`)
 * 2. Have a specific owner address at a given offset (specified in `filter.ownerOffset`)
 * 3. Optionally match additional filters (memcmp, dataSize)
 *
 * @example
 * ```tsx
 * // Query all SPL Token accounts owned by a wallet
 * const { accounts, isLoading } = useAccountsByOwner({
 *   owner: walletAddress,
 *   filter: {
 *     programId: TOKEN_PROGRAM_ADDRESS,
 *     ownerOffset: 32n, // Owner field offset in Token account
 *     dataSize: 165n,   // Size of Token account
 *   },
 *   decoder: getTokenDecoder(),
 * });
 * ```
 *
 * @warning `getProgramAccounts` is resource-intensive and may be rate-limited or disabled
 * on public RPC endpoints. Always use filters to reduce data returned and use a paid RPC
 * provider for production applications.
 */
export function useAccountsByOwner<TConfig extends RpcConfig = RpcConfig, TDecodedData extends object = Uint8Array>({
  decoder,
  filter,
  owner,
  abortSignal,
  config,
  options,
}: UseAccountsByOwnerInput<TConfig, TDecodedData>) {
  const { rpc, urlOrMoniker } = useSolanaClient();

  const { data, ...rest } = useQuery({
    ...options,
    enabled: (options?.enabled ?? true) && !!owner && !!filter.programId,
    queryFn: async () => {
      // Build filters array - need to use type assertion for bytes
      // because the RPC expects branded types but we're working with strings
      const filters = [];

      // Add owner memcmp filter
      filters.push({
        memcmp: {
          bytes: owner,
          encoding: "base58",
          offset: filter.ownerOffset,
        },
      });

      // Add optional dataSize filter
      if (filter.dataSize !== undefined) {
        filters.push({
          dataSize: filter.dataSize,
        });
      }

      // Add optional additional memcmp filter
      if (filter.memcmp) {
        filters.push({
          memcmp: {
            bytes: filter.memcmp.bytes,
            encoding: filter.memcmp.encoding,
            offset: filter.memcmp.offset,
          },
        });
      }

      // Fetch accounts with filters - type assertion needed for filter compatibility
      const response = await rpc
        .getProgramAccounts(filter.programId as Address, {
          ...config,
          encoding: "base64",
          // @ts-expect-error - Filter types require branded Base58/Base64 bytes but we're using strings
          filters,
        })
        .send({ abortSignal });

      // Handle both direct array response and context-wrapped response
      const accountsList = Array.isArray(response) ? response : response.value;

      // Parse and decode accounts
      const decodedAccounts = accountsList.map(
        (accountWithPubkey: AccountInfoWithPubkey<AccountInfoBase & AccountInfoWithBase64EncodedData>) => {
          const account = parseBase64RpcAccount(accountWithPubkey.pubkey, accountWithPubkey.account);

          if (decoder) {
            return decodeAccount(account, decoder).data;
          }

          // Return raw data if no decoder provided
          return account.data as TDecodedData;
        },
      );

      return decodedAccounts;
    },
    queryKey: [
      GILL_HOOK_CLIENT_KEY,
      urlOrMoniker,
      "getAccountsByOwner",
      owner,
      filter.programId,
      filter.ownerOffset,
      filter.dataSize,
      filter.memcmp,
      config?.commitment,
    ],
  });

  return {
    ...rest,
    accounts: data ?? [],
  } as Simplify<UseAccountsByOwnerResponse<TDecodedData> & typeof rest>;
}
