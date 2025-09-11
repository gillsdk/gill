"use client";

import { useMutation } from "@tanstack/react-query";
import type { Address, Commitment, Lamports, Signature } from "gill";
import { useSolanaClient } from "./client";

type AirdropConfig = {
  /**
   * Commitment level for the airdrop request
   * @defaultValue "confirmed"
   */
  commitment?: Commitment;
};

type UseAirdropInput = {
  /**
   * Configuration for the airdrop request
   */
  config?: AirdropConfig;
  /**
   * Signal used to abort the airdrop operation
   */
  abortSignal?: AbortSignal;
};

type UseAirdropResponse = {
  /**
   * The signature of the airdrop transaction
   */
  signature: Signature;
};

/**
 * Request an airdrop of SOL to an address on devnet/testnet networks.
 *
 * **Important**: This hook will throw an error if used on mainnet.
 * Airdrops are only available on development networks.
 *
 * Uses the Solana RPC method [`requestAirdrop`](https://solana.com/docs/rpc/http/requestairdrop)
 *
 * @example
 * ```tsx
 * function AirdropButton({ address }: { address: Address }) {
 *   const { mutate: requestAirdrop, isPending, error } = useAirdrop();
 *
 *   const handleAirdrop = () => {
 *     requestAirdrop({
 *       address,
 *       lamports: 1_000_000_000n, // 1 SOL
 *     });
 *   };
 *
 *   return (
 *     <button onClick={handleAirdrop} disabled={isPending}>
 *       {isPending ? "Requesting..." : "Request 1 SOL"}
 *     </button>
 *   );
 * }
 * ```
 */
export function useAirdrop({ config, abortSignal }: UseAirdropInput = {}) {
  const { rpc } = useSolanaClient();

  return useMutation({
    mutationFn: async ({
      address,
      lamports,
    }: {
      address: Address | string;
      lamports: bigint | number;
    }): Promise<UseAirdropResponse> => {
      // Convert lamports to bigint if it's a number
      const lamportAmount = typeof lamports === "number" ? BigInt(lamports) : lamports;

      const signature = await rpc
        .requestAirdrop(address as Address, lamportAmount as Lamports, {
          commitment: config?.commitment ?? "confirmed",
        })
        .send({ abortSignal });

      return { signature };
    },
    onError: (error) => {
      // Provide helpful error messages for common issues
      if (error instanceof Error) {
        if (error.message.includes("airdrop request failed")) {
          throw new Error(
            "Airdrop failed. This could be due to: 1) Using mainnet (airdrops only work on devnet/testnet), 2) Rate limiting (try again later), or 3) Network issues.",
          );
        }
        if (error.message.includes("mainnet")) {
          throw new Error("Airdrops are not available on mainnet. Switch to devnet or testnet to request SOL.");
        }
      }
      throw error;
    },
  });
}
