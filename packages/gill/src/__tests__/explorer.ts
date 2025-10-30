import assert from "node:assert";

import { type FullySignedTransaction, getSignatureFromTransaction } from "@solana/kit";

import {
  EXPLORER_ORB_BASE_URL,
  EXPLORER_SOLANA_BASE_URL,
  EXPLORER_SOLANAFM_BASE_URL,
  EXPLORER_SOLSCAN_BASE_URL,
  getExplorerLink,
  getExplorerLinkOrb,
  getExplorerLinkSolanafm,
  getExplorerLinkSolscan,
} from "../core";

const TEST_ADDRESS = "dDCQNnDmNbFVi8cQhKAgXhyhXeJ625tvwsunRyRc7c8";
const TEST_TRANSACTION = "2YhzivV92fw9oT6RjTBWSdqR8Sc9FTWxzPMwAzeqiWutXfEgiwhXz3iCnayt9P8nmKwwGn2wDYsGRCSdeoxTJCDX";
const TEST_TRANSACTION_LOCALNET =
  "2QC8BkDVZgaPHUXG9HuPw7aE5d6kN5DTRXLe2inT1NzurkYTCFhraSEo883CPNe18BZ2peJC1x1nojZ5Jmhs94pL";
const TEST_BLOCK = "242233124";

