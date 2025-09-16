// @ts-expect-error - Patch BigInt to allow calling `JSON.stringify` on objects that use
// eslint-disable-next-line no-unused-vars
interface BigInt {
  /** Convert a BigInt to string form when calling `JSON.stringify()` */
  toJSON: () => string;
}

// @ts-ignore - Only add the toJSON method if it doesn't already exist
if (BigInt.prototype.toJSON === undefined) {
  // @ts-ignore - toJSON does not exist which is why we are patching it
  BigInt.prototype.toJSON = function () {
    return String(this);
  };
}

export * from "./const";
export * from "./hooks";
export * from "./providers";

/**
 * Reexporting the Solana Wallet Standard functionality allows gill to
 * provide a cohesive developer experience
 */
export * from "@solana/react";
