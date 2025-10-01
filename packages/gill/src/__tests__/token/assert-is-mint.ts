import type { Mint } from "@solana-program/token-2022";
import type { Account, Address, Lamports } from "@solana/kit";
import {
  SOLANA_ERROR__ACCOUNTS__ACCOUNT_NOT_FOUND,
  SOLANA_ERROR__ACCOUNTS__FAILED_TO_DECODE_ACCOUNT,
  SolanaError,
} from "@solana/kit";
import { assertIsMint } from "../../programs";

describe("assertIsMint", () => {
  it("should throw ACCOUNT_NOT_FOUND error when given an address", () => {
    const address = "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v" as Address;

    expect(() => assertIsMint(address)).toThrow(SolanaError);
    expect(() => assertIsMint(address)).toThrow(
      expect.objectContaining({
        context: expect.objectContaining({
          __code: SOLANA_ERROR__ACCOUNTS__ACCOUNT_NOT_FOUND,
          address: address,
        }),
      }),
    );
  });

  it("should throw FAILED_TO_DECODE_ACCOUNT error when account has no data property", () => {
    const invalidAccount = { address: "test" } as any;

    expect(() => assertIsMint(invalidAccount)).toThrow(SolanaError);
    expect(() => assertIsMint(invalidAccount)).toThrow(
      expect.objectContaining({
        context: expect.objectContaining({
          __code: SOLANA_ERROR__ACCOUNTS__FAILED_TO_DECODE_ACCOUNT,
        }),
      }),
    );
  });

  it("should throw FAILED_TO_DECODE_ACCOUNT error when account data has no mintAuthority property", () => {
    const invalidAccount = {
      address: "test" as Address,
      data: { someOtherProperty: true },
    } as any;

    expect(() => assertIsMint(invalidAccount)).toThrow(SolanaError);
    expect(() => assertIsMint(invalidAccount)).toThrow(
      expect.objectContaining({
        context: expect.objectContaining({
          __code: SOLANA_ERROR__ACCOUNTS__FAILED_TO_DECODE_ACCOUNT,
        }),
      }),
    );
  });

  it("should not throw when given a valid Mint account", () => {
    const validMintAccount: Account<Mint> = {
      address: "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v" as Address,
      data: {
        mintAuthority: "authority" as any,
        supply: 1000000n,
        decimals: 6,
        isInitialized: true,
        freezeAuthority: null as any,
        extensions: [] as any,
      },
      executable: false,
      lamports: 1461600n as Lamports,
      programAddress: "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA" as Address,
      space: 0n,
    };

    expect(() => assertIsMint(validMintAccount)).not.toThrow();
  });
});
