import assert from "node:assert";

import { createSolanaClient } from "../core";

describe("createSolanaClient", () => {
  const client = createSolanaClient({});
  it("should create a client for mainnet", () => {
    assert.equal(client.cluster, "mainnet");
  }),
    it("supports major cluster monikers and urls", () => {
      assert.doesNotThrow(() => {
        createSolanaClient({ urlOrMoniker: "mainnet" });
        createSolanaClient({ urlOrMoniker: "devnet" });
        createSolanaClient({ urlOrMoniker: "testnet" });
        createSolanaClient({ urlOrMoniker: "localnet" });
        createSolanaClient({ urlOrMoniker: "https://example-rpc.com" });
      });
    });
  it("throws on invalid moniker", () => {
    assert.throws(() => createSolanaClient({ urlOrMoniker: "invalid" }), "Invalid moniker");
  });
  it("throws on invalid and unsupported urls", () => {
    assert.throws(() => createSolanaClient({ urlOrMoniker: "http//invalid" }), "Invalid url");
    assert.throws(() => createSolanaClient({ urlOrMoniker: "ftp://invalid" }), "Unsupported protocol");
  });
});
