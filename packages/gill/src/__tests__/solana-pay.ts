import type { Address } from "@solana/kit";

import {
  createSolanaPayQR,
  createSolanaPayTransactionQR,
  createSolanaPayTransactionURI,
  createSolanaPayTransferQR,
  createSolanaPayTransferURI,
  isSolanaPayTransactionRequest,
  isSolanaPayTransferRequest,
  parseSolanaPayURI,
  type SolanaPayTransactionRequest,
  type SolanaPayTransferRequest,
} from "../core/solana-pay";

describe("Solana Pay", () => {
  const testRecipient = "mvines9iiHiQTysrwkJjGf2gb9Ex9jXJX8ns3qwf2kN" as Address;
  const testSplToken = "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v" as Address;
  const testReference = "2DhfFe8oKhULhHtKu4xEQsZMEfJnWGMfBRJbqRUUw8MJ" as Address;

  describe("createSolanaPayTransferURI", () => {
    it("creates a simple SOL transfer URI", () => {
      const params: SolanaPayTransferRequest = {
        amount: 1,
        label: "Test Store",
        message: "Thanks for your purchase",
        recipient: testRecipient,
      };

      const uri = createSolanaPayTransferURI(params);

      expect(uri).toBe(`solana:${testRecipient}?amount=1&label=Test+Store&message=Thanks+for+your+purchase`);
    });

    it("creates an SPL token transfer URI", () => {
      const params: SolanaPayTransferRequest = {
        amount: 0.1,
        recipient: testRecipient,
        reference: testReference,
        "spl-token": testSplToken,
      };

      const uri = createSolanaPayTransferURI(params);

      expect(uri).toBe(`solana:${testRecipient}?amount=0.1&reference=${testReference}&spl-token=${testSplToken}`);
    });

    it("creates URI with multiple references", () => {
      const params: SolanaPayTransferRequest = {
        recipient: testRecipient,
        reference: [testReference, testReference],
      };

      const uri = createSolanaPayTransferURI(params);

      expect(uri).toBe(`solana:${testRecipient}?reference=${testReference}&reference=${testReference}`);
    });

    it("creates URI with memo", () => {
      const params: SolanaPayTransferRequest = {
        memo: "OrderId12345",
        recipient: testRecipient,
      };

      const uri = createSolanaPayTransferURI(params);

      expect(uri).toBe(`solana:${testRecipient}?memo=OrderId12345`);
    });

    it("creates URI with only recipient when no other params", () => {
      const params: SolanaPayTransferRequest = {
        recipient: testRecipient,
      };

      const uri = createSolanaPayTransferURI(params);

      expect(uri).toBe(`solana:${testRecipient}`);
    });
  });

  describe("createSolanaPayTransactionURI", () => {
    it("creates a transaction request URI", () => {
      const link = "https://example.com/api/transaction";
      const uri = createSolanaPayTransactionURI(link);

      expect(uri).toBe(`solana:${link}`);
    });
  });

  describe("parseSolanaPayURI", () => {
    it("parses a simple SOL transfer URI", () => {
      const uri = `solana:${testRecipient}?amount=1&label=Test%20Store&message=Thanks%20for%20your%20purchase` as const;

      const result = parseSolanaPayURI(uri);

      expect(isSolanaPayTransferRequest(result)).toBe(true);
      expect(result).toMatchObject({
        amount: "1",
        label: "Test Store",
        message: "Thanks for your purchase",
        recipient: testRecipient,
      });
    });

    it("parses an SPL token transfer URI", () => {
      const uri = `solana:${testRecipient}?amount=0.1&spl-token=${testSplToken}&reference=${testReference}` as const;

      const result = parseSolanaPayURI(uri);

      expect(isSolanaPayTransferRequest(result)).toBe(true);
      expect(result).toMatchObject({
        amount: "0.1",
        recipient: testRecipient,
        reference: testReference,
        "spl-token": testSplToken,
      });
    });

    it("parses URI with multiple references", () => {
      const uri = `solana:${testRecipient}?reference=${testReference}&reference=${testReference}` as const;

      const result = parseSolanaPayURI(uri);

      expect(isSolanaPayTransferRequest(result)).toBe(true);

      const transferResult = result as SolanaPayTransferRequest;
      expect(transferResult.recipient).toBe(testRecipient);
      expect(transferResult.reference).toEqual([testReference, testReference]);
      expect(Array.isArray(transferResult.reference)).toBe(true);
    });

    it("parses a transaction request URI", () => {
      const link = "https://example.com/api/transaction";
      const uri = `solana:${link}` as const;

      const result = parseSolanaPayURI(uri);

      expect(isSolanaPayTransactionRequest(result)).toBe(true);
      expect(result).toMatchObject({
        link,
      });
    });

    it("parses URI with only recipient", () => {
      const uri = `solana:${testRecipient}` as const;

      const result = parseSolanaPayURI(uri);

      expect(isSolanaPayTransferRequest(result)).toBe(true);
      expect(result).toMatchObject({
        recipient: testRecipient,
      });
      expect(Object.keys(result)).toHaveLength(1);
    });

    it("throws error for invalid URI", () => {
      const invalidUri = "bitcoin:invalid";

      expect(() => parseSolanaPayURI(invalidUri as unknown as `solana:${string}`)).toThrow(
        /Invalid Solana Pay URI: must start with "solana:"/,
      );
    });

    it("decodes URL-encoded parameters", () => {
      const encodedLabel = "My%20Store%20Name";
      const encodedMessage = "Thanks%20for%20the%20purchase%21";
      const uri = `solana:${testRecipient}?label=${encodedLabel}&message=${encodedMessage}` as const;

      const result = parseSolanaPayURI(uri);

      expect(isSolanaPayTransferRequest(result)).toBe(true);
      expect(result).toMatchObject({
        label: "My Store Name",
        message: "Thanks for the purchase!",
      });
    });
  });

  describe("type guards", () => {
    it("correctly identifies transfer requests", () => {
      const transferRequest: SolanaPayTransferRequest = {
        amount: 1,
        recipient: testRecipient,
      };

      expect(isSolanaPayTransferRequest(transferRequest)).toBe(true);
      expect(isSolanaPayTransactionRequest(transferRequest)).toBe(false);
    });

    it("correctly identifies transaction requests", () => {
      const transactionRequest: SolanaPayTransactionRequest = {
        link: "https://example.com/api/transaction",
      };

      expect(isSolanaPayTransactionRequest(transactionRequest)).toBe(true);
      expect(isSolanaPayTransferRequest(transactionRequest)).toBe(false);
    });
  });

  describe("qR code generation", () => {
    it("generates QR code for transfer request", async () => {
  expect.hasAssertions();
  const params: SolanaPayTransferRequest = {
        amount: 1,
        label: "Test Store",
        recipient: testRecipient,
      };

      const qrCode = await createSolanaPayTransferQR(params);

      expect(qrCode).toContain("data:image/png;base64,");
      expect(qrCode.length).toBeGreaterThan(100);
    });

    it("generates QR code for transaction request", async () => {
  expect.hasAssertions();
  const link = "https://example.com/api/transaction";
  const qrCode = await createSolanaPayTransactionQR(link);

  expect(qrCode).toContain("data:image/png;base64,");
  expect(qrCode.length).toBeGreaterThan(100);
    });

    it("generates QR code with custom options", async () => {
      expect.hasAssertions();
      const uri = createSolanaPayTransferURI({
        amount: 0.5,
        recipient: testRecipient,
      });

      const qrCode = await createSolanaPayQR(uri, {
        color: { dark: "#FF0000", light: "#00FF00" },
        errorCorrectionLevel: "H",
        margin: 2,
        size: 256,
      });

      expect(qrCode).toContain("data:image/png;base64,");
      expect(qrCode.length).toBeGreaterThan(50);
    });

    it("generates SVG QR code", async () => {
      expect.hasAssertions();
      const uri = createSolanaPayTransferURI({
        amount: 1,
        recipient: testRecipient,
      });

      const qrCode = await createSolanaPayQR(uri, {
        format: "svg",
        size: 200,
      });

      expect(qrCode).toContain("<svg");
      expect(qrCode).toContain("</svg>");
    });

    it("generates terminal QR code", async () => {
      expect.hasAssertions();
      const uri = createSolanaPayTransferURI({
        amount: 1,
        recipient: testRecipient,
      });

      const qrCode = await createSolanaPayQR(uri, {
        format: "terminal",
      });

      expect(typeof qrCode).toBe("string");
      expect(qrCode.length).toBeGreaterThan(10);
    });

    it("generates QR code even for unusual content", async () => {expect.hasAssertions();
  const qrCode = await createSolanaPayQR("invalid-uri" as `solana:${string}`);
  expect(typeof qrCode).toBe("string");
  expect(qrCode.length).toBeGreaterThan(100);
    });
  });
});
