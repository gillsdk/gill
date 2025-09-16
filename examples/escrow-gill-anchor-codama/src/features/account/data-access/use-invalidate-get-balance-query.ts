import type { Address } from 'gill'
import { useQueryClient } from '@tanstack/react-query'
import { useGetBalanceQueryKey } from './use-get-balance-query-key'

export function useInvalidateGetBalanceQuery({ address }: { address: Address }) {
  const queryClient = useQueryClient()
  const queryKey = useGetBalanceQueryKey({ address })
  return async () => {
    await queryClient.invalidateQueries({ queryKey })
  }
}
