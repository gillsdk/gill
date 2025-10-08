import { Address } from "@solana/kit";
import { TOKEN_2022_PROGRAM_ADDRESS } from "@solana-program/token-2022";

import {
  assertIsSupportedTokenProgram,
  checkedTokenProgramAddress,
  parseTokenProgramAddressOrMoniker,
  TOKEN_PROGRAM_ADDRESS,
} from "../programs/token";

describe("parseTokenProgramAddressOrMoniker", () => {
  it("should return TOKEN_PROGRAM_ADDRESS for 'legacy' moniker", () => {
    const result = parseTokenProgramAddressOrMoniker("legacy");
    expect(result).toBe(TOKEN_PROGRAM_ADDRESS);
  });

  it("should return TOKEN_PROGRAM_ADDRESS for 'token' moniker", () => {
    const result = parseTokenProgramAddressOrMoniker("token");
    expect(result).toBe(TOKEN_PROGRAM_ADDRESS);
  });

  it("should return TOKEN_PROGRAM_ADDRESS for direct address", () => {
    const result = parseTokenProgramAddressOrMoniker(TOKEN_PROGRAM_ADDRESS);
    expect(result).toBe(TOKEN_PROGRAM_ADDRESS);
  });

  it("should return TOKEN_2022_PROGRAM_ADDRESS for 'token22' moniker", () => {
    const result = parseTokenProgramAddressOrMoniker("token22");
    expect(result).toBe(TOKEN_2022_PROGRAM_ADDRESS);
  });

  it("should return TOKEN_2022_PROGRAM_ADDRESS for 'token2022' moniker", () => {
    const result = parseTokenProgramAddressOrMoniker("token2022");
    expect(result).toBe(TOKEN_2022_PROGRAM_ADDRESS);
  });

  it("should return TOKEN_2022_PROGRAM_ADDRESS for 'tokenExtension' moniker", () => {
    const result = parseTokenProgramAddressOrMoniker("tokenExtension");
    expect(result).toBe(TOKEN_2022_PROGRAM_ADDRESS);
  });

  it("should return TOKEN_2022_PROGRAM_ADDRESS for 'tokenExtensions' moniker", () => {
    const result = parseTokenProgramAddressOrMoniker("tokenExtensions");
    expect(result).toBe(TOKEN_2022_PROGRAM_ADDRESS);
  });

  it("should handle case insensitivity for monikers", () => {
    const result = parseTokenProgramAddressOrMoniker("TOKEN22" as any);
    const result2 = parseTokenProgramAddressOrMoniker("tokenextension" as any);
    const result3 = parseTokenProgramAddressOrMoniker("tokenextensions" as any);
    const result4 = parseTokenProgramAddressOrMoniker("LEGACY" as any);
    expect(result).toBe(TOKEN_2022_PROGRAM_ADDRESS);
    expect(result2).toBe(TOKEN_2022_PROGRAM_ADDRESS);
    expect(result3).toBe(TOKEN_2022_PROGRAM_ADDRESS);
    expect(result4).toBe(TOKEN_PROGRAM_ADDRESS);
  });

  it("should throw error for unsupported token program", () => {
    expect(() => {
      parseTokenProgramAddressOrMoniker("unsupported" as any);
    }).toThrow("Unsupported token program");
  });
});

describe("assertIsSupportedTokenProgram", () => {
  it("should not throw for TOKEN_PROGRAM_ADDRESS", () => {
    expect(() => {
      assertIsSupportedTokenProgram(TOKEN_PROGRAM_ADDRESS);
    }).not.toThrow();
  });

  it("should not throw for TOKEN_2022_PROGRAM_ADDRESS", () => {
    expect(() => {
      assertIsSupportedTokenProgram(TOKEN_2022_PROGRAM_ADDRESS);
    }).not.toThrow();
  });

  it("should throw for unsupported address", () => {
    expect(() => {
      assertIsSupportedTokenProgram("unsupported-address" as Address);
    }).toThrow("Unsupported token program");
  });
});

describe("checkedTokenProgramAddress", () => {
  it("should return TOKEN_PROGRAM_ADDRESS when no program is provided", () => {
    const result = checkedTokenProgramAddress();
    expect(result).toBe(TOKEN_PROGRAM_ADDRESS);
  });

  it("should return TOKEN_PROGRAM_ADDRESS for 'legacy' moniker", () => {
    const result = checkedTokenProgramAddress("legacy");
    expect(result).toBe(TOKEN_PROGRAM_ADDRESS);
  });

  it("should return TOKEN_2022_PROGRAM_ADDRESS for 'token22' moniker", () => {
    const result = checkedTokenProgramAddress("token22");
    expect(result).toBe(TOKEN_2022_PROGRAM_ADDRESS);
  });

  it("should pass through valid address", () => {
    const result = checkedTokenProgramAddress(TOKEN_PROGRAM_ADDRESS);
    expect(result).toBe(TOKEN_PROGRAM_ADDRESS);
  });

  it("should throw for unsupported token program", () => {
    expect(() => {
      checkedTokenProgramAddress("unsupported" as any);
    }).toThrow("Unsupported token program");
  });
});
