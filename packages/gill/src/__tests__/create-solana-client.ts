import assert from "node:assert";

import { createSolanaClient } from "../core";

describe("createSolanaClient", () => {
  it("supports major cluster monikers and urls", () => {
    assert.doesNotThrow(() => {
      createSolanaClient({ cluster: "mainnet", urlOrMoniker: "mainnet" });
      createSolanaClient({ cluster: "devnet", urlOrMoniker: "devnet" });
      createSolanaClient({ cluster: "testnet", urlOrMoniker: "testnet" });
      createSolanaClient({ cluster: "localnet", urlOrMoniker: "localnet" });
      createSolanaClient({ cluster: "mainnet", urlOrMoniker: "https://example-rpc.com" });
    });
  });
  it("throws on invalid moniker", () => {
    assert.throws(() => createSolanaClient({ cluster: "mainnet", urlOrMoniker: "invalid" }), "Invalid moniker");
  });
  it("throws on invalid and unsupported urls", () => {
    assert.throws(() => createSolanaClient({ cluster: "mainnet", urlOrMoniker: "http//invalid" }), "Invalid url");
    assert.throws(
      () => createSolanaClient({ cluster: "mainnet", urlOrMoniker: "ftp://invalid" }),
      "Unsupported protocol",
    );
  });
});
