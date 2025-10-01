import type { Mint, Token } from "@solana-program/token-2022";
import { decodeToken, fetchMint } from "@solana-program/token-2022";
import type { Account, Address, GetAccountInfoApi, GetTokenAccountsByOwnerApi, Rpc } from "@solana/kit";
import { isAddress, parseBase64RpcAccount } from "@solana/kit";
import type { Simplify } from "../../types";
import { assertIsMint } from "./mint.js";

type OriginalConfigParam = NonNullable<Parameters<GetTokenAccountsByOwnerApi["getTokenAccountsByOwner"]>[2]>;

export type FetchTokenAccountsConfig = Simplify<
  Omit<OriginalConfigParam, "encoding"> & {
    abortSignal?: AbortSignal;
  }
>;

/**
 * Fetch all the the token accounts for a given `mint` and `owner` Address. Automatically fetching
 * the Mint account itself and calculating the total balance of all the `owner`'s token accounts.
 *
 * @example
 * ```typescript
 * const { mint, accounts, totalBalance } = await fetchTokenAccounts(
 *    rpc,
 *    "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v" as Address, // (mint for USDC on mainnet)
 *    "nick6zJc6HpW3kfBm4xS2dmbuVRyb5F3AnUvj5ymzR5" as Address, // owner address
 * );
 * ```
 */
export async function fetchTokenAccounts<TMintAddress extends string = string, TOwner extends string = string>(
  rpc: Rpc<GetTokenAccountsByOwnerApi & GetAccountInfoApi>,
  mint: Address<TMintAddress> | Account<Mint>,
  owner: Address<TOwner>,
  config: FetchTokenAccountsConfig = {},
): Promise<{ accounts: Account<Token>[]; mint: Account<Mint>; totalBalance: bigint }> {
  if (isAddress(mint as Address)) mint = await fetchMint(rpc, mint as Address);
  assertIsMint(mint);
  const { abortSignal, ...rpcConfig } = config;
  const { value } = await rpc
    .getTokenAccountsByOwner(owner, { mint: mint.address }, { ...rpcConfig, encoding: "base64" })
    .send({ abortSignal });
  let totalBalance: bigint = 0n;
  const accounts = value.map((account) => {
    const decoded = decodeToken(parseBase64RpcAccount(account.pubkey, account.account));
    totalBalance += decoded.data.amount;
    return decoded;
  });
  return {
    mint,
    totalBalance,
    accounts,
  };
}
