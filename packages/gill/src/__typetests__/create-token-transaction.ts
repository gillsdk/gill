 

import type { BaseTransactionMessage, KeyPairSigner, TransactionMessageWithBlockhashLifetime } from "@solana/kit";
import { signTransactionMessageWithSigners } from "@solana/kit";

import { buildCreateTokenTransaction,GetCreateTokenInstructionsArgs } from "../programs/token";

// [DESCRIBE] buildCreateTokenTransaction
async () => {
  const mint = null as unknown as KeyPairSigner;
  const signer = null as unknown as KeyPairSigner;
  const latestBlockhash = null as unknown as TransactionMessageWithBlockhashLifetime["lifetimeConstraint"];
  const metadata = {} as unknown as GetCreateTokenInstructionsArgs["metadata"];

  // Legacy transaction
  {
    (await buildCreateTokenTransaction({
      feePayer: signer,
      metadata,
      mint,
    })) satisfies BaseTransactionMessage<"legacy">;

    (await buildCreateTokenTransaction({
      feePayer: signer,
      metadata,
      mint,
      version: "legacy",
    })) satisfies BaseTransactionMessage<"legacy">;

    const txNotSignable = (await buildCreateTokenTransaction({
      feePayer: signer,
      metadata,
      mint,
      version: "legacy",
      // @ts-expect-error Should not have a Lifetime
    })) satisfies TransactionMessageWithBlockhashLifetime;

    // @ts-expect-error Should not be a signable transaction
    signTransactionMessageWithSigners(txNotSignable);

    const txSignable = (await buildCreateTokenTransaction({
      feePayer: signer,
      latestBlockhash,
      metadata,
      mint,
      version: "legacy",
    })) satisfies BaseTransactionMessage<"legacy"> & TransactionMessageWithBlockhashLifetime;

    // Should be a signable transaction
    signTransactionMessageWithSigners(txSignable);
  }

  // Version 0 transaction
  {
    (await buildCreateTokenTransaction({
      feePayer: signer,
      metadata,
      mint,
      version: 0,
    })) satisfies BaseTransactionMessage<0>;

    const txNotSignable = (await buildCreateTokenTransaction({
      feePayer: signer,
      metadata,
      mint,
      version: 0,
      // @ts-expect-error Should not have a Lifetime
    })) satisfies TransactionMessageWithBlockhashLifetime;

    // @ts-expect-error Should not be a signable transaction
    signTransactionMessageWithSigners(txNotSignable);

    const txSignable = (await buildCreateTokenTransaction({
      feePayer: signer,
      latestBlockhash,
      metadata,
      mint,
      version: 0,
    })) satisfies BaseTransactionMessage<0> & TransactionMessageWithBlockhashLifetime;

    // Should be a signable transaction
    signTransactionMessageWithSigners(txSignable);
  }
};
