/* eslint-disable @typescript-eslint/ban-ts-comment */
import type {
  Address,
  BaseTransactionMessage,
  Instruction,
  KeyPairSigner,
  TransactionMessageWithBlockhashLifetime,
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

    const txNotSignable = createTransaction({
      version: "legacy",
      feePayer: signer,
      instructions: [ix],
      // @ts-expect-error Should not have a Lifetime
    }) satisfies TransactionMessageWithBlockhashLifetime;

    signTransactionMessageWithSigners(txNotSignable);

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

    const txNotSignable = createTransaction({
      version: 0,
      feePayer: feePayer,
      instructions: [ix],
      // @ts-expect-error Should not have a Lifetime
    }) satisfies TransactionMessageWithBlockhashLifetime;

    signTransactionMessageWithSigners(txNotSignable);

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
  }
}
