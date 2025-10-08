import { generateKeyPairSigner, getBase58Decoder, KeyPairSigner, signBytes } from "@solana/kit";

import { verifySignatureForAddress } from "../core/verify-signature";

describe("verifySignatureForAddress", () => {
  let testKeyPair: KeyPairSigner;
  const testMessage: string = "Hello, Solana!";
  const messageBytes = new TextEncoder().encode(testMessage);

  beforeAll(async () => {
    testKeyPair = await generateKeyPairSigner();
  });

  it("should return true for valid signature with SignatureBytes", async () => {
    const randomBytes = new Uint8Array(32);
    crypto.getRandomValues(randomBytes);
    const signedData = await signBytes(testKeyPair.keyPair.privateKey, randomBytes);

    const isValid = await verifySignatureForAddress(testKeyPair.address, signedData, randomBytes);

    expect(isValid).toBe(true);
  });

  it("should return true for valid signature with string message", async () => {
    const signature = await signBytes(testKeyPair.keyPair.privateKey, messageBytes);

    const isValid = await verifySignatureForAddress(testKeyPair.address, signature, testMessage);

    expect(isValid).toBe(true);
  });

  it("should return true for valid signature with Uint8Array message", async () => {
    const signature = await signBytes(testKeyPair.keyPair.privateKey, messageBytes);

    const isValid = await verifySignatureForAddress(testKeyPair.address, signature, messageBytes);

    expect(isValid).toBe(true);
  });

  it("should return false for invalid signature", async () => {
    const signature = await signBytes(testKeyPair.keyPair.privateKey, messageBytes);
    const differentMessage = "Different message";

    const isValid = await verifySignatureForAddress(testKeyPair.address, signature, differentMessage);

    expect(isValid).toBe(false);
  });

  it("should return false for signature from different key pair", async () => {
    const differentKeyPair = await generateKeyPairSigner();
    const signature = await signBytes(differentKeyPair.keyPair.privateKey, messageBytes);

    const isValid = await verifySignatureForAddress(testKeyPair.address, signature, testMessage);

    expect(isValid).toBe(false);
  });

  it("should handle string signature input", async () => {
    const signature = await signBytes(testKeyPair.keyPair.privateKey, messageBytes);
    const signatureString = getBase58Decoder().decode(signature);

    const isValid = await verifySignatureForAddress(testKeyPair.address, signatureString, testMessage);

    expect(isValid).toBe(true);
  });
});
