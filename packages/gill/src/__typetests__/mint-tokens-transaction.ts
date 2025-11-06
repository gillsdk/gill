/* eslint-disable @typescript-eslint/ban-ts-comment */

import type {
  Address,
  KeyPairSigner,
  BaseTransactionMessage,
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
      feePayer: signer,
      mint,
      destination,
      amount: 0,
      ata,
      mintAuthority,
    })) satisfies BaseTransactionMessage<"legacy">;

    (await buildMintTokensTransaction({
      feePayer: signer,
      version: "legacy",
      mint,
      destination,
      amount: 0n,
      ata,
      mintAuthority,
    })) satisfies BaseTransactionMessage<"legacy">;

    const txSignable = (await buildMintTokensTransaction({
      feePayer: signer,
      version: "legacy",
      mint,
      destination,
      amount: 0,
      ata,
      mintAuthority,
      latestBlockhash,
    })) satisfies BaseTransactionMessage<"legacy"> & TransactionMessageWithBlockhashLifetime;

    // Should be a signable transaction
    signTransactionMessageWithSigners(txSignable);
  }

  // Version 0 transaction
  {
    (await buildMintTokensTransaction({
      feePayer: signer,
      version: 0,
      mint,
      destination,
      amount: 0,
      ata,
      mintAuthority,
    })) satisfies BaseTransactionMessage<0>;

    const txSignable = (await buildMintTokensTransaction({
      feePayer: signer,
      version: 0,
      mint,
      destination,
      amount: 0n,
      ata,
      mintAuthority,
      latestBlockhash,
    })) satisfies BaseTransactionMessage<0> & TransactionMessageWithBlockhashLifetime;

    // Should be a signable transaction
    signTransactionMessageWithSigners(txSignable);
  }
};
