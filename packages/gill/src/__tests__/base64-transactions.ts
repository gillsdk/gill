import { address, blockhash, createKeyPairSignerFromPrivateKeyBytes, type KeyPairSigner } from "@solana/kit";

import { createTransaction, transactionFromBase64, transactionToBase64, transactionToBase64WithSigners } from "../core";

// initialize a sample transaction
const tx = createTransaction({
  feePayer: address("nicktrLHhYzLmoVbuZQzHUTicd2sfP571orwo9jfc8c"),
  instructions: [],
  latestBlockhash: {
    blockhash: blockhash("GK1nopeF3P8J46dGqq4KfaEWopZU7K65F6CKQXuUdr3z"),
    lastValidBlockHeight: 0n,
  },
  version: "legacy",
});

// Corresponds to address `2xRiSnKRWfFwwtkBPewQ6E4QA2SK9kzypVukLh35hiS8`
const MOCK_PRIVATE_KEY_BYTES = new Uint8Array([
  0xeb, 0xfa, 0x65, 0xeb, 0x93, 0xdc, 0x79, 0x15, 0x7a, 0xba, 0xde, 0xa2, 0xf7, 0x94, 0x37, 0x9d, 0xfc, 0x07, 0x1d,
  0x68, 0x86, 0x87, 0x37, 0x6d, 0xc5, 0xd5, 0xa0, 0x54, 0x12, 0x1d, 0x34, 0x4a,
]);

describe("transactionToBase64", () => {
  it("can base64 encode an unsigned transaction", () => {
    const expected =
      "AQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAABAAABC7YxPJkVXZH3qqq8Nq1nwYa5Pm6+M9ZeObND0CCtBLXjfKbGfbEEIU1AEH81ttgpyiNLO+xurYCsjdCVcfR4YQA=";

    const result = transactionToBase64(tx);

    expect(result).toBe(expected);
  });
});

describe("transactionToBase64WithSigners", () => {
  let mockSigner: KeyPairSigner;

  beforeAll(async () => {
    mockSigner = await createKeyPairSignerFromPrivateKeyBytes(MOCK_PRIVATE_KEY_BYTES);
  });

  it("can base64 encode a transaction without signers", async () => {
    const expected =
      "AQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAABAAABC7YxPJkVXZH3qqq8Nq1nwYa5Pm6+M9ZeObND0CCtBLXjfKbGfbEEIU1AEH81ttgpyiNLO+xurYCsjdCVcfR4YQA=";

    const result = await transactionToBase64WithSigners(tx);

    expect(result).toBe(expected);
  });

  it("can base64 encode a transaction with signer", async () => {
    const expected =
      "Ace42d/o4XA3NGfL6hslysKyc8kB0ILDUT6diotxWdxP1cdt+oNWGztxEPb5t0F797swnV7NLCguh94nGqetQwABAAABHQ6Thk3MgV/D8oYYCRHQCj/SBt4xoclCh8tD8F/J8rXjfKbGfbEEIU1AEH81ttgpyiNLO+xurYCsjdCVcfR4YQA=";

    const tx = createTransaction({
      feePayer: mockSigner,
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

describe("transactionFromBase64", () => {
  it("can decode base64 an unsigned transaction", () => {
    const input =
      "AQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAABAAABC7YxPJkVXZH3qqq8Nq1nwYa5Pm6+M9ZeObND0CCtBLXjfKbGfbEEIU1AEH81ttgpyiNLO+xurYCsjdCVcfR4YQA=";

    const tx = transactionFromBase64(input);

    const result = transactionToBase64(tx);

    expect(result).toBe(input);
  });
});