describe("getExplorerLink", () => {
  it("getExplorerLink returns the base explorer url", () => {
    const link = getExplorerLink();
    assert.equal(link, EXPLORER_SOLANA_BASE_URL);
  });

  it("getExplorerLink returns the base explorer url for mainnet", () => {
    const link = getExplorerLink({
      cluster: "mainnet",
    });
    assert.equal(link, EXPLORER_SOLANA_BASE_URL);
  });

  it("getExplorerLink returns the base explorer url for mainnet-beta", () => {
    const link = getExplorerLink({
      cluster: "mainnet-beta",
    });
    assert.equal(link, EXPLORER_SOLANA_BASE_URL);
  });

  it("getExplorerLink returns the base explorer url for devnet", () => {
    const link = getExplorerLink({
      cluster: "devnet",
    });
    assert.equal(link, `${EXPLORER_SOLANA_BASE_URL}?cluster=devnet`);
  });

  it("getExplorerLink returns the base explorer url for testnet", () => {
    const link = getExplorerLink({
      cluster: "testnet",
    });
    assert.equal(link, `${EXPLORER_SOLANA_BASE_URL}?cluster=testnet`);
  });

  it("getExplorerLink returns the base explorer url for localnet", () => {
    const link = getExplorerLink({
      cluster: "localnet",
    });
    assert.equal(link, `${EXPLORER_SOLANA_BASE_URL}?cluster=custom&customUrl=http%3A%2F%2Flocalhost%3A8899`);
  });

  it("getExplorerLink works for a block on mainnet when no network is supplied", () => {
    const link = getExplorerLink({
      block: TEST_BLOCK,
    });
    assert.equal(link, `${EXPLORER_SOLANA_BASE_URL}block/${TEST_BLOCK}`);
  });

  it("getExplorerLink works for a block on mainnet", () => {
    const link = getExplorerLink({
      block: TEST_BLOCK,
      cluster: "mainnet-beta",
    });
    assert.equal(link, `${EXPLORER_SOLANA_BASE_URL}block/${TEST_BLOCK}`);
  });

  it("getExplorerLink works for a block on mainnet", () => {
    const link = getExplorerLink({
      block: TEST_BLOCK,
      cluster: "mainnet",
    });
    assert.equal(link, `${EXPLORER_SOLANA_BASE_URL}block/${TEST_BLOCK}`);
  });

  it("getExplorerLink works for an address on mainnet", () => {
    const address = TEST_ADDRESS;
    const link = getExplorerLink({
      address,
      cluster: "mainnet-beta",
    });
    assert.equal(link, `${EXPLORER_SOLANA_BASE_URL}address/${address}`);
  });

  it("getExplorerLink works for an address on devnet", () => {
    const address = TEST_ADDRESS;
    const link = getExplorerLink({
      address,
      cluster: "devnet",
    });
    assert.equal(link, `${EXPLORER_SOLANA_BASE_URL}address/${address}?cluster=devnet`);
  });

  it("getExplorerLink works for a transaction signature", () => {
    const link = getExplorerLink({
      transaction: TEST_TRANSACTION,
    });
    assert.equal(link, `${EXPLORER_SOLANA_BASE_URL}tx/${TEST_TRANSACTION}`);
  });

  it("getExplorerLink works for a signed transaction", () => {
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
    assert.equal(signature, TEST_TRANSACTION);

    const link = getExplorerLink({
      transaction: signature,
    });
    assert.equal(link, `${EXPLORER_SOLANA_BASE_URL}tx/${signature}`);
  });

  it("getExplorerLink works for a transaction on devnet", () => {
    const transaction = TEST_TRANSACTION;
    const link = getExplorerLink({
      cluster: "devnet",
      transaction,
    });
    assert.equal(link, `${EXPLORER_SOLANA_BASE_URL}tx/${transaction}?cluster=devnet`);
  });

  it("getExplorerLink provides a localnet URL", () => {
    const transaction = TEST_TRANSACTION_LOCALNET;
    const link = getExplorerLink({
      cluster: "localnet",
      transaction,
    });
    assert.equal(
      link,
      `${EXPLORER_SOLANA_BASE_URL}tx/${transaction}?cluster=custom&customUrl=http%3A%2F%2Flocalhost%3A8899`,
    );
  });

  it("getExplorerLink returns the base explorer url with default explorer chosen", () => {
    const link = getExplorerLink();
    assert.equal(link, EXPLORER_SOLANA_BASE_URL);
  });

  it("getExplorerLinkOrb returns orb explorer url", () => {
    const link = getExplorerLinkOrb();
    assert.equal(link, EXPLORER_ORB_BASE_URL);
  });

  it("getExplorerLinkSolscan returns solscan explorer url", () => {
    const link = getExplorerLinkSolscan();
    assert.equal(link, EXPLORER_SOLSCAN_BASE_URL);
  });

  it("getExplorerLinkSolanafm returns solanafm explorer url", () => {
    const link = getExplorerLinkSolanafm();
    assert.equal(link, EXPLORER_SOLANAFM_BASE_URL);
  });

  it("getExplorerLinkSolscan works for an address on solscan", () => {
    const address = TEST_ADDRESS;
    const link = getExplorerLinkSolscan({
      address,
    });
    assert.equal(link, `${EXPLORER_SOLSCAN_BASE_URL}address/${address}`);
  });

  it("getExplorerLinkOrb works for an address on orb", () => {
    const address = TEST_ADDRESS;
    const link = getExplorerLinkOrb({
      address,
    });
    assert.equal(link, `${EXPLORER_ORB_BASE_URL}address/${address}`);
  });

  it("getExplorerLinkSolanafm works for an address on solanafm", () => {
    const address = TEST_ADDRESS;
    const link = getExplorerLinkSolanafm({
      address,
    });
    assert.equal(link, `${EXPLORER_SOLANAFM_BASE_URL}address/${address}`);
  });

  it("getExplorerLinkSolscan works for a transaction on solscan", () => {
    const transaction = TEST_TRANSACTION;
    const link = getExplorerLinkSolscan({
      transaction,
    });
    assert.equal(link, `${EXPLORER_SOLSCAN_BASE_URL}tx/${transaction}`);
  });

  it("getExplorerLinkOrb works for a transaction on orb", () => {
    const transaction = TEST_TRANSACTION;
    const link = getExplorerLinkOrb({
      transaction,
    });
    assert.equal(link, `${EXPLORER_ORB_BASE_URL}tx/${transaction}`);
  });

  it("getExplorerLinkSolanafm works for a transaction on solanafm", () => {
    const transaction = TEST_TRANSACTION;
    const link = getExplorerLinkSolanafm({
      transaction,
    });
    assert.equal(link, `${EXPLORER_SOLANAFM_BASE_URL}tx/${transaction}`);
  });

  it("getExplorerLinkSolscan works for a block on solscan", () => {
    const block = TEST_BLOCK;
    const link = getExplorerLinkSolscan({
      block,
    });
    assert.equal(link, `${EXPLORER_SOLSCAN_BASE_URL}block/${block}`);
  });

  it("getExplorerLinkOrb works for a block on orb", () => {
    const block = TEST_BLOCK;
    const link = getExplorerLinkOrb({
      block,
    });
    assert.equal(link, `${EXPLORER_ORB_BASE_URL}block/${block}`);
  });

  it("getExplorerLinkSolanafm works for a block on solanafm", () => {
    const block = TEST_BLOCK;
    const link = getExplorerLinkSolanafm({
      block,
    });
    assert.equal(link, `${EXPLORER_SOLANAFM_BASE_URL}block/${block}`);
  });

  it("getExplorerLinkSolscan works with devnet cluster on solscan", () => {
    const address = TEST_ADDRESS;
    const link = getExplorerLinkSolscan({
      address,
      cluster: "devnet",
    });
    assert.equal(link, `${EXPLORER_SOLSCAN_BASE_URL}address/${address}?cluster=devnet`);
  });

  it("getExplorerLinkOrb works with testnet cluster on orb", () => {
    const transaction = TEST_TRANSACTION;
    const link = getExplorerLinkOrb({
      cluster: "testnet",
      transaction,
    });
    assert.equal(link, `${EXPLORER_ORB_BASE_URL}tx/${transaction}?cluster=testnet`);
  });

  it("getExplorerLinkSolscan works with localnet on solscan", () => {
    const transaction = TEST_TRANSACTION_LOCALNET;
    const link = getExplorerLinkSolscan({
      cluster: "localnet",
      transaction,
    });
    assert.equal(
      link,
      `${EXPLORER_SOLSCAN_BASE_URL}tx/${transaction}?cluster=custom&customUrl=http%3A%2F%2Flocalhost%3A8899`,
    );
  });

  it("getExplorerLinkOrb ignores localnet cluster (not supported)", () => {
    const block = TEST_BLOCK;
    const link = getExplorerLinkOrb({
      block,
      cluster: "localnet",
    });
    assert.equal(link, `${EXPLORER_ORB_BASE_URL}block/${block}`);
  });

  it("getExplorerLinkOrb ignores localhost cluster (not supported)", () => {
    const address = TEST_ADDRESS;
    const link = getExplorerLinkOrb({
      address,
      cluster: "localhost",
    });
    assert.equal(link, `${EXPLORER_ORB_BASE_URL}address/${address}`);
  });

  it("getExplorerLinkSolanafm works with localhost cluster using localnet-solana", () => {
    const address = TEST_ADDRESS;
    const link = getExplorerLinkSolanafm({
      address,
      cluster: "localhost",
    });
    assert.equal(link, `${EXPLORER_SOLANAFM_BASE_URL}address/${address}?cluster=localnet-solana`);
  });

  it("getExplorerLinkSolanafm works with localnet cluster using localnet-solana", () => {
    const address = TEST_ADDRESS;
    const link = getExplorerLinkSolanafm({
      address,
      cluster: "localnet",
    });
    assert.equal(link, `${EXPLORER_SOLANAFM_BASE_URL}address/${address}?cluster=localnet-solana`);
  });

  it("getExplorerLinkSolanafm works with devnet cluster using devnet-solana", () => {
    const address = TEST_ADDRESS;
    const link = getExplorerLinkSolanafm({
      address,
      cluster: "devnet",
    });
    assert.equal(link, `${EXPLORER_SOLANAFM_BASE_URL}address/${address}?cluster=devnet-solana`);
  });

  it("getExplorerLinkSolanafm works with testnet cluster using testnet-solana", () => {
    const address = TEST_ADDRESS;
    const link = getExplorerLinkSolanafm({
      address,
      cluster: "testnet",
    });
    assert.equal(link, `${EXPLORER_SOLANAFM_BASE_URL}address/${address}?cluster=testnet-solana`);
  });
});
