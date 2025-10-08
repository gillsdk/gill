import { type Address, isAddress, type TransactionSigner } from "@solana/kit";
import { findAssociatedTokenPda, TOKEN_2022_PROGRAM_ADDRESS } from "@solana-program/token-2022";

import { checkedAddress } from "../../core/utils";

export type LegacyTokenProgramMonikers = "legacy" | "token";

export type TokenExtensionProgramMonikers = "token22" | "token2022" | "tokenExtension" | "tokenExtensions";

export type TokenProgramMonikers = LegacyTokenProgramMonikers | TokenExtensionProgramMonikers;

export const TOKEN_PROGRAM_ADDRESS =
  "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA" as Address<"TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA">;

/**
 * Derive the associated token account (ata) address for an owner and mint/tokenProgram
 *
 * @argument `mint` - the token mint itself
 * @argument `owner` - destination wallet address to own tokens from `mint`
 * @argument `tokenProgram` - token program that the token `mint` was created with
 *
 * - (default) {@link TOKEN_PROGRAM_ADDRESS} - the original SPL Token Program
 * - {@link TOKEN_2022_PROGRAM_ADDRESS} - the SPL Token Extensions Program (aka Token22)
 */
export async function getAssociatedTokenAccountAddress(
  mint: Address | TransactionSigner,
  owner: Address | TransactionSigner,
  tokenProgram?: Address,
): Promise<Address> {
  return (
    await findAssociatedTokenPda({
      mint: checkedAddress(mint),
      owner: checkedAddress(owner),
      tokenProgram: checkedTokenProgramAddress(tokenProgram),
    })
  )[0];
}

export function parseTokenProgramAddressOrMoniker(tokenProgram: Address | TokenProgramMonikers): Address {
  if (!isAddress(tokenProgram)) {
    tokenProgram = tokenProgram.toLowerCase() as TokenProgramMonikers;
  }
  switch (tokenProgram) {
    case "legacy":
    case "token":
    case TOKEN_PROGRAM_ADDRESS: {
      return TOKEN_PROGRAM_ADDRESS;
    }
    case "token22":
    case "token2022":
    case "tokenextension":
    case "tokenextensions":
    case TOKEN_2022_PROGRAM_ADDRESS: {
      return TOKEN_2022_PROGRAM_ADDRESS;
    }
    default:
      throw Error("Unsupported token program. Try 'TOKEN_PROGRAM_ADDRESS' or 'TOKEN_2022_PROGRAM_ADDRESS'");
  }
}

export function assertIsSupportedTokenProgram(
  tokenProgram: Address,
): asserts tokenProgram is Address<typeof tokenProgram> {
  if (tokenProgram !== TOKEN_PROGRAM_ADDRESS && tokenProgram !== TOKEN_2022_PROGRAM_ADDRESS) {
    throw Error("Unsupported token program. Try 'TOKEN_PROGRAM_ADDRESS' or 'TOKEN_2022_PROGRAM_ADDRESS'");
  }
}

/**
 * Check the provided program is one of the supported token programs.
 * Including setting the default to {@link TOKEN_PROGRAM_ADDRESS} (the original SPL token program)
 *
 * @example
 * ```
 * args.tokenProgram = checkedTokenProgramAddress(args.tokenProgram);
 * ```
 */
export function checkedTokenProgramAddress(tokenProgram?: Address | TokenProgramMonikers): Address {
  if (!tokenProgram) return TOKEN_PROGRAM_ADDRESS;
  tokenProgram = parseTokenProgramAddressOrMoniker(tokenProgram);
  assertIsSupportedTokenProgram(tokenProgram);
  return tokenProgram;
}
