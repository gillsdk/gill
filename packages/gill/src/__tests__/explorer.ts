import assert from "node:assert";
import { getSignatureFromTransaction, ReadonlyUint8Array, SignaturesMap, TransactionMessageBytes } from "@solana/kit";

import { getExplorerLink } from "../core";

describe("getExplorerLink", () => {
  test("getExplorerLink returns the base explorer url", () => {
    const link = getExplorerLink();
    assert.equal(link, "https://explorer.solana.com/");
  });

  test("getExplorerLink returns the base explorer url for mainnet", () => {
    const link = getExplorerLink({
      cluster: "mainnet",
    });
    assert.equal(link, "https://explorer.solana.com/");
  });

  test("getExplorerLink returns the base explorer url for mainnet-beta", () => {
    const link = getExplorerLink({
      cluster: "mainnet-beta",
    });
    assert.equal(link, "https://explorer.solana.com/");
  });

  test("getExplorerLink returns the base explorer url for devnet", () => {
    const link = getExplorerLink({
      cluster: "devnet",
    });
    assert.equal(link, "https://explorer.solana.com/?cluster=devnet");
  });

  test("getExplorerLink returns the base explorer url for testnet", () => {
    const link = getExplorerLink({
      cluster: "testnet",
    });
    assert.equal(link, "https://explorer.solana.com/?cluster=testnet");
  });

  test("getExplorerLink returns the base explorer url for localnet", () => {
    const link = getExplorerLink({
      cluster: "localnet",
    });
    assert.equal(link, "https://explorer.solana.com/?cluster=custom&customUrl=http%3A%2F%2Flocalhost%3A8899");
  });

  test("getExplorerLink works for a block on mainnet when no network is supplied", () => {
    const link = getExplorerLink({
      block: "242233124",
    });
    assert.equal(link, "https://explorer.solana.com/block/242233124");
  });

  test("getExplorerLink works for a block on mainnet", () => {
    const link = getExplorerLink({
      cluster: "mainnet-beta",
      block: "242233124",
    });
    assert.equal(link, "https://explorer.solana.com/block/242233124");
  });

  test("getExplorerLink works for a block on mainnet", () => {
    const link = getExplorerLink({
      cluster: "mainnet",
      block: "242233124",
    });
    assert.equal(link, "https://explorer.solana.com/block/242233124");
  });

  test("getExplorerLink works for an address on mainnet", () => {
    const link = getExplorerLink({
      cluster: "mainnet-beta",
      address: "dDCQNnDmNbFVi8cQhKAgXhyhXeJ625tvwsunRyRc7c8",
    });
    assert.equal(link, "https://explorer.solana.com/address/dDCQNnDmNbFVi8cQhKAgXhyhXeJ625tvwsunRyRc7c8");
  });

  test("getExplorerLink works for an address on devnet", () => {
    const link = getExplorerLink({
      cluster: "devnet",
      address: "dDCQNnDmNbFVi8cQhKAgXhyhXeJ625tvwsunRyRc7c8",
    });
    assert.equal(
      link,
      "https://explorer.solana.com/address/dDCQNnDmNbFVi8cQhKAgXhyhXeJ625tvwsunRyRc7c8?cluster=devnet",
    );
  });

  test("getExplorerLink works for a transaction signature", () => {
    const link = getExplorerLink({
      transaction: "2YhzivV92fw9oT6RjTBWSdqR8Sc9FTWxzPMwAzeqiWutXfEgiwhXz3iCnayt9P8nmKwwGn2wDYsGRCSdeoxTJCDX",
    });
    assert.equal(
      link,
      "https://explorer.solana.com/tx/2YhzivV92fw9oT6RjTBWSdqR8Sc9FTWxzPMwAzeqiWutXfEgiwhXz3iCnayt9P8nmKwwGn2wDYsGRCSdeoxTJCDX",
    );
  });

  test("getExplorerLink works for a signed transaction", () => {
    const signedTx = {
      signatures: {
        nicktrLHhYzLmoVbuZQzHUTicd2sfP571orwo9jfc8c: [
          77, 92, 24, 170, 25, 33, 200, 153, 230, 77, 49, 85, 252, 160, 42, 192, 68, 242, 160, 20, 64, 71, 154, 190, 6,
          63, 124, 101, 224, 127, 147, 238, 138, 252, 144, 23, 49, 97, 73, 118, 118, 94, 32, 147, 76, 228, 241, 244,
          182, 223, 244, 135, 175, 158, 129, 227, 23, 49, 177, 159, 227, 46, 23, 10,
        ],
      } as SignaturesMap,
      messageBytes: new Uint8Array() as ReadonlyUint8Array as TransactionMessageBytes,
    };

    const signature = getSignatureFromTransaction(signedTx);
    assert.equal(signature, "2YhzivV92fw9oT6RjTBWSdqR8Sc9FTWxzPMwAzeqiWutXfEgiwhXz3iCnayt9P8nmKwwGn2wDYsGRCSdeoxTJCDX");

    const link = getExplorerLink({
      transaction: signature,
    });
    assert.equal(
      link,
      "https://explorer.solana.com/tx/2YhzivV92fw9oT6RjTBWSdqR8Sc9FTWxzPMwAzeqiWutXfEgiwhXz3iCnayt9P8nmKwwGn2wDYsGRCSdeoxTJCDX",
    );
  });

  test("getExplorerLink works for a transaction on devnet", () => {
    const link = getExplorerLink({
      cluster: "devnet",
      transaction: "2YhzivV92fw9oT6RjTBWSdqR8Sc9FTWxzPMwAzeqiWutXfEgiwhXz3iCnayt9P8nmKwwGn2wDYsGRCSdeoxTJCDX",
    });
    assert.equal(
      link,
      "https://explorer.solana.com/tx/2YhzivV92fw9oT6RjTBWSdqR8Sc9FTWxzPMwAzeqiWutXfEgiwhXz3iCnayt9P8nmKwwGn2wDYsGRCSdeoxTJCDX?cluster=devnet",
    );
  });

  test("getExplorerLink provides a localnet URL", () => {
    const link = getExplorerLink({
      cluster: "localnet",
      transaction: "2QC8BkDVZgaPHUXG9HuPw7aE5d6kN5DTRXLe2inT1NzurkYTCFhraSEo883CPNe18BZ2peJC1x1nojZ5Jmhs94pL",
    });
    assert.equal(
      link,
      "https://explorer.solana.com/tx/2QC8BkDVZgaPHUXG9HuPw7aE5d6kN5DTRXLe2inT1NzurkYTCFhraSEo883CPNe18BZ2peJC1x1nojZ5Jmhs94pL?cluster=custom&customUrl=http%3A%2F%2Flocalhost%3A8899",
    );
  });
});
