import assert from "node:assert";

import { transactionFromBase64, type Address } from "gill";
import { fetchSolanaPayRequest, fetchSolanaPayGetRequest, fetchSolanaPayPostRequest } from "../fetchers.js";

// Mock fetch for testing
const originalFetch = globalThis.fetch;

function mockFetch(response: any, ok = true, status = 200, statusText = "OK") {
  globalThis.fetch = async () =>
    ({
      ok,
      status,
      statusText,
      json: async () => response,
    }) as unknown as Response;
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
    const result = await fetchSolanaPayGetRequest(url);

    assert.deepEqual(result, mockResponse);
  });

  it("should successfully complete POST transaction request flow (with unsigned transaction)", async () => {
    const mockResponse = {
      transaction: unsignedTransaction,
      message: "Payment successful",
    };

    mockFetch(mockResponse);

    const url = new URL("https://example.com/pay");
    const result = await fetchSolanaPayPostRequest(url, {
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
    const result = await fetchSolanaPayPostRequest(url, {
      account,
    });

    assert.equal(result.message, mockResponse.message);
    assert.deepEqual(result.transaction, signedTx);
  });
});

describe("fetchSolanaPayRequest", () => {
  afterEach(() => {
    restoreFetch();
  });

  describe("URL validation", () => {
    it("should reject non-HTTPS URLs", async () => {
      const url = new URL("http://example.com/pay");

      await assert.rejects(
        async () =>
          fetchSolanaPayRequest(url, {
            method: "GET",
          }),
        {
          message: "URL must use HTTPS protocol",
        },
      );
    });

    it("should accept valid HTTPS URLs", async () => {
      const mockResponse = { data: "test" };
      mockFetch(mockResponse);

      const url = new URL("https://example.com/pay");
      const result = await fetchSolanaPayRequest(url, {
        method: "GET",
      });

      assert.deepEqual(result, mockResponse);
    });
  });

  describe("HTTP method and headers", () => {
    it("should make GET request with correct headers", async () => {
      const mockResponse = { data: "test" };
      let capturedRequest: RequestInit | undefined;

      globalThis.fetch = async (_url, init) => {
        capturedRequest = init;
        return {
          ok: true,
          status: 200,
          statusText: "OK",
          json: async () => mockResponse,
        } as unknown as Response;
      };

      const url = new URL("https://example.com/pay");
      await fetchSolanaPayRequest(url, {
        method: "GET",
      });

      assert.equal(capturedRequest?.method, "GET");
      assert.deepEqual(capturedRequest?.headers, {
        Accept: "application/json",
        "Accept-Encoding": "gzip, deflate, br",
      });
    });

    it("should make POST request with Content-Type header when body present", async () => {
      const mockResponse = { data: "test" };
      let capturedRequest: RequestInit | undefined;

      globalThis.fetch = async (_url, init) => {
        capturedRequest = init;
        return {
          ok: true,
          status: 200,
          statusText: "OK",
          json: async () => mockResponse,
        } as unknown as Response;
      };

      const url = new URL("https://example.com/pay");
      await fetchSolanaPayRequest(url, {
        method: "POST",
        body: { test: "data" },
      });

      assert.equal(capturedRequest?.method, "POST");
      assert.deepEqual(capturedRequest?.headers, {
        Accept: "application/json",
        "Accept-Encoding": "gzip, deflate, br",
        "Content-Type": "application/json",
      });
      assert.equal(capturedRequest?.body, JSON.stringify({ test: "data" }));
    });

    it("should merge custom headers from requestInit", async () => {
      const mockResponse = { data: "test" };
      let capturedRequest: RequestInit | undefined;

      globalThis.fetch = async (_url, init) => {
        capturedRequest = init;
        return {
          ok: true,
          status: 200,
          statusText: "OK",
          json: async () => mockResponse,
        } as unknown as Response;
      };

      const url = new URL("https://example.com/pay");
      await fetchSolanaPayRequest(url, {
        method: "GET",
        requestInit: {
          headers: {
            "X-Custom-Header": "custom-value",
          },
        },
      });

      assert.deepEqual(capturedRequest?.headers, {
        Accept: "application/json",
        "Accept-Encoding": "gzip, deflate, br",
        "X-Custom-Header": "custom-value",
      });
    });

    it("should JSON stringify body for POST requests", async () => {
      const mockResponse = { success: true };
      let capturedBody: string | undefined;

      globalThis.fetch = async (_url, init) => {
        capturedBody = init?.body as string;
        return {
          ok: true,
          status: 200,
          statusText: "OK",
          json: async () => mockResponse,
        } as unknown as Response;
      };

      const url = new URL("https://example.com/pay");
      const body = { account: "test123", amount: 100 };

      await fetchSolanaPayRequest(url, {
        method: "POST",
        body,
      });

      assert.equal(capturedBody, JSON.stringify(body));
    });
  });

  describe("Response handling - success", () => {
    it("should return raw JSON when no parser provided", async () => {
      const mockResponse = { data: "test", value: 123 };
      mockFetch(mockResponse);

      const url = new URL("https://example.com/pay");
      const result = await fetchSolanaPayRequest(url, {
        method: "GET",
      });

      assert.deepEqual(result, mockResponse);
    });

    it("should use parser function when provided", async () => {
      const mockResponse = { raw: "data" };
      mockFetch(mockResponse);

      const parser = (data: unknown) => {
        const d = data as { raw: string };
        return { parsed: d.raw.toUpperCase() };
      };

      const url = new URL("https://example.com/pay");
      const result = await fetchSolanaPayRequest(url, {
        method: "GET",
        parser,
      });

      assert.deepEqual(result, { parsed: "DATA" });
    });

    it("should handle GET request successfully", async () => {
      const mockResponse = { label: "Test", icon: "https://test.com/icon.png" };
      mockFetch(mockResponse);

      const url = new URL("https://example.com/pay");
      const result = await fetchSolanaPayRequest(url, {
        method: "GET",
      });

      assert.deepEqual(result, mockResponse);
    });

    it("should handle POST request successfully", async () => {
      const mockResponse = { transaction: "base64tx", message: "Success" };
      mockFetch(mockResponse);

      const url = new URL("https://example.com/pay");
      const result = await fetchSolanaPayRequest(url, {
        method: "POST",
        body: { account: "test123" },
      });

      assert.deepEqual(result, mockResponse);
    });
  });

  describe("Response handling - errors", () => {
    it("should throw on HTTP 4xx error", async () => {
      mockFetch({}, false, 404, "Not Found");

      const url = new URL("https://example.com/pay");

      await assert.rejects(
        async () =>
          fetchSolanaPayRequest(url, {
            method: "GET",
          }),
        {
          message: "HTTP 404: Not Found",
        },
      );
    });

    it("should throw on HTTP 5xx error", async () => {
      mockFetch({}, false, 500, "Internal Server Error");

      const url = new URL("https://example.com/pay");

      await assert.rejects(
        async () =>
          fetchSolanaPayRequest(url, {
            method: "GET",
          }),
        {
          message: "HTTP 500: Internal Server Error",
        },
      );
    });

    it("should throw descriptive error on invalid JSON", async () => {
      globalThis.fetch = async () =>
        ({
          ok: true,
          status: 200,
          statusText: "OK",
          json: async () => {
            throw new SyntaxError("Unexpected token < in JSON at position 0");
          },
        }) as unknown as Response;

      const url = new URL("https://example.com/pay");

      await assert.rejects(
        async () =>
          fetchSolanaPayRequest(url, {
            method: "GET",
          }),
        {
          message: "Failed to parse response as JSON: Unexpected token < in JSON at position 0",
        },
      );
    });

    it("should throw descriptive error on parser validation failure", async () => {
      const mockResponse = { invalid: "data" };
      mockFetch(mockResponse);

      const parser = (data: unknown) => {
        const d = data as any;
        if (!d.required) {
          throw new Error("Missing required field: required");
        }
        return d;
      };

      const url = new URL("https://example.com/pay");

      await assert.rejects(
        async () =>
          fetchSolanaPayRequest(url, {
            method: "GET",
            parser,
          }),
        {
          message: "Failed to validate response schema: Missing required field: required",
        },
      );
    });

    it("should handle non-Error thrown in JSON parsing", async () => {
      globalThis.fetch = async () =>
        ({
          ok: true,
          status: 200,
          statusText: "OK",
          json: async () => {
            throw "String error";
          },
        }) as unknown as Response;

      const url = new URL("https://example.com/pay");

      await assert.rejects(
        async () =>
          fetchSolanaPayRequest(url, {
            method: "GET",
          }),
        {
          message: "Failed to parse response as JSON: String error",
        },
      );
    });

    it("should handle non-Error thrown in parser", async () => {
      const mockResponse = { data: "test" };
      mockFetch(mockResponse);

      const parser = () => {
        throw "Parser failed";
      };

      const url = new URL("https://example.com/pay");

      await assert.rejects(
        async () =>
          fetchSolanaPayRequest(url, {
            method: "GET",
            parser,
          }),
        {
          message: "Failed to validate response schema: Parser failed",
        },
      );
    });
  });

  describe("Edge cases", () => {
    it("should handle request with body but no Content-Type if method is GET", async () => {
      const mockResponse = { data: "test" };
      let capturedRequest: RequestInit | undefined;

      globalThis.fetch = async (_url, init) => {
        capturedRequest = init;
        return {
          ok: true,
          status: 200,
          statusText: "OK",
          json: async () => mockResponse,
        } as unknown as Response;
      };

      const url = new URL("https://example.com/pay");
      await fetchSolanaPayRequest(url, {
        method: "GET",
        body: { test: "data" },
      });

      // Should have Content-Type because body is present
      assert.deepEqual(capturedRequest?.headers, {
        Accept: "application/json",
        "Accept-Encoding": "gzip, deflate, br",
        "Content-Type": "application/json",
      });
    });

    it("should handle POST without body", async () => {
      const mockResponse = { data: "test" };
      let capturedRequest: RequestInit | undefined;

      globalThis.fetch = async (_url, init) => {
        capturedRequest = init;
        return {
          ok: true,
          status: 200,
          statusText: "OK",
          json: async () => mockResponse,
        } as unknown as Response;
      };

      const url = new URL("https://example.com/pay");
      await fetchSolanaPayRequest(url, {
        method: "POST",
      });

      assert.equal(capturedRequest?.method, "POST");
      assert.equal(capturedRequest?.body, undefined);
      // Content-Type should be added for POST even without body
      assert.deepEqual(capturedRequest?.headers, {
        Accept: "application/json",
        "Accept-Encoding": "gzip, deflate, br",
        "Content-Type": "application/json",
      });
    });

    it("should handle empty response object", async () => {
      mockFetch({});

      const url = new URL("https://example.com/pay");
      const result = await fetchSolanaPayRequest(url, {
        method: "GET",
      });

      assert.deepEqual(result, {});
    });

    it("should handle parser that transforms data", async () => {
      const mockResponse = {
        firstName: "John",
        lastName: "Doe",
      };
      mockFetch(mockResponse);

      const parser = (data: unknown) => {
        const d = data as { firstName: string; lastName: string };
        return {
          fullName: `${d.firstName} ${d.lastName}`,
        };
      };

      const url = new URL("https://example.com/pay");
      const result = await fetchSolanaPayRequest(url, {
        method: "GET",
        parser,
      });

      assert.deepEqual(result, { fullName: "John Doe" });
    });

    it("should pass through all requestInit options", async () => {
      const mockResponse = { data: "test" };
      let capturedRequest: RequestInit | undefined;

      globalThis.fetch = async (_url, init) => {
        capturedRequest = init;
        return {
          ok: true,
          status: 200,
          statusText: "OK",
          json: async () => mockResponse,
        } as unknown as Response;
      };

      const url = new URL("https://example.com/pay");
      await fetchSolanaPayRequest(url, {
        method: "GET",
        requestInit: {
          signal: new AbortController().signal,
          cache: "no-cache",
        },
      });

      assert.equal(capturedRequest?.cache, "no-cache");
      assert.ok(capturedRequest?.signal);
    });
  });
});
