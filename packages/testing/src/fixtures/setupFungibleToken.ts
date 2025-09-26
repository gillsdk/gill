import {
  KeyPairSigner,
  Lamports,
  lamports,
  SendAndConfirmTransactionWithSignersFunction,
  Signature,
  type Address,
  type SolanaClient,
} from "gill";

import { createMint } from "./createMint.js";
import { mintTo } from "./mintTo.js";

/**
 * Parameters required to set up a fungible token.
 */
type SetupFungibleTokenParams = {
  /** Owner address who will receive the initial minted tokens */
  owner: Address;
  /** Number of decimals for the token (default: 9) */
  decimals?: number;
  /** Amount of tokens to mint initially (default: 1_000_000 lamports) */
  amount?: Lamports;
};

/**
 * Result returned after setting up a fungible token.
 */
type SetupFungibleTokenResult = {
  /** Address of the token mint */
  mint: Address;
  /** Associated token account (ATA) for the owner */
  ata: Address;
  /** Transaction signature of the minting operation */
  transactionSignature: Signature;
  /** Amount of tokens minted */
  mintedAmount: Lamports;
  /** Number of decimals for the token */
  decimals: number;
};

/**
 * Creates a new fungible token mint and mints tokens to a specified owner.
 *
 * This function handles:
 * - Creating a new mint with specified decimals, mint authority, and freeze authority
 * - Creating or ensuring the associated token account (ATA) exists for the owner
 * - Minting the specified amount of tokens to the owner
 *
 * @param rpc - Solana RPC client
 * @param sendAndConfirmTransaction - Function to send and confirm signed transactions
 * @param payer - KeyPairSigner that will act as mint and freeze authority
 * @param params - Object containing owner, decimals, and amount
 * @returns SetupFungibleTokenResult containing mint address, ATA, signature, minted amount, and decimals
 *
 * @example
 * const { mint, ata, transactionSignature, mintedAmount } = await setupFungibleToken(
 *   rpc,
 *   sendAndConfirmTransaction,
 *   payer,
 *   { owner: userAddress, decimals: 6, amount: lamports(1000) }
 * );
 */
export async function setupFungibleToken(
  rpc: SolanaClient["rpc"],
  sendAndConfirmTransaction: SendAndConfirmTransactionWithSignersFunction,
  payer: KeyPairSigner,
  params: SetupFungibleTokenParams,
): Promise<SetupFungibleTokenResult> {
  try {
    // Use provided decimals or default to 9
    const decimals = params.decimals ?? 9;
    // Use provided amount or default to 1_000_000 lamports
    const amount = params.amount ?? lamports(1_000_000n);

    const mintAuthority = payer;
    const freezeAuthority = payer;

    // Create a new mint account
    const { mintAddress: mint } = await createMint(rpc, sendAndConfirmTransaction, {
      decimals,
      mintAuthority,
      freezeAuthority,
    });

    // Mint tokens to the owner's associated token account (ensures ATA exists)
    const { ata, transactionSignature, mintedAmount } = await mintTo(rpc, sendAndConfirmTransaction, {
      mint,
      toOwner: params.owner,
      amount,
      ensureAta: true,
    });

    // Return all relevant info
    return {
      mint,
      ata,
      transactionSignature,
      mintedAmount,
      decimals,
    };
  } catch (error: unknown) {
    if (error instanceof Error) {
      throw new Error(`SetupFungibleToken failed: ${error.message}`);
    }
    throw new Error("SetupFungibleToken failed: Unknown error");
  }
}
