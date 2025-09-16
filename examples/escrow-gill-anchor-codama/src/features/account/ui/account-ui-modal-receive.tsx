import { Address } from 'gill'
import { AppExplorerLink } from '@/components/app-explorer-link'
import { AppModal } from '@/components/app-modal'
import { toast } from 'sonner'
import { handleCopyText } from '@wallet-ui/react'
import { CopyCheck } from 'lucide-react'

export function AccountUiModalReceive({ address }: { address: Address }) {
  function handleCopy() {
    handleCopyText(address.toString())
    toast('Address copied to clipboard', {
      icon: <CopyCheck size={16} />,
      description: 'You can now paste it to receive assets.',
    })
  }
  return (
    <AppModal title="Receive" submitLabel="Copy Address" submit={handleCopy}>
      <p>Receive assets by sending them to your public key:</p>
      <div className="flex items-center gap-2">
        <AppExplorerLink address={address.toString()} label={address.toString()} />
      </div>
    </AppModal>
  )
}
