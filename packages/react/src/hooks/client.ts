import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createSolanaClient, type SolanaClient } from "gill";

import { GILL_HOOK_CLIENT_KEY } from "../const.js";

/**
 * Get the current Solana client (including `rpc` and `rpcSubscriptions`)
 */
export function useSolanaClient(): SolanaClient {
  const { data: config } = useQuery<SolanaClient>({
    // fallback data should not be reached if used within `SolanaProvider`
    // since we set the initial value. but just in case => devnet
    initialData: createSolanaClient({
      urlOrMoniker: "devnet",
    }),
    queryKey: [GILL_HOOK_CLIENT_KEY],
    staleTime: Infinity,
  });
  return config;
}

/**
 * Update your Solana client (including `rpc` and `rpcSubscriptions`)
 */
export function useUpdateSolanaClient() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (newClient: SolanaClient): Promise<void> => {
      queryClient.setQueryData([GILL_HOOK_CLIENT_KEY], newClient);

      return await Promise.resolve();
    },
  });
}
