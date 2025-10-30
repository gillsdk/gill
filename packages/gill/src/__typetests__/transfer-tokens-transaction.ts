 

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
      amount: 0,
      authority,
      destination,
      feePayer: signer,
      mint,
    })) satisfies BaseTransactionMessage<"legacy">;

    (await buildTransferTokensTransaction({
      amount: 0n,
      authority,
      destination,
      feePayer: signer,
      mint,
      version: "legacy",
    })) satisfies BaseTransactionMessage<"legacy">;

    const txNotSignable = (await buildTransferTokensTransaction({
      amount: 0,
      authority,
      destination,
      feePayer: signer,
      mint,
      version: "legacy",
      // @ts-expect-error Should not have a Lifetime
    })) satisfies TransactionMessageWithBlockhashLifetime;

    // @ts-expect-error Should not be a signable transaction
    signTransactionMessageWithSigners(txNotSignable);

    const txSignable = (await buildTransferTokensTransaction({
      amount: 0,
      authority,
      destination,
      feePayer: signer,
      latestBlockhash,
      mint,
      version: "legacy",
    })) satisfies BaseTransactionMessage<"legacy"> & TransactionMessageWithBlockhashLifetime;

    // Should be a signable transaction
    signTransactionMessageWithSigners(txSignable);
  }

  // Version 0 transaction
  {
    (await buildTransferTokensTransaction({
      amount: 0,
      authority,
      destination,
      feePayer: signer,
      mint,
      version: 0,
    })) satisfies BaseTransactionMessage<0>;

    const txNotSignable = (await buildTransferTokensTransaction({
      amount: 0,
      authority,
      destination,
      feePayer: signer,
      mint,
      version: 0,
      // @ts-expect-error Should not have a Lifetime
    })) satisfies TransactionMessageWithBlockhashLifetime;

    // @ts-expect-error Should not be a signable transaction
    signTransactionMessageWithSigners(txNotSignable);

    const txSignable = (await buildTransferTokensTransaction({
      amount: 0n,
      authority,
      destination,
      feePayer: signer,
      latestBlockhash,
      mint,
      version: 0,
    })) satisfies BaseTransactionMessage<0> & TransactionMessageWithBlockhashLifetime;

    // Should be a signable transaction
    signTransactionMessageWithSigners(txSignable);
  }
};
