import { type Address } from "gill";
import assert from "node:assert";
import { parseSolanaPayURL, SolanaPayTransactionRequestURL, type SolanaPayTransferRequestURL } from "../parse-url.ts";

describe("parseSolanaPayURL", () => {
  const pubkey = "nick6zJc6HpW3kfBm4xS2dmbuVRyb5F3AnUvj5ymzR5" as Address;

  describe("SolanaPayTransactionRequestURL", () => {
    it("should parse with only a url", () => {
      const url = `solana:${"https://gillsdk.com"}`;

      const { label, message, link } = parseSolanaPayURL(url) as SolanaPayTransactionRequestURL;

      // should add trailing slash
      assert.equal(link, "https://gillsdk.com/");
      assert.equal(label, undefined);
      assert.equal(message, undefined);
    });

    it("should parse with Solana Pay query params", () => {
      const data = {
        link: "https://gillsdk.com/",
        message: "Message",
        label: "Label",
      };
      const url = `solana:${data.link}?label=${data.label}&message=${data.message}`;

      const { label, message, link } = parseSolanaPayURL(url) as SolanaPayTransactionRequestURL;

      assert.equal(link, data.link);
      assert.equal(label, data.label);
      assert.equal(message, data.message);
    });

    it("should parse with link with query params", () => {
      const data = {
        link: "https://gillsdk.com/?query=param",
      };
      const url = `solana:${encodeURIComponent(data.link)}`;

      const { label, message, link } = parseSolanaPayURL(url) as SolanaPayTransactionRequestURL;

      assert.equal(link, data.link);
      assert.equal(label, undefined);
      assert.equal(message, undefined);
    });

    it("should parse with link with query params and Solana Pay query params", () => {
      const data = {
        link: "https://gillsdk.com/?query=param",
        message: "Message",
        label: "Label",
      };
      const url = `solana:${encodeURIComponent(data.link)}?label=${data.label}&message=${data.message}`;

      const { label, message, link } = parseSolanaPayURL(url) as SolanaPayTransactionRequestURL;

      assert.equal(link, data.link);
      assert.equal(label, data.label);
      assert.equal(message, data.message);
    });
  });

  describe("SolanaPayTransferRequestURL", () => {
    it("should parse with only address", () => {
      const url = "solana:nick6zJc6HpW3kfBm4xS2dmbuVRyb5F3AnUvj5ymzR5";

      const { recipient, amount, splToken, reference, label, message, memo } = parseSolanaPayURL(
        url,
      ) as SolanaPayTransferRequestURL;

      assert.equal(recipient, pubkey);
      assert.equal(amount, undefined);
      assert.equal(splToken, undefined);
      assert.equal(reference, undefined);
      assert.equal(label, undefined);
      assert.equal(message, undefined);
      assert.equal(memo, undefined);
    });

    it("should parse successfully", () => {
      const url =
        "solana:nick6zJc6HpW3kfBm4xS2dmbuVRyb5F3AnUvj5ymzR5?amount=0.000000001&reference=82ZJ7nbGpixjeDCmEhUcmwXYfvurzAgGdtSMuHnUgyny&label=Michael&message=Thanks%20for%20all%20the%20fish&memo=OrderId5678";

      const { recipient, amount, splToken, reference, label, message, memo } = parseSolanaPayURL(
        url,
      ) as SolanaPayTransferRequestURL;

      assert.equal(recipient, pubkey);
      assert.equal(amount, 0.000000001);
      assert.equal(splToken, undefined);
      assert.equal(reference?.length, 1);
      assert.equal(reference![0], "82ZJ7nbGpixjeDCmEhUcmwXYfvurzAgGdtSMuHnUgyny");
      assert.equal(label, "Michael");
      assert.equal(message, "Thanks for all the fish");
      assert.equal(memo, "OrderId5678");
    });

    it("should parse with spl-token", () => {
      const url =
        "solana:nick6zJc6HpW3kfBm4xS2dmbuVRyb5F3AnUvj5ymzR5?amount=1.01&spl-token=82ZJ7nbGpixjeDCmEhUcmwXYfvurzAgGdtSMuHnUgyny&label=Michael&message=Thanks%20for%20all%20the%20fish&memo=OrderId5678";

      const { recipient, amount, splToken, reference, label, message, memo } = parseSolanaPayURL(
        url,
      ) as SolanaPayTransferRequestURL;

      assert.equal(recipient, pubkey);
      assert.equal(amount, 1.01);
      assert.equal(splToken, "82ZJ7nbGpixjeDCmEhUcmwXYfvurzAgGdtSMuHnUgyny");
      assert.equal(reference, undefined);
      assert.equal(label, "Michael");
      assert.equal(message, "Thanks for all the fish");
      assert.equal(memo, "OrderId5678");
    });

    it("should parse multiple references", () => {
      const url =
        "solana:nick6zJc6HpW3kfBm4xS2dmbuVRyb5F3AnUvj5ymzR5?reference=82ZJ7nbGpixjeDCmEhUcmwXYfvurzAgGdtSMuHnUgyny&reference=mvines9iiHiQTysrwkJjGf2gb9Ex9jXJX8ns3qwf2kN";

      const { recipient, amount, splToken, reference, label, message, memo } = parseSolanaPayURL(
        url,
      ) as SolanaPayTransferRequestURL;

      assert.equal(recipient, pubkey);
      assert.equal(reference?.length, 2);
      assert.equal(reference![0], "82ZJ7nbGpixjeDCmEhUcmwXYfvurzAgGdtSMuHnUgyny");
      assert.equal(reference![1], "mvines9iiHiQTysrwkJjGf2gb9Ex9jXJX8ns3qwf2kN");
      assert.equal(amount, undefined);
      assert.equal(splToken, undefined);
      assert.equal(label, undefined);
      assert.equal(message, undefined);
      assert.equal(memo, undefined);
    });

    it("should parse without an amount", () => {
      const url =
        "solana:nick6zJc6HpW3kfBm4xS2dmbuVRyb5F3AnUvj5ymzR5?reference=82ZJ7nbGpixjeDCmEhUcmwXYfvurzAgGdtSMuHnUgyny&label=Michael&message=Thanks%20for%20all%20the%20fish&memo=OrderId5678";

      const { recipient, amount, splToken, reference, label, message, memo } = parseSolanaPayURL(
        url,
      ) as SolanaPayTransferRequestURL;

      assert.equal(recipient, pubkey);
      expect(amount).toBeUndefined();
      assert.equal(splToken, undefined);
      assert.equal(reference?.length, 1);
      assert.equal(reference![0], "82ZJ7nbGpixjeDCmEhUcmwXYfvurzAgGdtSMuHnUgyny");
      assert.equal(label, "Michael");
      assert.equal(message, "Thanks for all the fish");
      assert.equal(memo, "OrderId5678");
    });

    it("should parse with only amount", () => {
      const url = "solana:nick6zJc6HpW3kfBm4xS2dmbuVRyb5F3AnUvj5ymzR5?amount=0.000000001";

      const { recipient, amount, splToken, reference, label, message, memo } = parseSolanaPayURL(
        url,
      ) as SolanaPayTransferRequestURL;

      assert.equal(recipient, pubkey);
      assert.equal(amount, 0.000000001);
      assert.equal(splToken, undefined);
      assert.equal(reference, undefined);
      assert.equal(label, undefined);
      assert.equal(message, undefined);
      assert.equal(memo, undefined);
    });
  });

  describe("errors", () => {
    it("throws an error on invalid length", () => {
      const url = "X".repeat(2049);
      expect(() => parseSolanaPayURL(url)).toThrow("length invalid");
    });

    it("throws an error on invalid protocol", () => {
      const url = "eth:0xffff";
      expect(() => parseSolanaPayURL(url)).toThrow("protocol invalid");
    });

    it("throws an error on invalid recipient", () => {
      const url = "solana:0xffff";
      expect(() => parseSolanaPayURL(url)).toThrow("recipient invalid");
    });

    it.each([
      // various invalid numbers
      ["1milliondollars"],
      [-0.1],
      [-100],
    ])("throws an error on invalid amount: %p", (amount) => {
      const url = `solana:nick6zJc6HpW3kfBm4xS2dmbuVRyb5F3AnUvj5ymzR5?amount=${amount}`;

      expect(() => parseSolanaPayURL(url)).toThrow("amount invalid");
    });

    it("throws an error on invalid token", () => {
      const url = "solana:nick6zJc6HpW3kfBm4xS2dmbuVRyb5F3AnUvj5ymzR5?amount=1&spl-token=0xffff";

      expect(() => parseSolanaPayURL(url)).toThrow("spl-token invalid");
    });

    it("throws an error on invalid reference", () => {
      const url = "solana:nick6zJc6HpW3kfBm4xS2dmbuVRyb5F3AnUvj5ymzR5?amount=1&reference=0xffff";

      expect(() => parseSolanaPayURL(url)).toThrow("reference invalid");
    });
  });
});
