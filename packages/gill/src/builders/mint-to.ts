import type { Address, Instruction, TransactionSigner } from "@solana/kit";
import { getAssociatedTokenAccountAddress, TOKEN_2022_PROGRAM_ADDRESS } from "../programs/token";
import { getMintTokensInstructions } from "../programs/token/instructions/mint-tokens";

export type MintToArgs = {
  /**
   * The token mint account.
   *
   * This should be the `PublicKey` or `TransactionSigner` of the token mint.
   */
  mint: Address;

  /**
   * The wallet address to receive the tokens being minted,
   * via their associated token account (ATA).
   *
   * - Defaults to also being used as the fee payer
   * - Defaults to also being used as the mint authority
   */
  toOwner: TransactionSigner;

  /**
   * Amount of tokens to mint to the `toOwner` via their ATA.
   *
   * Be sure to consider the mint’s `decimals` value.
   *
   * - If `decimals = 2` → `amount: 1000` will mint `10.00` tokens.
   * - If `decimals = 4` → `amount: 1000` will mint `0.1000` tokens.
   */
  amount: bigint | number;
};

/**
 * Create the instructions required to mint tokens to any wallet/owner.
 *
 * This is a simplified wrapper around {@link getMintTokensInstructions}.
 * It automatically:
 * - Derives the recipient’s associated token account (ATA).
 * - Sets the fee payer to the recipient (`toOwner`).
 * - Sets the mint authority to the recipient (`toOwner`).
 * - Uses the `TOKEN_2022_PROGRAM_ADDRESS` by default.
 *
 * @example
 * ```ts
 * const mint = await generateKeyPairSigner();    // the mint account
 * const user = await generateKeyPairSigner();    // wallet receiving tokens
 *
 * const instructions = await mintTo({
 *   mint,
 *   toOwner: user,
 *   amount: 1000, // raw units, depends on mint decimals
 * });
 *
 * // Add to a transaction and send:
 * const tx = new Transaction().add(...instructions);
 * const sig = await sendAndConfirmTransaction(tx, [user]);
 * console.log("Minted tokens with signature:", sig);
 * ```
 */
export async function mintTo({
  mint,
  toOwner,
  amount,
}: MintToArgs): Promise<Instruction[]> {
  const ata = await getAssociatedTokenAccountAddress(
    mint,
    toOwner,
    TOKEN_2022_PROGRAM_ADDRESS,
  );

  return getMintTokensInstructions({
    mint,
    feePayer: toOwner,
    mintAuthority: toOwner,
    destination: toOwner,
    ata,
    amount,
    tokenProgram: TOKEN_2022_PROGRAM_ADDRESS,
  });
}
