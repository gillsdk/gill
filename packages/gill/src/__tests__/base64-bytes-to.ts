import { Address, getBase58Encoder, getBase64Decoder, Signature } from "@solana/kit";

import { base64BytesToAddress, base64BytesToSignature, base64BytesToString } from "../core/base64-bytes-to";

const base64Decoder = getBase64Decoder();
const base58Decoder = getBase58Encoder();

describe("base64BytesToAddress", () => {
  const address = "nick6zJc6HpW3kfBm4xS2dmbuVRyb5F3AnUvj5ymzR5" as Address;
  const base64BytesForAddress: string = base64Decoder.decode(base58Decoder.encode(address));

  it("should convert valid base64 encoded address bytes to Address", () => {
    const result = base64BytesToAddress(base64BytesForAddress);
    expect(result).toBeDefined();
    expect(typeof result).toBe("string");
  });

  it("should throw error for invalid base64 string", () => {
    expect(() => base64BytesToAddress("invalid-base64!!!")).toThrow();
  });

  it("should throw error for base64 string with incorrect length", () => {
    // Base64 of only 16 bytes instead of required 32
    const shortBase64 = "AAAAAAAAAAAAAAAAAAAAAA==";
    expect(() => base64BytesToAddress(shortBase64)).toThrow();
  });

  it("should throw error for empty string", () => {
    expect(() => base64BytesToAddress("")).toThrow();
  });

  it("should throw error for base64 of invalid address format", () => {
    // Base64 of 32 bytes but not a valid address format
    const invalidAddressBase64 = "/////////////////////////////////////w==";
    expect(() => base64BytesToAddress(invalidAddressBase64)).toThrow();
  });
});

describe("base64BytesToSignature", () => {
  const singature =
    "4SJT9r8g3ea98CsdagyDSf2pMYjUQrxd9y1DeG5fNFqaQ3gH9N7bhqYUKsn4pZCLKgmhtQek5BFGSnfs2ieS9TMp" as Signature;
  const base64BytesForSignature: string = base64Decoder.decode(base58Decoder.encode(singature));

  it("should convert valid base64 encoded signature bytes to Signature", () => {
    const result = base64BytesToSignature(base64BytesForSignature);
    expect(result).toBeDefined();
    expect(typeof result).toBe("string");
  });

  it("should throw error on invalid base64 encoded signature bytes to Signature", () => {
    // Base64 of 64 bytes with some data, but not a valid Signature
    const signatureBase64 =
      "AQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAgID";
    expect(() => base64BytesToSignature(signatureBase64)).toThrow();
  });

  it("should throw error for invalid base64 string", () => {
    expect(() => base64BytesToSignature("invalid-base64!!!")).toThrow();
  });

  it("should throw error for base64 string with incorrect length", () => {
    // Base64 of only 32 bytes instead of required 64
    const shortBase64 = "AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA=";
    expect(() => base64BytesToSignature(shortBase64)).toThrow();
  });

  it("should throw error for empty string", () => {
    expect(() => base64BytesToSignature("")).toThrow();
  });

  it("should throw error for base64 of invalid signature format", () => {
    // Base64 of 64 bytes but potentially invalid signature format
    const invalidSignatureBase64 =
      "//////////////////////////////////////////////////////////////////////////////////////////8=";
    expect(() => base64BytesToSignature(invalidSignatureBase64)).toThrow();
  });
});

describe("base64BytesToString", () => {
  it("should convert base64 encoded string bytes to UTF-8 string", () => {
    const testString = "Hello, World!" as string;
    const base64BytesForTestString: string = getBase64Decoder().decode(new TextEncoder().encode(testString));

    const result = base64BytesToString(base64BytesForTestString);
    expect(result).toBe(testString);
  });

  it("should convert base64 encoded empty string", () => {
    // Base64 of empty string
    const emptyBase64 = "";
    const result = base64BytesToString(emptyBase64);
    expect(result).toBe("");
  });

  it("should convert base64 encoded single character", () => {
    // Base64 of "A"
    const singleCharBase64 = "QQ==";
    const result = base64BytesToString(singleCharBase64);
    expect(result).toBe("A");
  });

  it("should convert base64 encoded Unicode characters", () => {
    // Base64 of "🚀" (rocket emoji)
    const unicodeBase64 = "8J+agA==";
    const result = base64BytesToString(unicodeBase64);
    expect(result).toBe("🚀");
  });

  it("should convert base64 encoded multi-byte UTF-8 characters", () => {
    // Base64 of "Café"
    const cafeBase64 = "Q2Fmw6k=";
    const result = base64BytesToString(cafeBase64);
    expect(result).toBe("Café");
  });

  it("should convert base64 encoded Japanese characters", () => {
    // Base64 of "こんにちは" (hello in Japanese)
    const japaneseBase64 = "44GT44KT44Gr44Gh44Gv";
    const result = base64BytesToString(japaneseBase64);
    expect(result).toBe("こんにちは");
  });

  it("should convert base64 encoded numbers and special characters", () => {
    // Base64 of "123!@#$%^&*()"
    const specialCharsBase64 = "MTIzIUAjJCVeJiooKQ==";
    const result = base64BytesToString(specialCharsBase64);
    expect(result).toBe("123!@#$%^&*()");
  });

  it("should handle base64 encoded newlines and whitespace", () => {
    // Base64 of "Line 1\nLine 2\t\r"
    const whitespaceBase64 = "TGluZSAxCkxpbmUgMgkN";
    const result = base64BytesToString(whitespaceBase64);
    expect(result).toBe("Line 1\nLine 2\t\r");
  });
});
