import assert from "node:assert";

import { transactionFromBase64, type Address } from "gill";
import { getTransactionRequest, postTransactionRequest } from "../fetchers.js";

// Mock fetch for testing
const originalFetch = globalThis.fetch;

function mockFetch(response: any, ok = true, status = 200, statusText = "OK") {
  globalThis.fetch = async () =>
    ({
      ok,
      status,
      statusText,
      json: async () => response,
    }) as Response;
}

function restoreFetch() {
  globalThis.fetch = originalFetch;
}

describe("HTTP Integration Tests", () => {
  const account = "nick6zJc6HpW3kfBm4xS2dmbuVRyb5F3AnUvj5ymzR5" as Address;

  const unsignedTransaction =
    "AQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAABAAABC7YxPJkVXZH3qqq8Nq1nwYa5Pm6+M9ZeObND0CCtBLXjfKbGfbEEIU1AEH81ttgpyiNLO+xurYCsjdCVcfR4YQA=";
  const signedTransaction =
    "Ace42d/o4XA3NGfL6hslysKyc8kB0ILDUT6diotxWdxP1cdt+oNWGztxEPb5t0F797swnV7NLCguh94nGqetQwABAAABHQ6Thk3MgV/D8oYYCRHQCj/SBt4xoclCh8tD8F/J8rXjfKbGfbEEIU1AEH81ttgpyiNLO+xurYCsjdCVcfR4YQA=";

  const unsignedTx = transactionFromBase64(unsignedTransaction);
  const signedTx = transactionFromBase64(signedTransaction);

  afterEach(() => {
    restoreFetch();
  });

  it("should successfully complete GET transaction request flow", async () => {
    const mockResponse = {
      label: "Test Store",
      icon: "https://example.com/icon.png",
    };

    mockFetch(mockResponse);

    const url = new URL("https://example.com/pay");
    const result = await getTransactionRequest(url);

    assert.deepEqual(result, mockResponse);
  });

  it("should successfully complete POST transaction request flow (with unsigned transaction)", async () => {
    const mockResponse = {
      transaction: unsignedTransaction,
      message: "Payment successful",
    };

    mockFetch(mockResponse);

    const url = new URL("https://example.com/pay");
    const result = await postTransactionRequest(url, {
      account,
    });

    assert.equal(result.message, mockResponse.message);
    assert.deepEqual(result.transaction, unsignedTx);
    // assert.deepEqual(result.transaction.signatures, unsignedTx.signatures);
  });

  it("should successfully complete POST transaction request flow (with signed transaction)", async () => {
    const mockResponse = {
      transaction: signedTransaction,
      message: "Payment successful",
    };

    mockFetch(mockResponse);

    const url = new URL("https://example.com/pay");
    const result = await postTransactionRequest(url, {
      account,
    });

    assert.equal(result.message, mockResponse.message);
    assert.deepEqual(result.transaction, signedTx);
  });
});
