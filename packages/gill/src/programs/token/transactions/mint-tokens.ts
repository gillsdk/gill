import type {
  Address,
  TransactionMessageWithBlockhashLifetime,
  TransactionMessageWithFeePayer,
  TransactionSigner,
  TransactionVersion,
} from "@solana/kit";

import { checkedAddress, checkedTransactionSigner, createTransaction } from "../../../core";
import type { FullTransaction, Simplify } from "../../../types";
import { checkedTokenProgramAddress, getAssociatedTokenAccountAddress } from "../addresses";
import { getMintTokensInstructions, type GetMintTokensInstructionsArgs } from "../instructions/mint-tokens";
import type { TransactionBuilderInput } from "./types";

type GetCreateTokenTransactionInput = Simplify<
  Omit<GetMintTokensInstructionsArgs, "ata"> & Partial<Pick<GetMintTokensInstructionsArgs, "ata">>
>;

/**
 * Create a transaction that can mint tokens to the desired wallet/owner,
 * including creating their ATA if it does not exist
 *
 * The transaction has the following defaults:
 * - Default `version` = `legacy`
 * - Default `computeUnitLimit` = `31_000`
 *
 * @remarks
 *
 * - minting without creating the ata is generally < 10_000cu
 * - validating the ata onchain during creation results in a ~5000cu fluctuation
 *
 * @example
 * ```
 * const destination = address("nicktrLHhYzLmoVbuZQzHUTicd2sfP571orwo9jfc8c");
 *
 * const mint = address(...);
 * // or mint can be a keypair from a freshly created token
 *
 * const transaction = await buildMintTokensTransaction({
 *   feePayer: signer,
 *   latestBlockhash,
 *   mint,
 *   mintAuthority: signer,
 *   amount: 1000, // note: be sure to consider the mint's `decimals` value
 *   // if decimals=2 => this will mint 10.00 tokens
 *   // if decimals=4 => this will mint 0.100 tokens
 *   destination,
 *   // tokenProgram: TOKEN_PROGRAM_ADDRESS, // default
 *   // tokenProgram: TOKEN_2022_PROGRAM_ADDRESS,
 * });
 * ```
 */
export async function buildMintTokensTransaction<
  TVersion extends TransactionVersion = "legacy",
  TFeePayer extends TransactionSigner = TransactionSigner,
>(
  args: GetCreateTokenTransactionInput & TransactionBuilderInput<TVersion, TFeePayer>,
): Promise<FullTransaction<TVersion, TransactionMessageWithFeePayer>>;
export async function buildMintTokensTransaction<
  TVersion extends TransactionVersion = "legacy",
  TFeePayer extends TransactionSigner = TransactionSigner,
  TLifetimeConstraint extends
    TransactionMessageWithBlockhashLifetime["lifetimeConstraint"] = TransactionMessageWithBlockhashLifetime["lifetimeConstraint"],
>(
  args: GetCreateTokenTransactionInput & TransactionBuilderInput<TVersion, TFeePayer, TLifetimeConstraint>,
): Promise<FullTransaction<TVersion, TransactionMessageWithFeePayer, TransactionMessageWithBlockhashLifetime>>;
export async function buildMintTokensTransaction<
  TVersion extends TransactionVersion,
  TFeePayer extends TransactionSigner,
  TLifetimeConstraint extends TransactionMessageWithBlockhashLifetime["lifetimeConstraint"],
>(args: GetCreateTokenTransactionInput & TransactionBuilderInput<TVersion, TFeePayer, TLifetimeConstraint>) {
  args.tokenProgram = checkedTokenProgramAddress(args.tokenProgram);
  args.feePayer = checkedTransactionSigner(args.feePayer);
  args.mint = checkedAddress(args.mint);

  if (!args.ata) {
    args.ata = await getAssociatedTokenAccountAddress(args.mint, args.destination, args.tokenProgram);
  }

  // default a reasonably low computeUnitLimit based on simulation data
  if (!args.computeUnitLimit) {
    /**
     * for TOKEN_PROGRAM_ADDRESS and multiple simulation attempts,
     * minting tokens costs the following:
     * - when not creating the ata: 9156cu
     * - when creating the ata: 26535cu
     *
     * for TOKEN_2022_PROGRAM_ADDRESS and multiple simulation attempts,
     * minting tokens costs the following:
     * - when not creating the ata: 8978cu
     * - when creating the ata: 22567cu
     */
    args.computeUnitLimit = 31_000;
  }

  return createTransaction(
    (({ feePayer, version, computeUnitLimit, computeUnitPrice, latestBlockhash }: typeof args) => ({
      computeUnitLimit,
      computeUnitPrice,
      feePayer,
      instructions: getMintTokensInstructions(
        (({ tokenProgram, feePayer, mint, ata, mintAuthority, amount, destination }: typeof args) => ({
          amount,
          ata: ata as Address,
          destination,
          feePayer,
          mint,
          mintAuthority,
          tokenProgram,
        }))(args),
      ),
      latestBlockhash,
      version: version || "legacy",
    }))(args),
  );
}
