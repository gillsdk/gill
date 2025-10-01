import type { Mint } from "@solana-program/token-2022";
import type { Account, Address } from "@solana/kit";
import {
  isAddress,
  SOLANA_ERROR__ACCOUNTS__ACCOUNT_NOT_FOUND,
  SOLANA_ERROR__ACCOUNTS__FAILED_TO_DECODE_ACCOUNT,
  SolanaError,
} from "@solana/kit";

export function assertIsMint<TAddress extends string = string>(
  accountOrAddress: Account<Mint, TAddress> | Address<TAddress>,
): asserts accountOrAddress is Account<Mint, TAddress> {
  if (isAddress(accountOrAddress as Address)) {
    throw new SolanaError(SOLANA_ERROR__ACCOUNTS__ACCOUNT_NOT_FOUND, { address: accountOrAddress as Address });
  }

  if ("data" in accountOrAddress === false || "mintAuthority" in accountOrAddress.data === false) {
    throw new SolanaError(SOLANA_ERROR__ACCOUNTS__FAILED_TO_DECODE_ACCOUNT, { address: accountOrAddress as Address });
  }
}
