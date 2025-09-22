import assert from "node:assert";

import { type Address } from "gill";
import { encodeSolanaPayURL } from "../encode-url.js";

describe("encodeSolanaPayURL", () => {
  describe("TransferRequestURL", () => {
    const recipient = "nick6zJc6HpW3kfBm4xS2dmbuVRyb5F3AnUvj5ymzR5" as Address;
    const splToken = "USDSwr9ApdHk5bvJKMjzff41FfuX8bSxdKcR81vTwcA" as Address;
    const reference1 = "mvines9iiHiQTysrwkJjGf2gb9Ex9jXJX8ns3qwf2kN" as Address;
    const reference2 = "82ZJ7nbGpixjeDCmEhUcmwXYfvurzAgGdtSMuHnUgyny" as Address;
    const label = "label";
    const message = "message";
    const memo = "memo";

    it("encodes a url with only recipient", () => {
      const url = encodeSolanaPayURL({ recipient });

      assert.equal(String(url), `solana:${recipient}`);
    });

    it("encodes a url with recipient and amount", () => {
      const amount = 1;

      const url = encodeSolanaPayURL({ recipient, amount });

      assert.equal(String(url), `solana:${recipient}?amount=1`);
    });

    it("encodes a url with recipient, amount, and token", () => {
      const amount = 1.01;

      const url = encodeSolanaPayURL({ recipient, amount, splToken });

      assert.equal(String(url), `solana:${recipient}?amount=1.01&spl-token=${splToken}`);
    });

    it("encodes a url with recipient, amount, and single reference", () => {
      const amount = 100000.123456;

      const url = encodeSolanaPayURL({ recipient, amount, reference: reference1 });

      assert.equal(String(url), `solana:${recipient}?amount=100000.123456&reference=${reference1}`);
    });

    it("encodes a url with recipient, amount, and multiple references", () => {
      const amount = 100000.123456;
      const reference = [reference1, reference2];

      const url = encodeSolanaPayURL({ recipient, amount, reference });

      assert.equal(
        String(url),
        `solana:${recipient}?amount=100000.123456&reference=${reference1}&reference=${reference2}`,
      );
    });

    it("encodes a url with recipient, amount, and label", () => {
      const amount = 1.99;

      const url = encodeSolanaPayURL({ recipient, amount, label });

      assert.equal(String(url), `solana:${recipient}?amount=1.99&label=${label}`);
    });

    it("encodes a url with recipient, message, and amount (as integer)", () => {
      const amount = 1;

      const url = encodeSolanaPayURL({ recipient, amount, message });

      assert.equal(String(url), `solana:${recipient}?amount=1&message=${message}`);
    });

    it("encodes a url with recipient, amount, and memo", () => {
      const amount = 100;

      const url = encodeSolanaPayURL({ recipient, amount, memo });

      assert.equal(String(url), `solana:${recipient}?amount=100&memo=${memo}`);
    });

    it("encodes a url with recipient, message, and amount (with lots of decimals)", () => {
      const amount = "0.000000001";

      const url = encodeSolanaPayURL({ recipient, amount, message });

      assert.equal(String(url), `solana:${recipient}?amount=${"0.000000001"}&message=${message}`);
    });

    // it("encodes a URL with all parameters", () => {
    //   const amount: number = 0.000000001;
    //   const reference = [reference1, reference2];

    //   const url = encodeSolanaPayURL({ recipient, amount, splToken, reference, label, message, memo });

    //   assert.equal(
    //     String(url),
    //     `solana:${recipient}?amount=${"0.000000001"}&spl-token=${splToken}&reference=${reference1}&reference=${reference2}&label=${label}&message=${message}&memo=${memo}`,
    //   );
    // });
  });

  describe("TransactionRequestURL", () => {
    const label = "label";
    const message = "message";

    it("encodes a URL", () => {
      const link = "https://gillsdk.com";

      const url = encodeSolanaPayURL({ link: new URL(link), label, message });

      assert.equal(String(url), `solana:${link}?label=${label}&message=${message}`);
    });

    it("encodes a URL with query parameters", () => {
      const link = "https://gillsdk.com?query=param";

      const url = encodeSolanaPayURL({ link: new URL(link), label, message });

      assert.equal(String(url), `solana:${encodeURIComponent(link)}?label=${label}&message=${message}`);
    });
  });
});
