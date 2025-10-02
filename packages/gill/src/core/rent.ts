/**
 * Calculate the total rent needed for to create an account, with or without extra data stored in it
 */
export function getMinimumBalanceForRentExemption(space: bigint | number = 0) {
  /**
   * Default values for Rent calculations
   *
   * Values taken from: https://github.com/anza-xyz/solana-sdk/blob/c07f692e41d757057c8700211a9300cdcd6d33b1/rent/src/lib.rs#L93-L97
   *
   */
  const RENT = {
    /**
     * Account storage overhead for calculation of base rent. (aka the number of bytes required to store an account with no data.
     */
    ACCOUNT_STORAGE_OVERHEAD: 128n,
    /**
     * Amount of time (in years) a balance must include rent for the account to
     * be rent exempt.
     */
    DEFAULT_EXEMPTION_THRESHOLD: BigInt(Math.floor(2.0 * 1000)) / 1000n,
    /**
     * Default rental rate in lamports/byte-year. This calculation is based on:
     * - 10^9 lamports per SOL
     * - $1 per SOL
     * - $0.01 per megabyte day
     * - $3.65 per megabyte year
     */
    DEFAULT_LAMPORTS_PER_BYTE_YEAR: BigInt(Math.floor(((1_000_000_000 / 100) * 365) / (1024 * 1024))),
  };

  return (
    ((RENT.ACCOUNT_STORAGE_OVERHEAD + BigInt(space)) *
      RENT.DEFAULT_LAMPORTS_PER_BYTE_YEAR *
      RENT.DEFAULT_EXEMPTION_THRESHOLD) /
    1n
  );
}
