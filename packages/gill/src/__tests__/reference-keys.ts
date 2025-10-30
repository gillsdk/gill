import { AccountRole, Address, BaseTransactionMessage, SolanaError } from "@solana/kit";

import { insertReferenceKeysToTransactionMessage, insertReferenceKeyToTransactionMessage } from "../core";

// Mock for BaseTransactionMessage
const createMockTransaction = (instructions: any[]): BaseTransactionMessage => {
  return Object.freeze({
    instructions: Object.freeze(instructions),
    // Add other required properties of BaseTransactionMessage interface if needed
  }) as unknown as BaseTransactionMessage;
};

describe("insertReferenceKeyToTransactionMessage", () => {
  const referenceKey = "someReferenceAddress" as Address;

  const memoInstruction = {
    accounts: [],
    programAddress: "MemoSq4gqABAXKb96qnH8TysNcWxMyWCqXgDLGmfcHr" as Address,
  };

  it("should insert a single reference key into transaction message", () => {
    const nonMemoInstruction = {
      accounts: [{ address: "account1" as Address, role: AccountRole.READONLY }],
      programAddress: "SomeProgram",
    };
    const transaction = createMockTransaction([nonMemoInstruction]);

    const result = insertReferenceKeyToTransactionMessage(referenceKey, transaction);

    expect(result).not.toBe(transaction); // Should return a new object (immutability)
    expect(result.instructions).toHaveLength(1);
    expect(result.instructions[0].accounts).toHaveLength(2);
    expect(result.instructions[0].accounts?.[1]).toEqual({
      address: referenceKey,
      role: AccountRole.READONLY,
    });
  });

  it("should throw an error if transaction has no instructions", () => {
    const transaction = createMockTransaction([]);

    expect(() => {
      insertReferenceKeyToTransactionMessage(referenceKey, transaction);
    }).toThrow(SolanaError);
  });

  it("should throw an error if transaction has only memo instructions", () => {
    const transaction = createMockTransaction([memoInstruction]);

    expect(() => {
      insertReferenceKeyToTransactionMessage(referenceKey, transaction);
    }).toThrow(SolanaError);
  });

  it("should modify the first non-memo instruction when when memo is first", () => {
    const nonMemoInstruction = {
      accounts: [{ address: "account1" as Address, role: AccountRole.READONLY }],
      programAddress: "SomeProgram",
    };
    const transaction = createMockTransaction([memoInstruction, nonMemoInstruction]);

    const result = insertReferenceKeyToTransactionMessage(referenceKey, transaction);

    expect(result.instructions).toHaveLength(2);
    expect(result.instructions[0]).toEqual(memoInstruction); // First instruction unchanged
    expect(result.instructions[1].accounts).toHaveLength(2);
    expect(result.instructions[1].accounts?.[1]).toEqual({
      address: referenceKey,
      role: AccountRole.READONLY,
    });
  });

  it("should modify the first non-memo instruction when when memo is NOT first", () => {
    const nonMemoInstruction = {
      accounts: [{ address: "account1" as Address, role: AccountRole.READONLY }],
      programAddress: "SomeProgram",
    };
    const transaction = createMockTransaction([nonMemoInstruction, memoInstruction]);

    const result = insertReferenceKeyToTransactionMessage(referenceKey, transaction);

    expect(result.instructions).toHaveLength(2);
    expect(result.instructions[1]).toEqual(memoInstruction); // First instruction unchanged
    expect(result.instructions[0].accounts).toHaveLength(2);
    expect(result.instructions[0].accounts?.[1]).toEqual({
      address: referenceKey,
      role: AccountRole.READONLY,
    });
  });

  it("should handle instructions without existing accounts array", () => {
    const nonMemoInstruction = {
      programAddress: "SomeProgram",
      // No accounts array
    };
    const transaction = createMockTransaction([nonMemoInstruction]);

    const result = insertReferenceKeyToTransactionMessage(referenceKey, transaction);

    expect(result.instructions[0].accounts).toHaveLength(1);
    expect(result.instructions[0].accounts?.[0]).toEqual({
      address: referenceKey,
      role: AccountRole.READONLY,
    });
  });
});

