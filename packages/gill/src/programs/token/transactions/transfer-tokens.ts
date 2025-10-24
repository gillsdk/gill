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
import { getTransferTokensInstructions, type GetTransferTokensInstructionsArgs } from "../instructions";
import type { TransactionBuilderInput } from "./types";

type GetTransferTokensTransactionInput = Simplify<
  Omit<GetTransferTokensInstructionsArgs, "destinationAta" | "sourceAta"> &
    Partial<Pick<GetTransferTokensInstructionsArgs, "destinationAta" | "sourceAta">>
>;

/**
 * Create a transaction that can transfer tokens to the desired wallet/owner,
 * including creating their ATA if it does not exist
 *
 * The transaction has the following defaults:
 * - Default `version` = `legacy`
 * - Default `computeUnitLimit` = `31_000`
 *
 * @remarks
 *
 * - transferring without creating the ata is generally < 10_000cu
 * - validating the ata onchain during creation results in a ~15000cu fluctuation
 *
 * @example
 * ```
 * const destination = address(...);
 *
 * const transferTokensTx = await buildTransferTokensTransaction({
 *   feePayer: signer,
 *   latestBlockhash,
 *   mint,
 *   authority: signer,
 *   amount: 900, // note: be sure to consider the mint's `decimals` value
 *   // if decimals=2 => this will transfer 9.00 tokens
 *   // if decimals=4 => this will transfer 0.090 tokens
 *   destination,
 *   // use the correct token program for the `mint`
 *   tokenProgram, // default=TOKEN_PROGRAM_ADDRESS
 *   // default cu limit set to be optimized, but can be overridden here
 *   // computeUnitLimit?: number,
 *   // obtain from your favorite priority fee api
 *   // computeUnitPrice?: number, // no default set
 * });
 * ```
 */
export async function buildTransferTokensTransaction<
  TVersion extends TransactionVersion = "legacy",
  TFeePayer extends TransactionSigner = TransactionSigner,
>(
  args: GetTransferTokensTransactionInput & TransactionBuilderInput<TVersion, TFeePayer>,
): Promise<FullTransaction<TVersion, TransactionMessageWithFeePayer>>;
export async function buildTransferTokensTransaction<
  TVersion extends TransactionVersion = "legacy",
  TFeePayer extends TransactionSigner = TransactionSigner,
  TLifetimeConstraint extends
    TransactionMessageWithBlockhashLifetime["lifetimeConstraint"] = TransactionMessageWithBlockhashLifetime["lifetimeConstraint"],
>(
  args: GetTransferTokensTransactionInput & TransactionBuilderInput<TVersion, TFeePayer, TLifetimeConstraint>,
): Promise<FullTransaction<TVersion, TransactionMessageWithFeePayer, TransactionMessageWithBlockhashLifetime>>;
export async function buildTransferTokensTransaction<
  TVersion extends TransactionVersion,
  TFeePayer extends Address | TransactionSigner,
  TLifetimeConstraint extends TransactionMessageWithBlockhashLifetime["lifetimeConstraint"],
>(args: GetTransferTokensTransactionInput & TransactionBuilderInput<TVersion, TFeePayer, TLifetimeConstraint>) {
  args.tokenProgram = checkedTokenProgramAddress(args.tokenProgram);
  args.feePayer = checkedTransactionSigner(args.feePayer);
  args.mint = checkedAddress(args.mint);

  [args.destinationAta, args.sourceAta] = await Promise.all([
    !args.destinationAta
      ? getAssociatedTokenAccountAddress(args.mint, args.destination, args.tokenProgram)
      : args.destinationAta,
    !args.sourceAta ? getAssociatedTokenAccountAddress(args.mint, args.authority, args.tokenProgram) : args.sourceAta,
  ]);

  // default a reasonably low computeUnitLimit based on simulation data
  if (!args.computeUnitLimit) {
    /**
     * for TOKEN_PROGRAM_ADDRESS and multiple simulation attempts,
     * minting tokens costs the following:
     * - when not creating the ata: 6336cu - 12336cu
     * - when creating the ata: 19428cu - 25034cu
     *
     * for TOKEN_2022_PROGRAM_ADDRESS and multiple simulation attempts,
     * minting tokens costs the following:
     * - when not creating the ata: 6157cu - 15157cu
     * - when creating the ata: 18722cu - 27722cu
     */
    args.computeUnitLimit = 31_000;
  }

  return createTransaction(
    (({ feePayer, version, computeUnitLimit, computeUnitPrice, latestBlockhash }: typeof args) => ({
      computeUnitLimit,
      computeUnitPrice,
      feePayer,
      instructions: getTransferTokensInstructions(
        (({
          tokenProgram,
          feePayer,
          mint,
          amount,
          destination,
          authority,
          destinationAta,
          sourceAta,
        }: typeof args) => ({
          amount,
          authority,
          destination,
          destinationAta: destinationAta as Address,
          feePayer,
          mint,
          sourceAta: sourceAta as Address,
          tokenProgram,
        }))(args),
      ),
      latestBlockhash,
      version: version || "legacy",
    }))(args),
  );
}
