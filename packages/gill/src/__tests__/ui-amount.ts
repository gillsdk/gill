import { tokenAmountToUiAmount, tokenUiAmountToAmount } from "../programs/token";

describe("Token Amount Conversion Functions", () => {
  describe("tokenUiAmountToAmount", () => {
    it("converts whole numbers correctly", () => {
      expect(tokenUiAmountToAmount(1, 6)).toBe(1000000n);
      expect(tokenUiAmountToAmount(100, 9)).toBe(100000000000n);
      expect(tokenUiAmountToAmount(0, 6)).toBe(0n);
    });

    it("converts decimal numbers correctly", () => {
      expect(tokenUiAmountToAmount(1.5, 6)).toBe(1500000n);
      expect(tokenUiAmountToAmount(0.05, 6)).toBe(50000n);
      expect(tokenUiAmountToAmount(0.000001, 6)).toBe(1n);
    });

    it("handles more decimal places than specified", () => {
      expect(tokenUiAmountToAmount(1.123456789, 6)).toBe(1123457n);
      expect(tokenUiAmountToAmount(0.0000019999, 6)).toBe(2n);
    });

    it("handles fewer decimal places than specified", () => {
      expect(tokenUiAmountToAmount(1.1, 6)).toBe(1100000n);
      expect(tokenUiAmountToAmount(1.1, 9)).toBe(1100000000n);
    });

    it("handles large numbers correctly", () => {
      expect(tokenUiAmountToAmount(123456789, 6)).toBe(123456789000000n);
      expect(tokenUiAmountToAmount(987654321.123456, 6)).toBe(987654321123456n);
    });

    it("handles very small decimals correctly", () => {
      expect(tokenUiAmountToAmount(0.000000001, 9)).toBe(1n);
      // Very small number that would normally trigger scientific notation
      expect(tokenUiAmountToAmount(0.0000001, 6)).toBe(0n);
      // Another extreme small case
      expect(tokenUiAmountToAmount(1e-10, 6)).toBe(0n);
    });

    it("handles zero decimal places", () => {
      expect(tokenUiAmountToAmount(5, 0)).toBe(5n);
      expect(tokenUiAmountToAmount(5.9, 0)).toBe(6n);
      expect(tokenUiAmountToAmount(5.99, 1)).toBe(60n);
    });

    it("handles extreme cases", () => {
      // Large number of decimals (but within reasonable limits)
      expect(tokenUiAmountToAmount(1.5, 15)).toBe(1500000000000000n);

      // Edge cases with JS number precision
      expect(tokenUiAmountToAmount(0.1 + 0.2, 6)).toBe(300000n); // JS floating point issue handled
    });
  });

  describe("tokenAmountToUiAmount", () => {
    it("converts whole numbers correctly", () => {
      expect(tokenAmountToUiAmount(1000000n, 6)).toBe(1);
      expect(tokenAmountToUiAmount(100000000000n, 9)).toBe(100);
      expect(tokenAmountToUiAmount(0n, 6)).toBe(0);
    });

    it("converts decimal amounts correctly", () => {
      expect(tokenAmountToUiAmount(1500000n, 6)).toBe(1.5);
      expect(tokenAmountToUiAmount(50000n, 6)).toBe(0.05);
      expect(tokenAmountToUiAmount(1n, 6)).toBe(0.000001);
    });

    it("handles small amounts correctly", () => {
      expect(tokenAmountToUiAmount(1n, 9)).toBe(0.000000001);
      expect(tokenAmountToUiAmount(123n, 6)).toBe(0.000123);
    });

    it("handles large amounts correctly", () => {
      expect(tokenAmountToUiAmount(123456789000000n, 6)).toBe(123456789);
      expect(tokenAmountToUiAmount(987654321123456n, 6)).toBe(987654321.123456);
    });

    it("handles amounts with fewer digits than decimals", () => {
      expect(tokenAmountToUiAmount(5n, 6)).toBe(0.000005);
      expect(tokenAmountToUiAmount(42n, 9)).toBe(0.000000042);
    });

    it("handles zero decimal places", () => {
      expect(tokenAmountToUiAmount(5n, 0)).toBe(5);
      expect(tokenAmountToUiAmount(0n, 0)).toBe(0);
    });

    it("handles extreme cases", () => {
      // Large number of decimals (but within reasonable limits)
      expect(tokenAmountToUiAmount(1500000000000000n, 15)).toBe(1.5);

      // Reasonably large amount that won't exceed JavaScript's number precision
      const largeAmount = BigInt("12345678901234567890");
      expect(tokenAmountToUiAmount(largeAmount, 9)).toBe(12345678901.23456789);
    });
  });

  describe("round-trip conversions", () => {
    it("uI amount -> raw amount -> UI amount preserves value", () => {
      const original = 1.234567;
      const decimals = 6;

      const rawAmount = tokenUiAmountToAmount(original, decimals);
      const roundTrip = tokenAmountToUiAmount(rawAmount, decimals);

      // Using toBeCloseTo instead of toBe due to potential floating point precision issues
      expect(roundTrip).toBeCloseTo(1.234567, decimals - 1);
    });

    it("uI amount with excess precision gets truncated appropriately", () => {
      const original = 1.2345678901;
      const decimals = 6;

      const rawAmount = tokenUiAmountToAmount(original, decimals);
      const roundTrip = tokenAmountToUiAmount(rawAmount, decimals);

      // Using toBeCloseTo instead of toBe due to potential floating point precision issues
      expect(roundTrip).toBeCloseTo(1.234567, decimals - 1);
    });

    it("raw amount -> UI amount -> raw amount preserves value", () => {
      const original = 1234567n;
      const decimals = 6;

      const uiAmount = tokenAmountToUiAmount(original, decimals);
      const roundTrip = tokenUiAmountToAmount(uiAmount, decimals);

      expect(roundTrip).toBe(original);
    });
  });
});
