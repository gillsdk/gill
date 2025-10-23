// @ts-ignore - Patch BigInt to allow calling `JSON.stringify` on objects that use
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

export * from "./const.js";
export * from "./hooks/index.js";
export * from "./providers.js";

// Exported to resolve ambiguity between Gill and Wallet Standard.
export { useWallets } from "./hooks/wallets.js";
export { useSignAndSendTransaction } from "./hooks/sign-and-send-transaction.js";
export { useSignTransaction } from "./hooks/sign-transaction.js";
export { useSignAllTransactions } from "./hooks/sign-all-transactions.js";
export { useSignMessage } from "./hooks/sign-message.js";
export { useSignIn } from "./hooks/sign-in.js";

/**
 * Reexporting the Solana Wallet Standard functionality allows gill to
 * provide a cohesive developer experience
 */
export * from "@solana/react";
export * from "@solana/wallet-standard-chains";
export * from "@solana/wallet-standard-features";
export * from "@wallet-standard/core";
export * from "@wallet-standard/react";
export * from "@wallet-standard/ui";
