import assert from "node:assert";

import { getMinimumBalanceForRentExemption } from "../core";

/**
 * Note: Each of the values checked against were obtained directly from the
 * `getMinimumBalanceForRentExemption` RPC call
 */

describe("getMinimumBalanceForRentExemption", () => {
  it("default lamports (no extra space)", () => {
    const lamports = getMinimumBalanceForRentExemption();
    assert.equal(lamports, 890_880n);
  });
  it("0 bytes (explicitly passed)", () => {
    const lamports = getMinimumBalanceForRentExemption(0);
    assert.equal(lamports, 890_880n);
  });
  it("1 byte of space (as number)", () => {
    const lamports = getMinimumBalanceForRentExemption(1);
    assert.equal(lamports, 897_840n);
  });
  it("1 byte of space (as bigint)", () => {
    const lamports = getMinimumBalanceForRentExemption(1n);
    assert.equal(lamports, 897_840n);
  });
  it("50 bytes of space (as number)", () => {
    const lamports = getMinimumBalanceForRentExemption(50);
    assert.equal(lamports, 1_238_880n);
  });
  it("50 bytes of space (as bigint)", () => {
    const lamports = getMinimumBalanceForRentExemption(50n);
    assert.equal(lamports, 1_238_880n);
  });
  it("1k bytes of space", () => {
    const lamports = getMinimumBalanceForRentExemption(1_000);
    assert.equal(lamports, 7_850_880n);
  });
});
