import { toast } from 'sonner'
import { AppExplorerLink } from '@/components/app-explorer-link'

export function toastTx(signature?: string, title = 'Transaction sent') {
  if (!signature) {
    return
  }
  toast(title, {
    description: <AppExplorerLink transaction={signature} label="View Transaction" />,
  })
}
