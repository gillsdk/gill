import assert from "node:assert";

import { transactionFromBase64 } from "gill";
import { parseSolanaPayGetResponse, parseSolanaPayPostResponse, SolanaPayResponseError } from "../response.js";

describe("parseSolanaPayGetResponse", () => {
  it("should parse valid GET response", () => {
    const data = {
      label: "Test Store",
      icon: "https://example.com/icon.png",
    };

    const result = parseSolanaPayGetResponse(data);
    assert.deepEqual(result, data);
  });

  it("should throw error for missing label", () => {
    const data = {
      icon: "https://example.com/icon.png",
    };

    assert.throws(
      () => parseSolanaPayGetResponse(data),
      (err: SolanaPayResponseError) => {
        assert(err instanceof SolanaPayResponseError);
        assert.equal(err.message, "Invalid response: missing or invalid label");
        return true;
      },
    );
  });

  it("should throw error for invalid label type", () => {
    const data = {
      label: 123, // Should be string
      icon: "https://example.com/icon.png",
    };

    assert.throws(
      () => parseSolanaPayGetResponse(data),
      (err: SolanaPayResponseError) => {
        assert(err instanceof SolanaPayResponseError);
        assert.equal(err.message, "Invalid response: missing or invalid label");
        return true;
      },
    );
  });

  it("should throw error for missing icon", () => {
    const data = {
      label: "Test Store",
    };

    assert.throws(
      () => parseSolanaPayGetResponse(data),
      (err: SolanaPayResponseError) => {
        assert(err instanceof SolanaPayResponseError);
        assert.equal(err.message, "Invalid response: missing or invalid icon");
        return true;
      },
    );
  });

  it("should throw error for invalid icon URL format", () => {
    const data = {
      label: "Test Store",
      icon: "not-a-url",
    };

    assert.throws(
      () => parseSolanaPayGetResponse(data),
      (err: SolanaPayResponseError) => {
        assert(err instanceof SolanaPayResponseError);
        assert.equal(err.message, "Invalid icon URL format");
        return true;
      },
    );
  });

  it("should throw error for non-HTTP(S) icon URL", () => {
    const data = {
      label: "Test Store",
      icon: "ftp://example.com/icon.png",
    };

    assert.throws(
      () => parseSolanaPayGetResponse(data),
      (err: SolanaPayResponseError) => {
        assert(err instanceof SolanaPayResponseError);
        assert.equal(err.message, "Icon URL must use HTTP or HTTPS protocol");
        return true;
      },
    );
  });

  it("should throw error for invalid icon format", () => {
    const data = {
      label: "Test Store",
      icon: "https://example.com/icon.gif",
    };

    assert.throws(
      () => parseSolanaPayGetResponse(data),
      (err: SolanaPayResponseError) => {
        assert(err instanceof SolanaPayResponseError);
        assert.equal(err.message, "Icon must be SVG, PNG, WebP, or JPEG format");
        return true;
      },
    );
  });

  it("should accept valid icon formats", () => {
    const formats = [".svg", ".png", ".webp", ".jpg", ".jpeg"];

    for (const format of formats) {
      const data = {
        label: "Test Store",
        icon: `https://example.com/icon${format}`,
      };

      const result = parseSolanaPayGetResponse(data);
      assert.equal(result.icon, data.icon);
    }
  });

  it("should handle case-insensitive file extensions", () => {
    const data = {
      label: "Test Store",
      icon: "https://example.com/icon.PNG",
    };

    const result = parseSolanaPayGetResponse(data);
    assert.equal(result.icon, data.icon);
  });
});

describe("parseSolanaPayPostResponse", () => {
  const unsignedTransaction =
    "AQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAABAAABC7YxPJkVXZH3qqq8Nq1nwYa5Pm6+M9ZeObND0CCtBLXjfKbGfbEEIU1AEH81ttgpyiNLO+xurYCsjdCVcfR4YQA=";
  const signedTransaction =
    "Ace42d/o4XA3NGfL6hslysKyc8kB0ILDUT6diotxWdxP1cdt+oNWGztxEPb5t0F797swnV7NLCguh94nGqetQwABAAABHQ6Thk3MgV/D8oYYCRHQCj/SBt4xoclCh8tD8F/J8rXjfKbGfbEEIU1AEH81ttgpyiNLO+xurYCsjdCVcfR4YQA=";

  const unsignedTx = transactionFromBase64(unsignedTransaction);
  const signedTx = transactionFromBase64(signedTransaction);

  it("should parse valid POST response (unsigned transaction)", () => {
    const data = {
      transaction: unsignedTransaction,
      message: "Payment successful",
    };

    const result = parseSolanaPayPostResponse(data);
    assert.equal(result.message, data.message);
    assert.deepEqual(result.transaction, unsignedTx);
  });

  it("should parse valid POST response (signed transaction)", () => {
    const data = {
      transaction: signedTransaction,
      message: "Payment successful",
    };

    const result = parseSolanaPayPostResponse(data);
    assert.equal(result.message, data.message);
    assert.deepEqual(result.transaction, signedTx);
  });

  it("should parse POST response without message", () => {
    const data = {
      // transaction: "dGVzdA==", // "test" in base64
      transaction: unsignedTransaction,
    };

    const result = parseSolanaPayPostResponse(data);
    assert.equal(result.message, undefined);
    assert.deepEqual(result.transaction, unsignedTx);
  });

  it("should throw error for missing transaction", () => {
    const data = {
      message: "Payment successful",
    };

    assert.throws(
      () => parseSolanaPayPostResponse(data),
      (err: SolanaPayResponseError) => {
        assert(err instanceof SolanaPayResponseError);
        assert.equal(err.message, "Invalid response: missing or invalid transaction");
        return true;
      },
    );
  });

  it("should throw error for non-string transaction", () => {
    const data = {
      transaction: 123, // Should be string
    };

    assert.throws(
      () => parseSolanaPayPostResponse(data),
      (err: SolanaPayResponseError) => {
        assert(err instanceof SolanaPayResponseError);
        assert.equal(err.message, "Invalid response: missing or invalid transaction");
        return true;
      },
    );
  });

  it("should throw error for empty transaction", () => {
    const data = {
      transaction: "",
    };

    assert.throws(
      () => parseSolanaPayPostResponse(data),
      (err: SolanaPayResponseError) => {
        assert(err instanceof SolanaPayResponseError);
        assert.equal(err.message, "Invalid response: missing or invalid transaction");
        return true;
      },
    );
  });

  it("should throw error for invalid message type", () => {
    const data = {
      transaction: unsignedTransaction,
      message: 123, // Should be string
    };

    assert.throws(
      () => parseSolanaPayPostResponse(data),
      (err: SolanaPayResponseError) => {
        assert(err instanceof SolanaPayResponseError);
        assert.equal(err.message, "Invalid response: message must be string");
        return true;
      },
    );
  });
});
