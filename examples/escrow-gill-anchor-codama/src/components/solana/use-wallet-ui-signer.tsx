import { UiWalletAccount, useWalletAccountTransactionSendingSigner } from '@wallet-ui/react'
import { useSolana } from '@/components/solana/use-solana'

export function useWalletUiSigner() {
  const { account, cluster } = useSolana()

  if (!cluster) {
    throw new Error('Solana cluster not initialized. Make sure the app is wrapped with SolanaProvider.')
  }

  if (!account) {
    throw new Error('Wallet not connected. Please connect your wallet first.')
  }

  return useWalletAccountTransactionSendingSigner(account as UiWalletAccount, cluster.id)
}
