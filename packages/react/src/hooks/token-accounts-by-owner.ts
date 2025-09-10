"use client";

import type { Account, Address, FetchAccountConfig, Simplify } from "gill";
import type { Token } from "gill/programs/token";
import { decodeToken, TOKEN_PROGRAM_ADDRESS } from "gill/programs/token";
import { useQuery } from "@tanstack/react-query";
import { GILL_HOOK_CLIENT_KEY } from "../const";
import { useSolanaClient } from "./client";
import type { GillUseRpcHook } from "./types";

type RpcConfig = Simplify<Omit<FetchAccountConfig, "abortSignal">>;

/**
 * Token account with its associated token account address
 */
type TokenAccountWithAddress<TAddress extends Address = Address> = {
  /**
   * The token account data
   */
  account: Account<Token, TAddress> & { exists: true };
  /**
   * The address of the token account
   */
  address: TAddress;
};

/**
 * Response type for the token accounts query
 */
type TokenAccountsQueryResult<TAddress extends Address = Address> = {
  accounts: TokenAccountWithAddress<TAddress>[];
  total: number;
};

/**
 * Input parameters for fetching token accounts by owner with optional filtering
 */
type UseTokenAccountsByOwnerInput<TConfig extends RpcConfig = RpcConfig> = GillUseRpcHook<TConfig> & {
  /**
   * Whether to include accounts with zero balance
   * @default true
   */
  includeZeroBalance?: boolean;
  /**
   * The owner address to fetch token accounts for
   */
  owner: Address;
  /**
   * Optional specific token mint to filter by.
   * If provided, only returns accounts for this specific token.
   * If not provided, returns all token accounts from the legacy token program.
   */
  tokenMint?: Address;
};

/**
 * Get token accounts owned by a specific address.
 *
 * - If no `tokenMint` is provided: returns all token accounts from the legacy token program
 * - If `tokenMint` is provided: returns only accounts for that specific token mint
 *
 * @example
 * ```tsx
 * // Get all legacy token accounts for an owner
 * const { accounts } = useTokenAccountsByOwner({ owner: ownerAddress });
 *
 * // Get token accounts for a specific mint (e.g., USDC)
 * const { accounts } = useTokenAccountsByOwner({
 *   owner: ownerAddress,
 *   tokenMint: "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v" // USDC
 * });
 * ```
 */
export function useTokenAccountsByOwner<TConfig extends RpcConfig = RpcConfig, TAddress extends Address = Address>({
  options,
  config,
  abortSignal,
  owner,
  tokenMint,
  includeZeroBalance = true,
}: UseTokenAccountsByOwnerInput<TConfig>) {
  const { rpc } = useSolanaClient();

  if (abortSignal) {
    // @ts-expect-error the `abortSignal` was stripped from the type but is now being added back in
    config = {
      ...(config || {}),
      abortSignal,
    };
  }

  const { data, ...rest } = useQuery({
    ...options,
    enabled: !!owner,
    queryFn: async (): Promise<TokenAccountsQueryResult<TAddress>> => {
      const allAccounts: TokenAccountWithAddress<TAddress>[] = [];

      try {
        let filter;
        if (tokenMint) {
          filter = { mint: tokenMint };
        } else {
          filter = { programId: TOKEN_PROGRAM_ADDRESS };
        }

        const response = await rpc.getTokenAccountsByOwner(owner, filter, { encoding: "base64", ...config }).send();

        for (const accountInfo of response.value) {
          try {
            const rawAccount: Account<Uint8Array, TAddress> & { exists: true } = {
              address: accountInfo.pubkey as TAddress,
              data: new Uint8Array(Buffer.from(accountInfo.account.data[0], "base64")),
              executable: accountInfo.account.executable,
              exists: true,
              lamports: accountInfo.account.lamports,
              programAddress: accountInfo.account.owner,
              space: accountInfo.account.space,
            };

            const decodedAccount = decodeToken(rawAccount);

            if (!includeZeroBalance && decodedAccount.data.amount === 0n) {
              continue;
            }

            allAccounts.push({
              account: decodedAccount as Account<Token, TAddress> & { exists: true },
              address: accountInfo.pubkey as TAddress,
            });
          } catch (decodeError) {
            console.warn(`Failed to decode token account ${accountInfo.pubkey}:`, decodeError);
          }
        }
      } catch (queryError) {
        console.warn(`Failed to query token accounts:`, queryError);
        throw queryError;
      }

      return {
        accounts: allAccounts,
        total: allAccounts.length,
      } satisfies TokenAccountsQueryResult<TAddress>;
    },
    queryKey: [GILL_HOOK_CLIENT_KEY, "getTokenAccountsByOwner", owner, tokenMint, includeZeroBalance],
  });

  return {
    ...rest,
    accounts: (data as TokenAccountsQueryResult<TAddress> | undefined)?.accounts || [],
    total: (data as TokenAccountsQueryResult<TAddress> | undefined)?.total || 0,
  };
}
