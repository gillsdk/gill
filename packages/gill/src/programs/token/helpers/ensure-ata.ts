import { getCreateAssociatedTokenIdempotentInstruction } from "@solana-program/token-2022";
import type { Address, IInstruction, TransactionSigner } from "@solana/kit";
import { assertAccountExists, fetchEncodedAccount } from "@solana/kit";
import { checkedAddress } from "../../../core/utils";
import type { Plan } from "../../../types";
import { checkedTokenProgramAddress, getAssociatedTokenAccountAddress } from "../addresses";

type EnsureAtaInput = {
  owner: Address | TransactionSigner;
  mint: Address | TransactionSigner;
  tokenProgram?: Address;
  feePayer?: TransactionSigner;
  rpc?: Parameters<typeof fetchEncodedAccount>[0];
};

export async function ensureAta({ owner, mint, tokenProgram, feePayer, rpc }: EnsureAtaInput): Promise<Plan<{ ata: Address }>> {
  tokenProgram = checkedTokenProgramAddress(tokenProgram);
  const ata = await getAssociatedTokenAccountAddress(mint, owner, tokenProgram);

  // If no RPC is provided, default to idempotent create instruction
  if (!rpc) {
    const ixs: IInstruction[] = feePayer
      ? [
          getCreateAssociatedTokenIdempotentInstruction({
            owner: checkedAddress(owner),
            mint: checkedAddress(mint),
            ata,
            payer: feePayer,
            tokenProgram,
          }),
        ]
      : [];

    return { ixs, artifacts: { ata } };
  }

  // With RPC: check if ATA exists; if it does, return empty ixs
  try {
    const account = await fetchEncodedAccount(rpc, ata);
    assertAccountExists(account);
    return { ixs: [], artifacts: { ata } };
  } catch {
    // If account not found or other errors, fall back to idempotent create if feePayer present
    const ixs: IInstruction[] = feePayer
      ? [
          getCreateAssociatedTokenIdempotentInstruction({
            owner: checkedAddress(owner),
            mint: checkedAddress(mint),
            ata,
            payer: feePayer,
            tokenProgram,
          }),
        ]
      : [];
    return { ixs, artifacts: { ata } };
  }
}


