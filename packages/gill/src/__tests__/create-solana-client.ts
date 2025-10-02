import assert from "node:assert";

import { createSolanaClient } from "../core";

describe("createSolanaClient", () => {
  test("supports major cluster monikers and urls", () => {
    assert.doesNotThrow(() => {
      createSolanaClient({ urlOrMoniker: "mainnet" });
      createSolanaClient({ urlOrMoniker: "devnet" });
      createSolanaClient({ urlOrMoniker: "testnet" });
      createSolanaClient({ urlOrMoniker: "localnet" });
      createSolanaClient({ urlOrMoniker: "https://example-rpc.com" });
    });
  });
  test("throws on invalid moniker", () => {
    assert.throws(() => createSolanaClient({ urlOrMoniker: "invalid" }), "Invalid moniker");
  });
  test("throws on invalid and unsupported urls", () => {
    assert.throws(() => createSolanaClient({ urlOrMoniker: "http//invalid" }), "Invalid url");
    assert.throws(() => createSolanaClient({ urlOrMoniker: "ftp://invalid" }), "Unsupported protocol");
  });
});
