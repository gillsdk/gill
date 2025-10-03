import {
  KeyPairSigner,
  Lamports,
  lamports,
  SendAndConfirmTransactionWithSignersFunction,
  Signature,
  type Address,
  type SolanaClient,
} from "gill";

import createMint from "./createMint";
import mintTo from "./mintTo";
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
 * @param params - Object containing payer,owner, decimals, and amount
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
export default async function setupFungibleToken(
  rpc: SolanaClient["rpc"],
  sendAndConfirmTransaction: SendAndConfirmTransactionWithSignersFunction,
  params: SetupFungibleTokenParams,
): Promise<SetupFungibleTokenResult> {
  const { payer, owner, decimals = 9, amount = lamports(1_000_000n) } = params;

  const signer = payer ?? (await loadKeypairSignerFromFile());

  const mintAuthority = signer;
  const freezeAuthority = signer;

  const { mint } = await createMint(rpc, sendAndConfirmTransaction, {
    payer: signer,
    decimals,
    mintAuthority,
    freezeAuthority,
  });

  const { ata, transactionSignature, mintedAmount } = await mintTo(rpc, sendAndConfirmTransaction, {
    mint: mint.address,
    toOwner: owner,
    amount,
    ensureAta: true,
    payer: signer,
  });

  return {
    mint: mint.address,
    ata,
    transactionSignature,
    mintedAmount,
    decimals,
  };
}
