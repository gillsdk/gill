import assert from "node:assert";
import { type FullySignedTransaction, getSignatureFromTransaction } from "@solana/kit";

import { getExplorerLink, getExplorerLinkOrb, getExplorerLinkSolscan, getExplorerLinkSolanafm } from "../core";

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
      },
    } as unknown as FullySignedTransaction;

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

  test("getExplorerLink returns the base explorer url with default explorer chosen", () => {
    const link = getExplorerLink();
    assert.equal(link, "https://explorer.solana.com/");
  });

  test("getExplorerLinkOrb returns orb explorer url", () => {
    const link = getExplorerLinkOrb();
    assert.equal(link, "https://orb.helius.dev/");
  });

  test("getExplorerLinkSolscan returns solscan explorer url", () => {
    const link = getExplorerLinkSolscan();
    assert.equal(link, "https://solscan.io/");
  });

  test("getExplorerLinkSolanafm returns solanafm explorer url", () => {
    const link = getExplorerLinkSolanafm();
    assert.equal(link, "https://solana.fm/");
  });

  test("getExplorerLinkSolscan works for an address on solscan", () => {
    const link = getExplorerLinkSolscan({
      address: "dDCQNnDmNbFVi8cQhKAgXhyhXeJ625tvwsunRyRc7c8",
    });
    assert.equal(link, "https://solscan.io/address/dDCQNnDmNbFVi8cQhKAgXhyhXeJ625tvwsunRyRc7c8");
  });

  test("getExplorerLinkOrb works for an address on orb", () => {
    const link = getExplorerLinkOrb({
      address: "dDCQNnDmNbFVi8cQhKAgXhyhXeJ625tvwsunRyRc7c8",
    });
    assert.equal(link, "https://orb.helius.dev/address/dDCQNnDmNbFVi8cQhKAgXhyhXeJ625tvwsunRyRc7c8");
  });

  test("getExplorerLinkSolanafm works for an address on solanafm", () => {
    const link = getExplorerLinkSolanafm({
      address: "dDCQNnDmNbFVi8cQhKAgXhyhXeJ625tvwsunRyRc7c8",
    });
    assert.equal(link, "https://solana.fm/address/dDCQNnDmNbFVi8cQhKAgXhyhXeJ625tvwsunRyRc7c8");
  });

  test("getExplorerLinkSolscan works for a transaction on solscan", () => {
    const link = getExplorerLinkSolscan({
      transaction: "2YhzivV92fw9oT6RjTBWSdqR8Sc9FTWxzPMwAzeqiWutXfEgiwhXz3iCnayt9P8nmKwwGn2wDYsGRCSdeoxTJCDX",
    });
    assert.equal(
      link,
      "https://solscan.io/tx/2YhzivV92fw9oT6RjTBWSdqR8Sc9FTWxzPMwAzeqiWutXfEgiwhXz3iCnayt9P8nmKwwGn2wDYsGRCSdeoxTJCDX",
    );
  });

  test("getExplorerLinkOrb works for a transaction on orb", () => {
    const link = getExplorerLinkOrb({
      transaction: "2YhzivV92fw9oT6RjTBWSdqR8Sc9FTWxzPMwAzeqiWutXfEgiwhXz3iCnayt9P8nmKwwGn2wDYsGRCSdeoxTJCDX",
    });
    assert.equal(
      link,
      "https://orb.helius.dev/tx/2YhzivV92fw9oT6RjTBWSdqR8Sc9FTWxzPMwAzeqiWutXfEgiwhXz3iCnayt9P8nmKwwGn2wDYsGRCSdeoxTJCDX",
    );
  });

  test("getExplorerLinkSolanafm works for a transaction on solanafm", () => {
    const link = getExplorerLinkSolanafm({
      transaction: "2YhzivV92fw9oT6RjTBWSdqR8Sc9FTWxzPMwAzeqiWutXfEgiwhXz3iCnayt9P8nmKwwGn2wDYsGRCSdeoxTJCDX",
    });
    assert.equal(
      link,
      "https://solana.fm/tx/2YhzivV92fw9oT6RjTBWSdqR8Sc9FTWxzPMwAzeqiWutXfEgiwhXz3iCnayt9P8nmKwwGn2wDYsGRCSdeoxTJCDX",
    );
  });

  test("getExplorerLinkSolscan works for a block on solscan", () => {
    const link = getExplorerLinkSolscan({
      block: "242233124",
    });
    assert.equal(link, "https://solscan.io/block/242233124");
  });

  test("getExplorerLinkOrb works for a block on orb", () => {
    const link = getExplorerLinkOrb({
      block: "242233124",
    });
    assert.equal(link, "https://orb.helius.dev/block/242233124");
  });

  test("getExplorerLinkSolanafm works for a block on solanafm", () => {
    const link = getExplorerLinkSolanafm({
      block: "242233124",
    });
    assert.equal(link, "https://solana.fm/block/242233124");
  });

  test("getExplorerLinkSolscan works with devnet cluster on solscan", () => {
    const link = getExplorerLinkSolscan({
      cluster: "devnet",
      address: "dDCQNnDmNbFVi8cQhKAgXhyhXeJ625tvwsunRyRc7c8",
    });
    assert.equal(link, "https://solscan.io/address/dDCQNnDmNbFVi8cQhKAgXhyhXeJ625tvwsunRyRc7c8?cluster=devnet");
  });

  test("getExplorerLinkOrb works with testnet cluster on orb", () => {
    const link = getExplorerLinkOrb({
      cluster: "testnet",
      transaction: "2YhzivV92fw9oT6RjTBWSdqR8Sc9FTWxzPMwAzeqiWutXfEgiwhXz3iCnayt9P8nmKwwGn2wDYsGRCSdeoxTJCDX",
    });
    assert.equal(
      link,
      "https://orb.helius.dev/tx/2YhzivV92fw9oT6RjTBWSdqR8Sc9FTWxzPMwAzeqiWutXfEgiwhXz3iCnayt9P8nmKwwGn2wDYsGRCSdeoxTJCDX?cluster=testnet",
    );
  });

  test("getExplorerLinkSolscan works with localnet on solscan", () => {
    const link = getExplorerLinkSolscan({
      cluster: "localnet",
      transaction: "2QC8BkDVZgaPHUXG9HuPw7aE5d6kN5DTRXLe2inT1NzurkYTCFhraSEo883CPNe18BZ2peJC1x1nojZ5Jmhs94pL",
    });
    assert.equal(
      link,
      "https://solscan.io/tx/2QC8BkDVZgaPHUXG9HuPw7aE5d6kN5DTRXLe2inT1NzurkYTCFhraSEo883CPNe18BZ2peJC1x1nojZ5Jmhs94pL?cluster=custom&customUrl=http%3A%2F%2Flocalhost%3A8899",
    );
  });

  test("getExplorerLinkOrb ignores localnet cluster (not supported)", () => {
    const link = getExplorerLinkOrb({
      cluster: "localnet",
      block: "242233124",
    });
    assert.equal(link, "https://orb.helius.dev/block/242233124");
  });

  test("getExplorerLinkOrb ignores localhost cluster (not supported)", () => {
    const link = getExplorerLinkOrb({
      cluster: "localhost",
      address: "dDCQNnDmNbFVi8cQhKAgXhyhXeJ625tvwsunRyRc7c8",
    });
    assert.equal(link, "https://orb.helius.dev/address/dDCQNnDmNbFVi8cQhKAgXhyhXeJ625tvwsunRyRc7c8");
  });

  test("getExplorerLinkSolanafm works with localhost cluster on solanafm", () => {
    const link = getExplorerLinkSolanafm({
      cluster: "localhost",
      address: "dDCQNnDmNbFVi8cQhKAgXhyhXeJ625tvwsunRyRc7c8",
    });
    assert.equal(
      link,
      "https://solana.fm/address/dDCQNnDmNbFVi8cQhKAgXhyhXeJ625tvwsunRyRc7c8?cluster=custom&customUrl=http%3A%2F%2Flocalhost%3A8899",
    );
  });

  test("getExplorerLinkSolanafm works with devnet cluster using devnet-solana", () => {
    const link = getExplorerLinkSolanafm({
      cluster: "devnet",
      address: "dDCQNnDmNbFVi8cQhKAgXhyhXeJ625tvwsunRyRc7c8",
    });
    assert.equal(link, "https://solana.fm/address/dDCQNnDmNbFVi8cQhKAgXhyhXeJ625tvwsunRyRc7c8?cluster=devnet-solana");
  });

  test("getExplorerLinkSolanafm works with testnet cluster using testnet-solana", () => {
    const link = getExplorerLinkSolanafm({
      cluster: "testnet",
      address: "dDCQNnDmNbFVi8cQhKAgXhyhXeJ625tvwsunRyRc7c8",
    });
    assert.equal(link, "https://solana.fm/address/dDCQNnDmNbFVi8cQhKAgXhyhXeJ625tvwsunRyRc7c8?cluster=testnet-solana");
  });
});
