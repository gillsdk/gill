import { useWalletUi } from '@wallet-ui/react'

/**
 * Custom hook to abstract Wallet UI and related functionality from your app.
 *
 * This is a great place to add custom shared Solana logic or clients.
 */
export function useSolana() {
  const walletUi = useWalletUi()

  return {
    ...walletUi,
  }
}
