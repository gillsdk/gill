/* eslint-disable @typescript-eslint/ban-ts-comment */

import type {
  Address,
  BaseTransactionMessage,
  KeyPairSigner,
  TransactionMessageWithBlockhashLifetime,
} from "@solana/kit";
import { signTransactionMessageWithSigners } from "@solana/kit";
import { buildTransferTokensTransaction } from "../programs/token";

// [DESCRIBE] buildTransferTokensTransaction
async () => {
  const signer = null as unknown as KeyPairSigner;
  const latestBlockhash = null as unknown as TransactionMessageWithBlockhashLifetime["lifetimeConstraint"];

  const mint = null as unknown as KeyPairSigner;
  const destination = null as unknown as Address;
  const authority = null as unknown as KeyPairSigner;

  // Legacy transaction
  {
    (await buildTransferTokensTransaction({
      feePayer: signer,
      mint,
      destination,
      amount: 0,
      authority,
    })) satisfies BaseTransactionMessage<"legacy">;

    (await buildTransferTokensTransaction({
      feePayer: signer,
      version: "legacy",
      mint,
      destination,
      amount: 0n,
      authority,
    })) satisfies BaseTransactionMessage<"legacy">;

    const txNotSignable = (await buildTransferTokensTransaction({
      feePayer: signer,
      version: "legacy",
      mint,
      destination,
      amount: 0,
      authority,
      // @ts-expect-error Should not have a Lifetime
    })) satisfies TransactionMessageWithBlockhashLifetime;

    signTransactionMessageWithSigners(txNotSignable);

    const txSignable = (await buildTransferTokensTransaction({
      feePayer: signer,
      version: "legacy",
      mint,
      destination,
      amount: 0,
      authority,
      latestBlockhash,
    })) satisfies BaseTransactionMessage<"legacy"> & TransactionMessageWithBlockhashLifetime;

    // Should be a signable transaction
    signTransactionMessageWithSigners(txSignable);
  }

  // Version 0 transaction
  {
    (await buildTransferTokensTransaction({
      feePayer: signer,
      version: 0,
      mint,
      destination,
      amount: 0,
      authority,
    })) satisfies BaseTransactionMessage<0>;

    const txNotSignable = (await buildTransferTokensTransaction({
      feePayer: signer,
      version: 0,
      mint,
      destination,
      amount: 0,
      authority,
      // @ts-expect-error Should not have a Lifetime
    })) satisfies TransactionMessageWithBlockhashLifetime;

    signTransactionMessageWithSigners(txNotSignable);

    const txSignable = (await buildTransferTokensTransaction({
      feePayer: signer,
      version: 0,
      mint,
      destination,
      amount: 0n,
      authority,
      latestBlockhash,
    })) satisfies BaseTransactionMessage<0> & TransactionMessageWithBlockhashLifetime;

    // Should be a signable transaction
    signTransactionMessageWithSigners(txSignable);
  }
};
