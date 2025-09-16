import type { Address } from 'gill'
import { useQuery } from '@tanstack/react-query'
import { useSolana } from '@/components/solana/use-solana'
import { useGetBalanceQueryKey } from './use-get-balance-query-key'

export function useGetBalanceQuery({ address }: { address: Address }) {
  const { client } = useSolana()

  return useQuery({
    retry: false,
    queryKey: useGetBalanceQueryKey({ address }),
    queryFn: () => client.rpc.getBalance(address).send(),
  })
}
