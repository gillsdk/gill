import type { Address } from 'gill'
import { useQuery } from '@tanstack/react-query'
import { useSolana } from '@/components/solana/use-solana'
import { useGetSignaturesQueryKey } from './use-get-signatures-query-key'

export function useGetSignaturesQuery({ address }: { address: Address }) {
  const { client } = useSolana()

  return useQuery({
    queryKey: useGetSignaturesQueryKey({ address }),
    queryFn: () => client.rpc.getSignaturesForAddress(address).send(),
  })
}
