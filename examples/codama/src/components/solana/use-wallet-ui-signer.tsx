import { UiWalletAccount, useWalletAccountTransactionSendingSigner } from '@wallet-ui/react'
import { useSolana } from '@/components/solana/use-solana'

export function useWalletUiSigner() {
  const { account, cluster } = useSolana()

  return useWalletAccountTransactionSendingSigner(account as UiWalletAccount, cluster.id)
}
