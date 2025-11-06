/* eslint-disable @typescript-eslint/ban-ts-comment */

import type { BaseTransactionMessage, KeyPairSigner, TransactionMessageWithBlockhashLifetime } from "@solana/kit";
import { signTransactionMessageWithSigners } from "@solana/kit";
import { GetCreateTokenInstructionsArgs, buildCreateTokenTransaction } from "../programs/token";

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
      mint,
      metadata,
    })) satisfies BaseTransactionMessage<"legacy">;

    (await buildCreateTokenTransaction({
      feePayer: signer,
      version: "legacy",
      mint,
      metadata,
    })) satisfies BaseTransactionMessage<"legacy">;

    const txSignable = (await buildCreateTokenTransaction({
      feePayer: signer,
      version: "legacy",
      mint,
      metadata,
      latestBlockhash,
    })) satisfies BaseTransactionMessage<"legacy"> & TransactionMessageWithBlockhashLifetime;

    // Should be a signable transaction
    signTransactionMessageWithSigners(txSignable);
  }

  // Version 0 transaction
  {
    (await buildCreateTokenTransaction({
      feePayer: signer,
      version: 0,
      mint,
      metadata,
    })) satisfies BaseTransactionMessage<0>;

    const txSignable = (await buildCreateTokenTransaction({
      feePayer: signer,
      version: 0,
      mint,
      metadata,
      latestBlockhash,
    })) satisfies BaseTransactionMessage<0> & TransactionMessageWithBlockhashLifetime;

    // Should be a signable transaction
    signTransactionMessageWithSigners(txSignable);
  }
};
