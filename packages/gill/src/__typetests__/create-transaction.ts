 
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
      
      computeUnitLimit: 0,
      
computeUnitPrice: 0,
      // version: "legacy", // no `version` set should result in a legacy transaction
feePayer: feePayer,
      instructions: [ix],
    }) satisfies BaseTransactionMessage<"legacy"> & TransactionMessageWithFeePayer;

    createTransaction({
      computeUnitLimit: 0,
      computeUnitPrice: 0,
      feePayer: feePayer,
      instructions: [ix],
      version: "legacy",
    }) satisfies BaseTransactionMessage<"legacy"> & TransactionMessageWithFeePayer;

    createTransaction({
      feePayer: signer,
      instructions: [ix],
      version: "legacy",
    }) satisfies BaseTransactionMessage<"legacy"> & TransactionMessageWithFeePayerSigner;

    createTransaction({
      feePayer: feePayer,
      instructions: [ix],
      version: "legacy",
      // @ts-expect-error Should not have a Lifetime
    }) satisfies TransactionMessageWithBlockhashLifetime;

    const txNotSignable = createTransaction({
      feePayer: signer,
      instructions: [ix],
      version: "legacy",
      // @ts-expect-error Should not have a Lifetime
    }) satisfies TransactionMessageWithBlockhashLifetime;

    // @ts-expect-error Should not be a signable transaction
    signTransactionMessageWithSigners(txNotSignable);

    // Should be legacy with a Lifetime and Signer
    createTransaction({
      feePayer: signer,
      instructions: [ix],
      latestBlockhash,
      version: "legacy",
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
      feePayer: feePayer,
      instructions: [ix],
      latestBlockhash,
      version: "legacy",
    }) satisfies BaseTransactionMessage<"legacy"> &
      TransactionMessageWithBlockhashLifetime &
      TransactionMessageWithFeePayer;

    createTransaction({
      feePayer: feePayer,
      instructions: [ix],
      latestBlockhash,
      version: "legacy",
      // @ts-expect-error Should not be a "fee payer signer"
    }) satisfies TransactionMessageWithFeePayerSigner;

    // Should be a signable transaction
    signTransactionMessageWithSigners(txSignable);
  }

  // Version 0 transactions
  {
    createTransaction({
      computeUnitLimit: 0,
      computeUnitPrice: 0,
      feePayer: feePayer,
      instructions: [ix],
      version: 0,
    }) satisfies BaseTransactionMessage<0> & TransactionMessageWithFeePayer;

    createTransaction({
      feePayer: signer,
      instructions: [ix],
      version: 0,
    }) satisfies BaseTransactionMessage<0> & TransactionMessageWithFeePayerSigner;

    const txNotSignable = createTransaction({
      feePayer: feePayer,
      instructions: [ix],
      version: 0,
      // @ts-expect-error Should not have a Lifetime
    }) satisfies TransactionMessageWithBlockhashLifetime;

    // @ts-expect-error Should not be a signable transaction
    signTransactionMessageWithSigners(txNotSignable);

    createTransaction({
      feePayer: signer,
      instructions: [ix],
      version: 0,
      // @ts-expect-error Should not have a Lifetime
    }) satisfies TransactionMessageWithBlockhashLifetime;

    // Should be version 0 with a Lifetime and Signer
    createTransaction({
      feePayer: signer,
      instructions: [ix],
      latestBlockhash,
      version: 0,
    }) satisfies BaseTransactionMessage<0> &
      TransactionMessageWithBlockhashLifetime &
      TransactionMessageWithFeePayerSigner;

    // Should be version 0 with a Lifetime and address (aka non Signer)
    const txSignable = createTransaction({
      feePayer: feePayer,
      instructions: [ix],
      latestBlockhash,
      version: 0,
    }) satisfies BaseTransactionMessage<0> & TransactionMessageWithBlockhashLifetime & TransactionMessageWithFeePayer;

    createTransaction({
      feePayer: feePayer,
      instructions: [ix],
      latestBlockhash,
      version: 0,
      // @ts-expect-error Should not be a "fee payer signer"
    }) satisfies TransactionMessageWithFeePayerSigner;

    // Should be a signable transaction
    signTransactionMessageWithSigners(txSignable);
  }
}
