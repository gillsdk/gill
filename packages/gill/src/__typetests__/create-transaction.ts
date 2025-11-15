/* eslint-disable @typescript-eslint/ban-ts-comment */
import type {
  Address,
  BaseTransactionMessage,
  Instruction,
  KeyPairSigner,
  TransactionMessageWithBlockhashLifetime,
  TransactionMessageWithDurableNonceLifetime,
  TransactionMessageWithFeePayer,
  TransactionMessageWithFeePayerSigner,
} from "@solana/kit";
import { signTransactionMessageWithSigners } from "@solana/kit";

import { createTransaction } from "../core";

// [DESCRIBE] createTransaction
{
  const feePayer = null as unknown as Address;
  const signer = null as unknown as KeyPairSigner;
  const latestBlockhash = null as unknown as TransactionMessageWithBlockhashLifetime["lifetimeConstraint"];
  const durableNonce = null as unknown as TransactionMessageWithDurableNonceLifetime["lifetimeConstraint"];

  const ix = null as unknown as Instruction;

  // Legacy transactions
  {
    createTransaction({
      // version: "legacy", // no `version` set should result in a legacy transaction
      feePayer: feePayer,
      instructions: [ix],
      computeUnitLimit: 0,
      computeUnitPrice: 0,
    }) satisfies BaseTransactionMessage<"legacy"> & TransactionMessageWithFeePayer;

    createTransaction({
      version: "legacy",
      feePayer: feePayer,
      instructions: [ix],
      computeUnitLimit: 0,
      computeUnitPrice: 0,
    }) satisfies BaseTransactionMessage<"legacy"> & TransactionMessageWithFeePayer;

    createTransaction({
      version: "legacy",
      feePayer: signer,
      instructions: [ix],
    }) satisfies BaseTransactionMessage<"legacy"> & TransactionMessageWithFeePayerSigner;

    createTransaction({
      version: "legacy",
      feePayer: feePayer,
      instructions: [ix],
      // @ts-expect-error Should not have a Lifetime
    }) satisfies TransactionMessageWithBlockhashLifetime;

    // Should be legacy with a Lifetime and Signer
    createTransaction({
      version: "legacy",
      feePayer: signer,
      instructions: [ix],
      latestBlockhash,
    }) satisfies BaseTransactionMessage<"legacy"> &
      TransactionMessageWithBlockhashLifetime &
      TransactionMessageWithFeePayerSigner;

    createTransaction({
      // version: "legacy", // no `version` set should result in a legacy transaction
      feePayer: signer,
      instructions: [ix],
      latestBlockhash,
    }) satisfies BaseTransactionMessage<"legacy"> &
      TransactionMessageWithBlockhashLifetime &
      TransactionMessageWithFeePayerSigner;

    // Should be legacy with a Lifetime and address (aka non Signer)
    const txSignable = createTransaction({
      version: "legacy",
      feePayer: feePayer,
      instructions: [ix],
      latestBlockhash,
    }) satisfies BaseTransactionMessage<"legacy"> &
      TransactionMessageWithBlockhashLifetime &
      TransactionMessageWithFeePayer;

    createTransaction({
      version: "legacy",
      feePayer: feePayer,
      instructions: [ix],
      latestBlockhash,
      // @ts-expect-error Should not be a "fee payer signer"
    }) satisfies TransactionMessageWithFeePayerSigner;

    // Should be a signable transaction
    signTransactionMessageWithSigners(txSignable);
  }

  // Version 0 transactions
  {
    createTransaction({
      version: 0,
      feePayer: feePayer,
      instructions: [ix],
      computeUnitLimit: 0,
      computeUnitPrice: 0,
    }) satisfies BaseTransactionMessage<0> & TransactionMessageWithFeePayer;

    createTransaction({
      version: 0,
      feePayer: signer,
      instructions: [ix],
    }) satisfies BaseTransactionMessage<0> & TransactionMessageWithFeePayerSigner;

    createTransaction({
      version: 0,
      feePayer: signer,
      instructions: [ix],
      // @ts-expect-error Should not have a Lifetime
    }) satisfies TransactionMessageWithBlockhashLifetime;

    // Should be version 0 with a Lifetime and Signer
    createTransaction({
      version: 0,
      feePayer: signer,
      instructions: [ix],
      latestBlockhash,
    }) satisfies BaseTransactionMessage<0> &
      TransactionMessageWithBlockhashLifetime &
      TransactionMessageWithFeePayerSigner;

    // Should be version 0 with a Lifetime and address (aka non Signer)
    const txSignable = createTransaction({
      version: 0,
      feePayer: feePayer,
      instructions: [ix],
      latestBlockhash,
    }) satisfies BaseTransactionMessage<0> & TransactionMessageWithBlockhashLifetime & TransactionMessageWithFeePayer;

    createTransaction({
      version: 0,
      feePayer: feePayer,
      instructions: [ix],
      latestBlockhash,
      // @ts-expect-error Should not be a "fee payer signer"
    }) satisfies TransactionMessageWithFeePayerSigner;

    // Should be a signable transaction
    signTransactionMessageWithSigners(txSignable);

    // Should be version 0 with a Durable Nonce Lifetime and Signer
    createTransaction({
      version: 0,
      feePayer: signer,
      instructions: [ix],
      durableNonce,
    }) satisfies BaseTransactionMessage<0> &
      TransactionMessageWithDurableNonceLifetime &
      TransactionMessageWithFeePayerSigner;

    // Should be version 0 with a Durable Nonce Lifetime and address (aka non Signer)
    const txDurableNonceSignable = createTransaction({
      version: 0,
      feePayer: feePayer,
      instructions: [ix],
      durableNonce,
    }) satisfies BaseTransactionMessage<0> &
      TransactionMessageWithDurableNonceLifetime &
      TransactionMessageWithFeePayer;

    createTransaction({
      version: 0,
      feePayer: feePayer,
      instructions: [ix],
      durableNonce,
      // @ts-expect-error Should not be a "fee payer signer"
    }) satisfies TransactionMessageWithFeePayerSigner;

    // Should be a signable transaction
    signTransactionMessageWithSigners(txDurableNonceSignable);

    
  }
}