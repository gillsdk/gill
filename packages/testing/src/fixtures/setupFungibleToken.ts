import {
  KeyPairSigner,
  Lamports,
  lamports,
  SendAndConfirmTransactionWithSignersFunction,
  Signature,
  type Address,
  type SolanaClient,
} from "gill";

import { createMint } from "./createMint";
import { mintTo } from "./mintTo";
import { loadKeypairSignerFromFile } from "gill/node";

/**
 * Parameters required to set up a fungible token.
 */
type SetupFungibleTokenParams = {
  /**
   * Optional fee payer for account creation and transaction fees.
   * Defaults to loading a local keypair via `loadKeypairSignerFromFile()`.
   * Also used as default mint/freeze authority if not provided.
   */
  payer?: KeyPairSigner;
  /** Owner address who will receive the initial minted tokens */
  owner?: Address;
  /** Authority allowed to mint new tokens (default: payer) */
  mintAuthority?: KeyPairSigner;
  /** Authority allowed to freeze token accounts (default: payer) */
  freezeAuthority?: KeyPairSigner;
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
 * Creates a new classic SPL token mint and mints tokens to a specified owner.
 *
 * This helper handles:
 * - Generating a new mint account
 * - Creating the mint account on-chain and initializing it with specified decimals, mintAuthority, and freezeAuthority
 * - Creating or ensuring the associated token account (ATA) exists for the owner
 * - Minting the specified amount of tokens (in lamports / base units) to the owner
 *
 * @param rpc - Solana RPC client
 * @param sendAndConfirmTransaction - Function to send and confirm signed transactions
 * @param params - Optional parameters:
 *   - payer: fee payer for account creation, default loaded from local file
 *   - owner: initial token recipient, defaults to `payer.address`
 *   - mintAuthority: authority allowed to mint new tokens, defaults to `payer`
 *   - freezeAuthority: authority allowed to freeze token accounts, defaults to `payer`
 *   - decimals: number of decimals (default 9)
 *   - amount: amount to mint (in lamports/base units, default 1_000_000)
 *
 * @returns SetupFungibleTokenResult containing:
 *   - mint: address of the created mint
 *   - ata: associated token account for the owner
 *   - transactionSignature: signature of the mint transaction
 *   - mintedAmount: number of lamports minted
 *   - decimals: token decimals
 *
 * @example
 * // Simple usage with default payer as authority and owner
 * const { mint, ata, transactionSignature, mintedAmount } = await setupFungibleToken(
 *   rpc,
 *   sendAndConfirmTransaction,
 * );
 *
 * @example
 * // Custom owner and authorities with 6 decimals
 * const { mint, ata, transactionSignature, mintedAmount } = await setupFungibleToken(
 *   rpc,
 *   sendAndConfirmTransaction,
 *   {
 *     owner: userAddress,
 *     mintAuthority: adminSigner,
 *     freezeAuthority: adminSigner,
 *     decimals: 6,
 *     amount: lamports(1_000_000n), // 1_000_000 lamports = 1 token if decimals = 6
 *   }
 * );
 */
export async function setupFungibleToken(
  rpc: SolanaClient["rpc"],
  sendAndConfirmTransaction: SendAndConfirmTransactionWithSignersFunction,
  params: SetupFungibleTokenParams = {},
): Promise<SetupFungibleTokenResult> {
  const { payer, owner, mintAuthority, freezeAuthority, decimals = 9, amount = lamports(1_000_000n) } = params;

  const signer = payer ?? (await loadKeypairSignerFromFile());

  const tokenOwner = owner ?? signer.address;
  const mintAuth = mintAuthority ?? signer;
  const freezeAuth = freezeAuthority ?? signer;

  const { mint } = await createMint(rpc, sendAndConfirmTransaction, {
    payer: signer,
    decimals,
    mintAuthority: mintAuth,
    freezeAuthority: freezeAuth,
  });

  const { ata, transactionSignature, mintedAmount } = await mintTo(rpc, sendAndConfirmTransaction, {
    mint: mint.address,
    owner: tokenOwner,
    amount,
    ensureAta: true,
    payer: signer,
    mintAuthority: mintAuth,
  });

  return {
    mint: mint.address,
    ata,
    transactionSignature,
    mintedAmount,
    decimals,
  };
}
