import { blockhash, createKeyPairFromBytes, createSignerFromKeyPair } from "@solana/kit";

import {
  createKeypairFromBase58,
  createKeypairSignerFromBase58,
  createTransaction,
  transactionToBase64WithSigners,
} from "../core";

const EXPECTED_ADDRESS = "5CxWcsm9h3NfCM8WPM6eaw8LnnSmnYyEHf8BQQ56YJGK";

// Corresponds to address `5CxWcsm9h3NfCM8WPM6eaw8LnnSmnYyEHf8BQQ56YJGK`
const MOCK_KEY_BYTES = new Uint8Array([
  158, 162, 68, 53, 7, 160, 11, 228, 121, 212, 9, 20, 153, 66, 181, 218, 221, 151, 133, 191, 47, 200, 42, 248, 9, 193,
  87, 242, 138, 52, 78, 247, 62, 126, 231, 24, 61, 119, 89, 115, 57, 124, 71, 221, 150, 117, 118, 44, 234, 134, 91, 100,
  152, 80, 11, 142, 29, 0, 122, 146, 140, 107, 174, 196,
]);

// Corresponds to address `5CxWcsm9h3NfCM8WPM6eaw8LnnSmnYyEHf8BQQ56YJGK`
const MOCK_KEY_BASE58 = "4AxFzQaPR6N9dWP5K3GdZRLuWJcdgPznM4h42ASqByP3c6vywVLKs32rwPPsuvsJh1E6fLjkAbe8dzhTj3w173Ky";

describe("createKeypairFromBase58", () => {
  it("creates a valid CryptoKeyPair from a base58 encoded secret key", async () => {
    const [keypair, referenceKeypair] = await Promise.all([
      createKeypairFromBase58(MOCK_KEY_BASE58),
      createKeyPairFromBytes(MOCK_KEY_BYTES),
    ]);

    const [signer, referenceSigner] = await Promise.all([
      createSignerFromKeyPair(keypair),
      createSignerFromKeyPair(referenceKeypair),
    ]);

    expect(signer.address.toString()).toBe(EXPECTED_ADDRESS);
    expect(signer.address.toString()).toBe(referenceSigner.address.toString());
  });

  it("throws error when given invalid base58 string", async () => {
    const invalidBase58 = "INVALID-BASE58-O0l";

    await expect(createKeypairFromBase58(invalidBase58)).rejects.toThrow();
  });

  it("throws error when given base58 address", async () => {
    await expect(createKeypairFromBase58(EXPECTED_ADDRESS)).rejects.toThrow();
  });
});

describe("createKeypairSignerFromBase58", () => {
  it("creates a valid CryptoKeyPair from a base58 encoded secret key", async () => {
    const referenceKeypair = await createKeyPairFromBytes(MOCK_KEY_BYTES);

    const [signer, referenceSigner] = await Promise.all([
      createKeypairSignerFromBase58(MOCK_KEY_BASE58),
      createSignerFromKeyPair(referenceKeypair),
    ]);

    expect(signer.address.toString()).toBe(EXPECTED_ADDRESS);
    expect(signer.address.toString()).toBe(referenceSigner.address.toString());
  });

  it("throws error when given invalid base58 string", async () => {
    const invalidBase58 = "INVALID-BASE58-O0l";

    await expect(createKeypairSignerFromBase58(invalidBase58)).rejects.toThrow();
  });

  it("throws error when given base58 address", async () => {
    await expect(createKeypairSignerFromBase58(EXPECTED_ADDRESS)).rejects.toThrow();
  });

  it("can sign transactions", async () => {
    const signer = await createKeypairSignerFromBase58(MOCK_KEY_BASE58);

    const expected =
      "AVwKxtJbYr4VoTGC59X+au7C6zMKOfBh6eWU8f293dCDZY0qVEDBz+7zPFUiDb5eF7Z/1oeB11+6edzGR4vyIQgBAAABPn7nGD13WXM5fEfdlnV2LOqGW2SYUAuOHQB6koxrrsTjfKbGfbEEIU1AEH81ttgpyiNLO+xurYCsjdCVcfR4YQA=";

    const tx = createTransaction({
      feePayer: signer,
      instructions: [],
      latestBlockhash: {
        blockhash: blockhash("GK1nopeF3P8J46dGqq4KfaEWopZU7K65F6CKQXuUdr3z"),
        lastValidBlockHeight: 0n,
      },
      version: "legacy",
    });

    const result = await transactionToBase64WithSigners(tx);

    expect(result).toBe(expected);
  });
});
