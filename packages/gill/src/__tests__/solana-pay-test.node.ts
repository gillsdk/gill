import assert from "node:assert";
import type { Address } from "@solana/kit";
import {
  createTransferRequestURL,
  createTransactionRequestURL,
  parseSolanaPayURL,
  validateSolanaPayURL,
  toQRCodeURL,
  extractReferenceKeys,
} from "../node";
import {
  SolanaPayError,
  InvalidSolanaPayURLError,
} from "../types/solana-pay";

describe("Solana Pay", () => {
  // Use valid 44-character base58 addresses for testing
  const testRecipient = "11111111111111111111111111111111" as Address; // System Program
  const testSplToken = "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v" as Address; // USDC
  const testReference = "So11111111111111111111111111111111111111112" as Address; // SOL mint
  
  describe("createTransferRequestURL", () => {
    test("should create a basic SOL transfer URL", async () => {
      const url = await createTransferRequestURL({
        recipient: testRecipient,
      });

      assert.ok(url.startsWith("solana:"));
      assert.ok(url.includes(testRecipient));
    });

    test("should create a SOL transfer URL with amount", async () => {
      const url = await createTransferRequestURL({
        recipient: testRecipient,
        amount: 1000000n,
      });

      assert.ok(url.startsWith("solana:"));
      assert.ok(url.includes(testRecipient));
      assert.ok(url.includes("amount=1000000"));
    });

    test("should create an SPL token transfer URL", async () => {
      const url = await createTransferRequestURL({
        recipient: testRecipient,
        amount: 1000000n,
        splToken: testSplToken,
      });

      assert.ok(url.startsWith("solana:"));
      assert.ok(url.includes(testRecipient));
      assert.ok(url.includes("amount=1000000"));
      assert.ok(url.includes(testSplToken));
    });

    test("should create a URL with all parameters", async () => {
      const url = await createTransferRequestURL({
        recipient: testRecipient,
        amount: 1000000n,
        splToken: testSplToken,
        reference: [testReference],
        label: "Coffee Shop",
        message: "Thanks for your purchase!",
        memo: "Order #123",
      });

      assert.ok(url.includes(`solana:`));
      assert.ok(url.includes(testRecipient));
      assert.ok(url.includes("amount=1000000"));
      assert.ok(url.includes(testSplToken));
      assert.ok(url.includes(testReference));
      assert.ok(url.includes("Coffee"));
      assert.ok(url.includes("Thanks"));
      assert.ok(url.includes("Order"));
    });

    test("should handle multiple reference keys", async () => {
      const reference2 = "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA" as Address; // Token Program
      const url = await createTransferRequestURL({
        recipient: testRecipient,
        reference: [testReference, reference2],
      });

      assert.ok(url.includes(testReference));
      assert.ok(url.includes(reference2));
    });

    test("should not encode when encode option is false", async () => {
      const url = await createTransferRequestURL({
        recipient: testRecipient,
        label: "Coffee Shop",
      }, { encode: false });

      assert.ok(url.includes("Coffee Shop"));
    });
  });

  describe("createTransactionRequestURL", () => {
    test("should create a transaction request URL", async () => {
      const url = await createTransactionRequestURL({
        link: "https://merchant.com/api/solana-pay",
      });

      assert.ok(url.startsWith("solana:"));
      assert.ok(url.includes("https://merchant.com/api/solana-pay"));
    });

    test("should throw error for non-HTTPS URLs", async () => {
      await assert.rejects(async () => {
        await createTransactionRequestURL({
          link: "http://merchant.com/api/solana-pay",
        });
      }, SolanaPayError);
    });

    test("should handle URLs with query parameters", async () => {
      const url = await createTransactionRequestURL({
        link: "https://merchant.com/api/solana-pay?session=abc123",
      });

      assert.ok(url.startsWith("solana:"));
      assert.ok(url.includes("session%3Dabc123")); // URL encoded
    });
  });

  describe("validateSolanaPayURL", () => {
    test("should return true for valid transfer URLs", async () => {
      const url = await createTransferRequestURL({
        recipient: testRecipient,
      });
      assert.equal(await validateSolanaPayURL(url), true);
    });

    test("should return true for valid transaction URLs", async () => {
      const url = await createTransactionRequestURL({
        link: "https://merchant.com/api/solana-pay",
      });
      assert.equal(await validateSolanaPayURL(url), true);
    });

    test("should return false for invalid URLs", async () => {
      assert.equal(await validateSolanaPayURL("bitcoin:invalid"), false);
      assert.equal(await validateSolanaPayURL("not-a-url"), false);
    });
  });

  describe("toQRCodeURL", () => {
    test("should return encoded URL for valid Solana Pay URL", async () => {
      const url = await createTransferRequestURL({
        recipient: testRecipient,
        label: "Coffee Shop",
      });
      const qrUrl = await toQRCodeURL(url);
      
      assert.ok(qrUrl.includes("solana:"));
      assert.ok(qrUrl.includes("Coffee"));
    });

    test("should throw error for invalid URL", async () => {
      await assert.rejects(async () => {
        await toQRCodeURL("invalid-url");
      }, InvalidSolanaPayURLError);
    });
  });

  describe("extractReferenceKeys", () => {
    test("should extract reference keys from transfer URL", async () => {
      const url = await createTransferRequestURL({
        recipient: testRecipient,
        reference: [testReference],
      });
      const references = await extractReferenceKeys(url);
      
      assert.equal(references.length, 1);
      assert.equal(references[0], testReference);
    });

    test("should extract multiple reference keys", async () => {
      const reference2 = "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA" as Address; // Token Program
      const url = await createTransferRequestURL({
        recipient: testRecipient,
        reference: [testReference, reference2],
      });
      const references = await extractReferenceKeys(url);
      
      assert.equal(references.length, 2);
      assert.ok(references.includes(testReference));
      assert.ok(references.includes(reference2));
    });

    test("should return empty array for URLs without references", async () => {
      const url = await createTransferRequestURL({
        recipient: testRecipient,
      });
      const references = await extractReferenceKeys(url);
      
      assert.deepEqual(references, []);
    });

    test("should return empty array for transaction URLs", async () => {
      const url = await createTransactionRequestURL({
        link: "https://merchant.com/api/solana-pay",
      });
      const references = await extractReferenceKeys(url);
      
      assert.deepEqual(references, []);
    });
  });

  describe("round-trip compatibility", () => {
    test("should create and parse transfer URLs correctly", async () => {
      const originalParams = {
        recipient: testRecipient,
        amount: 1000000n,
        label: "Coffee Shop",
        message: "Thanks for your purchase!",
      };

      const url = await createTransferRequestURL(originalParams);
      const parsed = await parseSolanaPayURL(url);

      assert.equal(parsed.type, "transfer");
      if (parsed.type === "transfer") {
        assert.equal(parsed.params.recipient, originalParams.recipient);
        assert.equal(parsed.params.amount, originalParams.amount);
        assert.equal(parsed.params.label, originalParams.label);
        assert.equal(parsed.params.message, originalParams.message);
      }
    });

    test("should create and parse transaction URLs correctly", async () => {
      const originalParams = {
        link: "https://merchant.com/api/solana-pay?session=abc123",
      };

      const url = await createTransactionRequestURL(originalParams);
      const parsed = await parseSolanaPayURL(url);

      assert.equal(parsed.type, "transaction");
      if (parsed.type === "transaction") {
        assert.equal(parsed.params.link, originalParams.link);
      }
    });
  });
});