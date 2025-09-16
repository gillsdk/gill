import type { Address } from 'gill'
import { useQueryClient } from '@tanstack/react-query'
import { useGetSignaturesQueryKey } from './use-get-signatures-query-key'

export function useInvalidateGetSignaturesQuery({ address }: { address: Address }) {
  const queryClient = useQueryClient()
  const queryKey = useGetSignaturesQueryKey({ address })
  return async () => {
    await queryClient.invalidateQueries({ queryKey })
  }
}
