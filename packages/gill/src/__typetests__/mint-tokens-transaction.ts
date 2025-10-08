 

import type {
  Address,
  BaseTransactionMessage,
  KeyPairSigner,
  TransactionMessageWithBlockhashLifetime,
} from "@solana/kit";
import { signTransactionMessageWithSigners } from "@solana/kit";

import { buildMintTokensTransaction } from "../programs/token";

// [DESCRIBE] buildMintTokensTransaction
async () => {
  const signer = null as unknown as KeyPairSigner;
  const latestBlockhash = null as unknown as TransactionMessageWithBlockhashLifetime["lifetimeConstraint"];

  const mint = null as unknown as KeyPairSigner;
  const destination = null as unknown as Address;
  const ata = null as unknown as Address;
  const mintAuthority = null as unknown as KeyPairSigner;

  // Legacy transaction
  {
    (await buildMintTokensTransaction({
      amount: 0,
      ata,
      destination,
      feePayer: signer,
      mint,
      mintAuthority,
    })) satisfies BaseTransactionMessage<"legacy">;

    (await buildMintTokensTransaction({
      amount: 0n,
      ata,
      destination,
      feePayer: signer,
      mint,
      mintAuthority,
      version: "legacy",
    })) satisfies BaseTransactionMessage<"legacy">;

    const txNotSignable = (await buildMintTokensTransaction({
      amount: 0,
      ata,
      destination,
      feePayer: signer,
      mint,
      mintAuthority,
      version: "legacy",
      // @ts-expect-error Should not have a Lifetime
    })) satisfies TransactionMessageWithBlockhashLifetime;

    // @ts-expect-error Should not be a signable transaction
    signTransactionMessageWithSigners(txNotSignable);

    const txSignable = (await buildMintTokensTransaction({
      amount: 0,
      ata,
      destination,
      feePayer: signer,
      latestBlockhash,
      mint,
      mintAuthority,
      version: "legacy",
    })) satisfies BaseTransactionMessage<"legacy"> & TransactionMessageWithBlockhashLifetime;

    // Should be a signable transaction
    signTransactionMessageWithSigners(txSignable);
  }

  // Version 0 transaction
  {
    (await buildMintTokensTransaction({
      amount: 0,
      ata,
      destination,
      feePayer: signer,
      mint,
      mintAuthority,
      version: 0,
    })) satisfies BaseTransactionMessage<0>;

    const txNotSignable = (await buildMintTokensTransaction({
      amount: 0,
      ata,
      destination,
      feePayer: signer,
      mint,
      mintAuthority,
      version: 0,
      // @ts-expect-error Should not have a Lifetime
    })) satisfies TransactionMessageWithBlockhashLifetime;

    // @ts-expect-error Should not be a signable transaction
    signTransactionMessageWithSigners(txNotSignable);

    const txSignable = (await buildMintTokensTransaction({
      amount: 0n,
      ata,
      destination,
      feePayer: signer,
      latestBlockhash,
      mint,
      mintAuthority,
      version: 0,
    })) satisfies BaseTransactionMessage<0> & TransactionMessageWithBlockhashLifetime;

    // Should be a signable transaction
    signTransactionMessageWithSigners(txSignable);
  }
};