describe("insertReferenceKeysToTransactionMessage", () => {
  it("should insert multiple reference keys into transaction message", () => {
    const referenceKeys = [
      "referenceAddress1" as Address,
      "referenceAddress2" as Address,
      "referenceAddress3" as Address,
    ];
    const nonMemoInstruction = {
      accounts: [{ address: "account1" as Address, role: AccountRole.READONLY }],
      programAddress: "SomeProgram",
    };
    const transaction = createMockTransaction([nonMemoInstruction]);

    const result = insertReferenceKeysToTransactionMessage(referenceKeys, transaction);

    expect(result.instructions[0].accounts).toHaveLength(4); // 1 original + 3 references

    expect(result.instructions[0].accounts?.[1]).toEqual({
      address: referenceKeys[0],
      role: AccountRole.READONLY,
    });
    expect(result.instructions[0].accounts?.[2]).toEqual({
      address: referenceKeys[1],
      role: AccountRole.READONLY,
    });
    expect(result.instructions[0].accounts?.[3]).toEqual({
      address: referenceKeys[2],
      role: AccountRole.READONLY,
    });
  });

  it("should handle empty reference keys array", () => {
    const referenceKeys: Address[] = [];
    const nonMemoInstruction = {
      accounts: [{ address: "account1" as Address, role: AccountRole.READONLY }],
      programAddress: "SomeProgram",
    };
    const transaction = createMockTransaction([nonMemoInstruction]);

    const result = insertReferenceKeysToTransactionMessage(referenceKeys, transaction);

    expect(result.instructions[0].accounts).toHaveLength(1); // No changes to accounts
    expect(result).not.toBe(transaction); // Still returns a new object
  });

  it("should throw an error if transaction has no instructions", () => {
    const referenceKeys = ["someReferenceAddress" as Address];
    const transaction = createMockTransaction([]);

    expect(() => {
      insertReferenceKeysToTransactionMessage(referenceKeys, transaction);
    }).toThrow(SolanaError);
  });

  it("should preserve transaction immutability", () => {
    const referenceKeys = ["referenceAddress1" as Address];
    const originalInstruction = {
      accounts: [{ address: "account1" as Address, role: AccountRole.READONLY }],
      programAddress: "SomeProgram",
    };
    const transaction = createMockTransaction([originalInstruction]);
    const originalInstructionsLength = transaction.instructions.length;
    const originalAccountsLength = transaction.instructions[0].accounts?.length || 0;

    const result = insertReferenceKeysToTransactionMessage(referenceKeys, transaction);

    expect(transaction.instructions).toHaveLength(originalInstructionsLength);
    expect(transaction.instructions[0].accounts?.length).toBe(originalAccountsLength);
    expect(result.instructions[0].accounts?.length).toBe(originalAccountsLength + 1);
  });

  it("should handle instruction with different account roles", () => {
    const referenceKeys = ["referenceAddress1" as Address];
    const nonMemoInstruction = {
      accounts: [
        { address: "account1" as Address, role: AccountRole.READONLY },
        { address: "account2" as Address, role: AccountRole.WRITABLE },
        { address: "account3" as Address, role: AccountRole.READONLY_SIGNER },
        { address: "account4" as Address, role: AccountRole.WRITABLE_SIGNER },
      ],
      programAddress: "SomeProgram",
    };
    const transaction = createMockTransaction([nonMemoInstruction]);

    const result = insertReferenceKeysToTransactionMessage(referenceKeys, transaction);

    expect(result.instructions[0].accounts).toHaveLength(5);
    // Original accounts are preserved with their roles
    expect(result.instructions[0].accounts?.[0].role).toBe(AccountRole.READONLY);
    expect(result.instructions[0].accounts?.[1].role).toBe(AccountRole.WRITABLE);
    expect(result.instructions[0].accounts?.[2].role).toBe(AccountRole.READONLY_SIGNER);
    expect(result.instructions[0].accounts?.[3].role).toBe(AccountRole.WRITABLE_SIGNER);
    // New reference is added with READONLY role
    expect(result.instructions[0].accounts?.[4].address).toBe(referenceKeys[0]);
    expect(result.instructions[0].accounts?.[4].role).toBe(AccountRole.READONLY);
  });
});
