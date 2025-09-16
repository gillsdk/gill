import { Address } from 'gill'
import { AppAlert } from '@/components/app-alert'
import { Button } from '@/components/ui/button'
import { useSolana } from '@/components/solana/use-solana'
import { useRequestAirdropMutation } from '../data-access/use-request-airdrop-mutation'
import { useGetBalanceQuery } from '../data-access/use-get-balance-query'

export function AccountUiBalanceCheck({ address }: { address: Address }) {
  const { cluster } = useSolana()
  const mutation = useRequestAirdropMutation({ address })
  const query = useGetBalanceQuery({ address })

  if (query.isLoading) {
    return null
  }
  if (query.isError || !query.data?.value) {
    return (
      <AppAlert
        action={
          <Button variant="outline" onClick={() => mutation.mutateAsync(1).catch((err) => console.log(err))}>
            Request Airdrop
          </Button>
        }
      >
        You are connected to <strong>{cluster.label}</strong> but your account is not found on this cluster.
      </AppAlert>
    )
  }
  return null
}
