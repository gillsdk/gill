import { address, Address } from 'gill'
import { useState } from 'react'
import { AppModal } from '@/components/app-modal'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { useTransferSolMutation } from '../data-access/use-transfer-sol-mutation'

export function AccountUiModalSend(props: { address: Address }) {
  const mutation = useTransferSolMutation({ address: props.address })
  const [destination, setDestination] = useState('')
  const [amount, setAmount] = useState('1')

  if (!props.address) {
    return <div>Wallet not connected</div>
  }

  return (
    <AppModal
      title="Send"
      submitDisabled={!destination || !amount || mutation.isPending}
      submitLabel="Send"
      submit={async () => {
        await mutation.mutateAsync({
          destination: address(destination),
          amount: parseFloat(amount),
        })
      }}
    >
      <Label htmlFor="destination">Destination</Label>
      <Input
        disabled={mutation.isPending}
        id="destination"
        onChange={(e) => setDestination(e.target.value)}
        placeholder="Destination"
        type="text"
        value={destination}
      />
      <Label htmlFor="amount">Amount</Label>
      <Input
        disabled={mutation.isPending}
        id="amount"
        min="1"
        onChange={(e) => setAmount(e.target.value)}
        placeholder="Amount"
        step="any"
        type="number"
        value={amount}
      />
    </AppModal>
  )
}
