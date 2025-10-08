import type { Address, Instruction, TransactionSigner } from "@solana/kit";
import { getCreateAssociatedTokenIdempotentInstruction, getTransferInstruction } from "@solana-program/token-2022";

import { checkedAddress, checkedTransactionSigner } from "../../../core";
import { checkedTokenProgramAddress } from "../addresses";
import type { TokenInstructionBase } from "./types";

export type GetTransferTokensInstructionsArgs = TokenInstructionBase & {
  /** Amount of tokens to be transferred to the `destination` via their `destinationAta` */
  amount: bigint | number;
  /**
   * The source account's owner/delegate or its multi-signature account:
   * - this should normally by a `TransactionSigner`
   * - only for multi-sig authorities (like Squads Protocol), should you supply an `Address`
   * */
  authority: Address | TransactionSigner;
  /** Wallet address to receive the tokens, via their associated token account: `destinationAta` */
  destination: Address | TransactionSigner;
  /**
   * Associated token account (ata) address for `destination` and this `mint`
   *
   * See {@link getAssociatedTokenAccountAddress}
   *
   * @example
   * ```
   * getAssociatedTokenAccountAddress(mint, destination, tokenProgram);
   * ```
   * */
  destinationAta: Address;
  /**
   * Associated token account (ata) address for `authority` and this `mint`
   *
   * See {@link getAssociatedTokenAccountAddress}
   *
   * @example
   * ```
   * getAssociatedTokenAccountAddress(mint, authority, tokenProgram);
   * ```
   * */
  sourceAta: Address;
};

/**
 * Create the instructions required to transfer tokens from one wallet to another,
 * including creating the destination ATA if it does not exist
 *
 * @example
 *
 * ```
 * const sourceAta = await getAssociatedTokenAccountAddress(mint, authority, tokenProgram);
 *
 * const destination = address(...);
 * const destinationAta = await getAssociatedTokenAccountAddress(mint, destination, tokenProgram);
 *
 * const instructions = getTransferTokensInstructions({
 *    feePayer: signer,
 *    mint,
 *    amount: 10,
 *    authority: signer, // the source wallet for the tokens to be transferred
 *    sourceAta, // normally derived from the `authority`
 *    destination,
 *    destinationAta, // derived from the `destination`
 *    tokenProgram,
 * });
 * ```
 */
export function getTransferTokensInstructions(args: GetTransferTokensInstructionsArgs): Instruction[] {
  args.tokenProgram = checkedTokenProgramAddress(args.tokenProgram);
  args.feePayer = checkedTransactionSigner(args.feePayer);
  args.mint = checkedAddress(args.mint);

  return [
    // create idempotent will gracefully fail if the ata already exists. this is the gold standard!
    getCreateAssociatedTokenIdempotentInstruction({
      ata: args.destinationAta,
      mint: args.mint,
      owner: checkedAddress(args.destination),
      payer: args.feePayer,
      tokenProgram: args.tokenProgram,
    }),
    getTransferInstruction(
      {
        amount: args.amount,
        authority: args.authority,
        destination: args.destinationAta,
        source: args.sourceAta,
      },
      {
        programAddress: args.tokenProgram,
      },
    ),
  ];
}
