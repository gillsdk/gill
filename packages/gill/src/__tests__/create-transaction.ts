import assert from "node:assert";

import { type Address, blockhash, generateKeyPairSigner, isKeyPairSigner, type KeyPairSigner } from "@solana/kit";

import { createTransaction } from "../core";
import { hasSetComputeLimitInstruction, hasSetComputeUnitPriceInstruction } from "../programs";

describe("createTransaction", () => {
  let signer: KeyPairSigner;

  beforeAll(async () => {
    signer = await generateKeyPairSigner();
  });

  it("create a legacy transaction with a signer as the feePayer", () => {
    const tx = createTransaction({
      feePayer: signer,
      instructions: [],
      latestBlockhash: {
        blockhash: blockhash("GK1nopeF3P8J46dGqq4KfaEWopZU7K65F6CKQXuUdr3z"),
        lastValidBlockHeight: 0n,
      },
      version: "legacy",
    });

    assert.equal(tx.version, "legacy");
    assert.equal(tx.feePayer.address, signer.address);
    assert.equal(isKeyPairSigner(tx.feePayer), true);
    assert.equal(tx.instructions.length, 0);
    assert.equal(Object.hasOwn(tx, "lifetimeConstraint"), true);
    assert.equal(tx.lifetimeConstraint.blockhash, "GK1nopeF3P8J46dGqq4KfaEWopZU7K65F6CKQXuUdr3z");
    assert.equal(hasSetComputeUnitPriceInstruction(tx), false);
    assert.equal(hasSetComputeLimitInstruction(tx), false);
  });

  it("create a version 0 transaction with a signer as the feePayer", () => {
    const tx = createTransaction({
      feePayer: signer,
      instructions: [],
      version: 0,
    });

    assert.equal(tx.version, 0);
    assert.equal(tx.feePayer.address, signer.address);
    assert.equal(isKeyPairSigner(tx.feePayer), true);
    assert.equal(tx.instructions.length, 0);
    assert.equal(Object.hasOwn(tx, "lifetimeConstraint"), false);
    assert.equal(hasSetComputeUnitPriceInstruction(tx), false);
    assert.equal(hasSetComputeLimitInstruction(tx), false);
  });

  it("create a legacy transaction with an `Address` as the feePayer", () => {
    const tx = createTransaction({
      feePayer: signer.address,
      instructions: [],
      version: "legacy",
    });

    assert.equal(tx.version, "legacy");
    assert.equal(tx.feePayer.address, signer.address);
    assert.equal(isKeyPairSigner(tx.feePayer), false);
    assert.equal(tx.instructions.length, 0);
    assert.equal(Object.hasOwn(tx, "lifetimeConstraint"), false);
    assert.equal(hasSetComputeUnitPriceInstruction(tx), false);
    assert.equal(hasSetComputeLimitInstruction(tx), false);
  });

  it("create a legacy transaction with a compute unit limit instruction", () => {
    const tx = createTransaction({
      computeUnitLimit: 0,
      feePayer: signer.address,
      instructions: [],
      version: "legacy",
    });

    assert.equal(tx.version, "legacy");
    assert.equal(tx.instructions.length, 1);
    assert.equal(hasSetComputeLimitInstruction(tx), true);
    assert.equal(hasSetComputeUnitPriceInstruction(tx), false);
  });

  it("create a legacy transaction with a compute unit price instruction", () => {
    const tx = createTransaction({
      computeUnitPrice: 0,
      feePayer: signer.address,
      instructions: [],
      version: "legacy",
    });

    assert.equal(tx.version, "legacy");
    assert.equal(tx.instructions.length, 1);
    assert.equal(hasSetComputeLimitInstruction(tx), false);
    assert.equal(hasSetComputeUnitPriceInstruction(tx), true);
  });

  it("create a legacy transaction with both compute budget instructions", () => {
    const tx = createTransaction({
      computeUnitLimit: 0,
      computeUnitPrice: 0,
      feePayer: signer.address,
      instructions: [],
      version: "legacy",
    });

    assert.equal(tx.version, "legacy");
    assert.equal(tx.instructions.length, 2);
    assert.equal(hasSetComputeLimitInstruction(tx), true);
    assert.equal(hasSetComputeUnitPriceInstruction(tx), true);
  });

  it("create a version 0 transaction with an `Address` as the feePayer", () => {
    const tx = createTransaction({
      feePayer: signer.address,
      instructions: [],
      latestBlockhash: {
        blockhash: blockhash("GK1nopeF3P8J46dGqq4KfaEWopZU7K65F6CKQXuUdr3z"),
        lastValidBlockHeight: 0n,
      },
      version: 0,
    });

    assert.equal(tx.version, 0);
    assert.equal(tx.feePayer.address, signer.address);
    assert.equal(isKeyPairSigner(tx.feePayer), false);
    assert.equal(tx.instructions.length, 0);
    assert.equal(Object.hasOwn(tx, "lifetimeConstraint"), true);
    assert.equal(tx.lifetimeConstraint.blockhash, "GK1nopeF3P8J46dGqq4KfaEWopZU7K65F6CKQXuUdr3z");
    assert.equal(hasSetComputeUnitPriceInstruction(tx), false);
    assert.equal(hasSetComputeLimitInstruction(tx), false);
  });

  it("create a version 0 transaction with a compute unit limit instruction", () => {
    const tx = createTransaction({
      computeUnitLimit: 0,
      feePayer: signer.address,
      instructions: [],
      version: 0,
    });

    assert.equal(tx.version, 0);
    assert.equal(tx.instructions.length, 1);
    assert.equal(hasSetComputeLimitInstruction(tx), true);
    assert.equal(hasSetComputeUnitPriceInstruction(tx), false);
  });

  it("create a version 0 transaction with a compute unit price instruction", () => {
    const tx = createTransaction({
      computeUnitPrice: 0,
      feePayer: signer.address,
      instructions: [],
      version: 0,
    });

    assert.equal(tx.version, 0);
    assert.equal(tx.instructions.length, 1);
    assert.equal(hasSetComputeLimitInstruction(tx), false);
    assert.equal(hasSetComputeUnitPriceInstruction(tx), true);
  });

  it("create a version 0 transaction with both compute budget instructions", () => {
    const tx = createTransaction({
      computeUnitLimit: 0,
      computeUnitPrice: 0,
      feePayer: signer.address,
      instructions: [],
      version: 0,
    });

    assert.equal(tx.version, 0);
    assert.equal(tx.instructions.length, 2);
    assert.equal(hasSetComputeLimitInstruction(tx), true);
    assert.equal(hasSetComputeUnitPriceInstruction(tx), true);
  });

  it("auto-detects legacy version when no ALT is used", () => {
    const tx = createTransaction({
      feePayer: signer.address,
      instructions: [],
    });

    assert.equal(tx.version, "legacy");
  });

  it("auto-detects v0 version when ALT is detected in instructions", () => {
    const instructionWithALT = {
      accounts: [],
      addressTableLookup: {
        lookupTableAddress: "22222222222222222222222222222222" as Address,
        readableIndices: [],
        writableIndices: [],
      },
      data: new Uint8Array(),
      programAddress: "11111111111111111111111111111111" as Address,
    };

    const tx = createTransaction({
      feePayer: signer.address,
      instructions: [instructionWithALT],
    });

    assert.equal(tx.version, 0);
  });

  it("auto-detects v0 version when addressTableLookups is present", () => {
    const instructionWithALTs = {
      accounts: [],
      addressTableLookups: [
        {
          lookupTableAddress: "22222222222222222222222222222222" as Address,
          readableIndices: [],
          writableIndices: [],
        },
      ],
      data: new Uint8Array(),
      programAddress: "11111111111111111111111111111111" as Address,
    };

    const tx = createTransaction({
      feePayer: signer.address,
      instructions: [instructionWithALTs],
    });

    assert.equal(tx.version, 0);
  });

  it("explicit version overrides auto-detection", () => {
    const instructionWithALT = {
      accounts: [],
      addressTableLookup: {
        lookupTableAddress: "22222222222222222222222222222222" as Address,
        readableIndices: [],
        writableIndices: [],
      },
      data: new Uint8Array(),
      programAddress: "11111111111111111111111111111111" as Address,
    };

    const tx = createTransaction({
      feePayer: signer.address,
      instructions: [instructionWithALT],
      version: "legacy",
    });

    assert.equal(tx.version, "legacy");
  });

  it("explicit auto version behaves same as no version", () => {
    const tx = createTransaction({
      feePayer: signer.address,
      instructions: [],
      version: "auto",
    });

    assert.equal(tx.version, "legacy");
  });

  it("explicit auto version with ALT detects v0", () => {
    const instructionWithALT = {
      accounts: [],
      addressTableLookup: {
        lookupTableAddress: "22222222222222222222222222222222" as Address,
        readableIndices: [],
        writableIndices: [],
      },
      data: new Uint8Array(),
      programAddress: "11111111111111111111111111111111" as Address,
    };

    const tx = createTransaction({
      feePayer: signer.address,
      instructions: [instructionWithALT],
      version: "auto",
    });

    assert.equal(tx.version, 0);
  });
});
