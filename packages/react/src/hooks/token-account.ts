"use client";

import { useQuery } from "@tanstack/react-query";
import { GILL_HOOK_CLIENT_KEY } from "../const.js";
import { useSolanaClient } from "./client.js";
import type { GillUseRpcHook } from "./types.js";

import type { Account, Address, FetchAccountConfig, Simplify } from "gill";
import { address, assertAccountExists, assertIsAddress, fetchEncodedAccount } from "gill";
import {
  checkedTokenProgramAddress,
  decodeToken,
  fetchMint,
  getAssociatedTokenAccountAddress,
  type Token,
} from "gill/programs";

type RpcConfig = Simplify<Omit<FetchAccountConfig, "abortSignal">>;

type UseTokenAccountResponse<TAddress extends Address = Address> = Simplify<
  Account<Token, TAddress> & {
    exists: true;
  }
>;

type TokenAccountInputWithDeclaredAta<TAddress extends Address = Address> = {
  /**
   * Address of the {@link https://solana.com/docs/tokens#associated-token-account | Token Account} to get and decode
   */
  ata: TAddress;
};

type TokenAccountInputWithDerivedAtaDetails = {
  /**
   * Address of the {@link https://solana.com/docs/tokens#token-account | Token Account}'s `owner`
   */
  owner: Address;
  /**
   * Address of the {@link https://solana.com/docs/tokens#token-account | Token Account}'s `mint`
   */
  mint: Address;
  /**
   * The {@link https://solana.com/docs/tokens#token-programs | Token Program} used to create the `mint`
   *
   * If no `tokenProgram` is provided, the hook will automatically fetch the
   * {@link https://solana.com/docs/tokens#mint-account | Mint account} to retrieve the correct Token Program address
   */
  tokenProgram?: Address;
};

type UseTokenAccountInput<
  TConfig extends RpcConfig = RpcConfig,
  TAddress extends Address = Address,
> = GillUseRpcHook<TConfig> & (TokenAccountInputWithDeclaredAta<TAddress> | TokenAccountInputWithDerivedAtaDetails);

function hasDeclaredAta(
  input: TokenAccountInputWithDeclaredAta | TokenAccountInputWithDerivedAtaDetails,
): input is TokenAccountInputWithDeclaredAta {
  return (input as TokenAccountInputWithDeclaredAta).ata !== undefined;
}

/**
 * Get and parse an owner's {@link https://solana.com/docs/tokens#token-account | Token account} for a
 * {@link https://solana.com/docs/tokens#mint-account | Mint} and {@link https://solana.com/docs/tokens#token-programs | Token Program}
 */
export function useTokenAccount<TConfig extends RpcConfig = RpcConfig, TAddress extends Address = Address>({
  options,
  config,
  abortSignal,
  // tokenProgram,
  ...tokenAccountOptions
}: UseTokenAccountInput<TConfig, TAddress>) {
  const { rpc } = useSolanaClient();

  if (abortSignal) {
    // @ts-expect-error the `abortSignal` was stripped from the type but is now being added back in
    config = {
      ...(config || {}),
      abortSignal,
    };
  }

  const { data, ...rest } = useQuery({
    networkMode: "offlineFirst",
    ...options,
    enabled: hasDeclaredAta(tokenAccountOptions)
      ? !!tokenAccountOptions.ata
      : Boolean(tokenAccountOptions.mint && tokenAccountOptions.owner),
    queryFn: async () => {
      let ata: Address;

      if (hasDeclaredAta(tokenAccountOptions)) {
        // if the user manually provides the ata, we will use that
        ata = tokenAccountOptions.ata;
      } else {
        // auto fetch the token program address if not provided
        if (!tokenAccountOptions.tokenProgram) {
          const mint = await fetchMint(rpc, address(tokenAccountOptions.mint));
          tokenAccountOptions.tokenProgram = mint.programAddress;
        }

        checkedTokenProgramAddress(tokenAccountOptions.tokenProgram);

        ata = await getAssociatedTokenAccountAddress(
          tokenAccountOptions.mint,
          tokenAccountOptions.owner,
          tokenAccountOptions.tokenProgram,
        );
      }

      assertIsAddress(ata);
      const account = await fetchEncodedAccount(rpc, ata, config);
      assertAccountExists(account);
      return decodeToken(account);
    },
    queryKey: [
      GILL_HOOK_CLIENT_KEY,
      "getTokenAccount",
      hasDeclaredAta(tokenAccountOptions)
        ? [{ ata: tokenAccountOptions.ata }]
        : [
            {
              mint: tokenAccountOptions.mint,
              owner: tokenAccountOptions.owner,
            },
          ],
    ],
  });

  return {
    ...rest,
    account: data as UseTokenAccountResponse<TAddress>,
  };
}
