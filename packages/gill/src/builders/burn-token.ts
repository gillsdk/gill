import type { Address, Instruction, TransactionSigner } from "gill";
import { getBurnInstruction } from "../programs/token";

export type BurnTokenArgs = {
  /**
   * The token account holding the tokens to burn.
   *
   * This should be the associated token account (ATA) for the given `mint` and `owner`.
   */
  account: Address;

  /**
   * The mint address of the token being burned.
   */
  mint: Address;

  /**
   * The authority allowed to burn tokens from the `account`.
   *
   * Typically the wallet that owns the `account`.
   */
  owner: TransactionSigner;

  /**
   * Amount of tokens to burn from the account (raw units).
   *
   * Be sure to scale according to the mint’s decimals.
   *
   * Example:
   * - If `decimals = 2` → `amount: 1000` burns 10.00 tokens.
   * - If `decimals = 4` → `amount: 1000` burns 0.1000 tokens.
   */
  amount: bigint | number;
};

/**
 * Create the instruction required to burn tokens from a given account.
 *
 * This is a simplified wrapper around {@link getBurnInstruction}.
 *
 * @example
 * ```ts
 * const burnIx = burnToken({
 *   account: userAta,     // ATA holding the tokens
 *   mint: mintPubkey,     // token mint
 *   owner: user,          // signer who owns the ATA
 *   amount: 1000n,        // raw units (scaled by decimals)
 * });
 *
 * const tx = new Transaction().add(burnIx);
 * const sig = await sendAndConfirmTransaction(tx, [user]);
 * console.log("Burned tokens with signature:", sig);
 * ```
 */
export function burnToken({
  account,
  mint,
  owner,
  amount,
}: BurnTokenArgs): Instruction {
  return getBurnInstruction({
    account,
    mint,
    authority: owner,
    amount,
  });
}
