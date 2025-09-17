"use client";

import { useQuery } from "@tanstack/react-query";
import type { Account, Address, FetchAccountConfig, Simplify } from "gill";
import type { Token } from "gill/programs/token";
import { decodeToken, TOKEN_PROGRAM_ADDRESS } from "gill/programs/token";
import { GILL_HOOK_CLIENT_KEY } from "../const";
import { useSolanaClient } from "./client";
import type { GillUseRpcHook } from "./types";

type RpcConfig = Simplify<Omit<FetchAccountConfig, "abortSignal">>;

/**
 * Utility type for accounts that exist on-chain
 */
type ExistingAccount<TData extends object | Uint8Array, TAddress extends Address = Address> = Account<
  TData,
  TAddress
> & { exists: true };

/**
 * Token account with its associated token account address
 */
type TokenAccountWithAddress<TAddress extends Address = Address> = {
  /**
   * The token account data
   */
  account: ExistingAccount<Token, TAddress>;
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
    queryFn: async (): Promise<TokenAccountsQueryResult<Address>> => {
      const allAccounts: TokenAccountWithAddress<Address>[] = [];

      const filter = tokenMint ? { mint: tokenMint } : { programId: TOKEN_PROGRAM_ADDRESS };

      const response = await rpc.getTokenAccountsByOwner(owner, filter, { encoding: "base64", ...config }).send();

      for (const accountInfo of response.value) {
        const rawAccount: ExistingAccount<Uint8Array, Address> = {
          address: accountInfo.pubkey,
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

        const tokenAccount: ExistingAccount<Token, Address> = {
          ...decodedAccount,
          exists: true,
        };

        allAccounts.push({
          account: tokenAccount,
          address: accountInfo.pubkey,
        });
      }

      return {
        accounts: allAccounts,
        total: allAccounts.length,
      };
    },
    queryKey: [GILL_HOOK_CLIENT_KEY, "getTokenAccountsByOwner", owner, tokenMint, includeZeroBalance],
  });

  return {
    ...rest,
    accounts: (data as TokenAccountsQueryResult<TAddress> | undefined)?.accounts || [],
  };
}
