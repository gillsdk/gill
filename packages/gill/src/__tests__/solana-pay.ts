import { address } from "@solana/kit";

import {
  createTransferRequestURL,
  createTransactionRequestURL,
  parseSolanaPayURL,
  validateSolanaPayURL,
  extractReferenceKeys,
  toQRCodeURL,
} from "../core";

import { SolanaPayError } from "../types";

describe("createTransferRequestURL", () => {
  const recipient = address("11111111111111111111111111111112");
  const token = address("EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v");
  const ref = address("11111111111111111111111111111113");

  test("basic transfer", () => {
    const url = createTransferRequestURL({ recipient });
    expect(url).toBe("solana:11111111111111111111111111111112");
  });

  test("with amount", () => {
    const url = createTransferRequestURL({ recipient, amount: 0.001 });
    expect(url).toBe("solana:11111111111111111111111111111112?amount=0.001");
  });

  test("with spl token", () => {
    const url = createTransferRequestURL({ recipient, splToken: token });
    expect(url).toBe("solana:11111111111111111111111111111112?spl-token=EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v");
  });

  test("with reference", () => {
    const url = createTransferRequestURL({ recipient, reference: [ref] });
    expect(url).toBe("solana:11111111111111111111111111111112?reference=11111111111111111111111111111113");
  });

  test("with label and message", () => {
    const url = createTransferRequestURL({ 
      recipient, 
      label: "Coffee Shop", 
      message: "Thanks" 
    });
    expect(url).toBe("solana:11111111111111111111111111111112?label=Coffee+Shop&message=Thanks");
  });

  test("with all parameters", () => {
    const url = createTransferRequestURL({
      recipient,
      amount: 5,
      splToken: token,
      reference: [ref],
      label: "Shop",
      message: "Payment",
      memo: "Order 123"
    });
    expect(url).toContain("amount=5");
    expect(url).toContain("spl-token=EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v");
    expect(url).toContain("reference=11111111111111111111111111111113");
  });

  test("unencoded option", () => {
    const url = createTransferRequestURL(
      { recipient, label: "Coffee & Tea" },
      { encode: false }
    );
    expect(url).toContain("Coffee & Tea");
  });

  test("throws on invalid recipient", () => {
    expect(() => {
      createTransferRequestURL({ recipient: "xyz" as any });
    }).toThrow(SolanaPayError);
  });

  test("throws on invalid token", () => {
    expect(() => {
      createTransferRequestURL({ recipient, splToken: "xyz" as any });
    }).toThrow(SolanaPayError);
  });
});

describe("createTransactionRequestURL", () => {
  test("basic transaction", () => {
    const url = createTransactionRequestURL({ 
      link: "https://example.com/api/pay" 
    });
    expect(url).toBe("solana:https://example.com/api/pay");
  });

  test("with parameters", () => {
    const url = createTransactionRequestURL({
      link: "https://example.com/pay?order=123"
    });
    expect(url).toBe("solana:https://example.com/pay?order=123");
  });

  test("throws on http", () => {
    expect(() => {
      createTransactionRequestURL({ link: "http://example.com" });
    }).toThrow(SolanaPayError);
  });

  test("throws on invalid url", () => {
    expect(() => {
      createTransactionRequestURL({ link: "not-a-url" });
    }).toThrow(SolanaPayError);
  });
});

describe("parseSolanaPayURL", () => {
  const recipient = address("11111111111111111111111111111112");

  test("basic transfer", () => {
    const data = parseSolanaPayURL("solana:11111111111111111111111111111112");
    expect(data.type).toBe("transfer");
    expect(data.params.recipient).toBe("11111111111111111111111111111112");
  });

  test("transfer with amount", () => {
    const data = parseSolanaPayURL("solana:11111111111111111111111111111112?amount=0.001");
    expect(data.type).toBe("transfer");
    expect(data.params.amount).toBe(0.001);
  });

  test("transfer with spl token", () => {
    const data = parseSolanaPayURL(
      "solana:11111111111111111111111111111112?spl-token=EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v"
    );
    expect(data.type).toBe("transfer");
    expect(data.params.splToken).toBe("EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v");
  });

  test("transaction request", () => {
    const data = parseSolanaPayURL("solana:https://example.com/api");
    expect(data.type).toBe("transaction");
    expect(data.params.link).toBe("https://example.com/api");
  });

  test("with encoded parameters", () => {
    const data = parseSolanaPayURL(
      "solana:11111111111111111111111111111112?label=Coffee+Shop&message=Thank+you"
    );
    expect(data.type).toBe("transfer");
    expect(data.params.label).toBe("Coffee Shop");
    expect(data.params.message).toBe("Thank you");
  });

  test("throws on invalid scheme", () => {
    expect(() => {
      parseSolanaPayURL("bitcoin:11111111111111111111111111111112");
    }).toThrow(SolanaPayError);
  });

  test("throws on invalid recipient", () => {
    expect(() => {
      parseSolanaPayURL("solana:xyz");
    }).toThrow(SolanaPayError);
  });

  test("throws on negative amount", () => {
    expect(() => {
      parseSolanaPayURL("solana:11111111111111111111111111111112?amount=-1");
    }).toThrow(SolanaPayError);
  });
});

describe("validateSolanaPayURL", () => {
  test("valid transfer url", () => {
    const valid = validateSolanaPayURL("solana:11111111111111111111111111111112");
    expect(valid).toBe(true);
  });

  test("valid transaction url", () => {
    const valid = validateSolanaPayURL("solana:https://example.com/api");
    expect(valid).toBe(true);
  });

  test("invalid scheme", () => {
    const valid = validateSolanaPayURL("bitcoin:address");
    expect(valid).toBe(false);
  });

  test("invalid recipient", () => {
    const valid = validateSolanaPayURL("solana:xyz");
    expect(valid).toBe(false);
  });
});

describe("extractReferenceKeys", () => {
  test("with reference", () => {
    const refs = extractReferenceKeys(
      "solana:11111111111111111111111111111112?reference=11111111111111111111111111111113"
    );
    expect(refs).toEqual(["11111111111111111111111111111113"]);
  });

  test("with multiple references", () => {
    const refs = extractReferenceKeys(
      "solana:11111111111111111111111111111112?reference=11111111111111111111111111111113&reference=11111111111111111111111111111114"
    );
    expect(refs).toEqual([
      "11111111111111111111111111111113",
      "11111111111111111111111111111114"
    ]);
  });

  test("without reference", () => {
    const refs = extractReferenceKeys("solana:11111111111111111111111111111112");
    expect(refs).toEqual([]);
  });

  test("transaction request", () => {
    const refs = extractReferenceKeys("solana:https://example.com/api");
    expect(refs).toEqual([]);
  });
});

describe("toQRCodeURL", () => {
  test("valid url", () => {
    const qr = toQRCodeURL("solana:11111111111111111111111111111112");
    expect(qr).toBe("solana:11111111111111111111111111111112");
  });

  test("throws on invalid url", () => {
    expect(() => {
      toQRCodeURL("invalid-url");
    }).toThrow(SolanaPayError);
  });
});

describe("SolanaPayError", () => {
  test("creates error with message and code", () => {
    const error = new SolanaPayError("Test error", "TEST_CODE");
    expect(error.message).toBe("Test error");
    expect(error.code).toBe("TEST_CODE");
    expect(error.name).toBe("SolanaPayError");
    expect(error).toBeInstanceOf(Error);
  });
});
