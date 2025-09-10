'use client'

import { SolanaCluster } from '@wallet-ui/react'
import {
  createDefaultAuthorizationCache,
  createDefaultChainSelector,
  createDefaultWalletNotFoundHandler,
  registerMwa,
} from '@solana-mobile/wallet-standard-mobile'

export function solanaMobileWalletAdapter({
  appIdentity = { name: 'Wallet UI' },
  clusters,
}: {
  appIdentity?: { uri?: string; icon?: string; name?: string }
  clusters: SolanaCluster[]
}) {
  if (typeof window === 'undefined') {
    return
  }
  if (!window.isSecureContext) {
    console.warn(`Solana Mobile Wallet Adapter not loaded: https connection required`)
    return
  }
  const chains = clusters.map((c) => c.id)
  if (!chains.length) {
    console.warn(`Solana Mobile Wallet Adapter not loaded: no clusters provided`)
    return
  }
  registerMwa({
    appIdentity,
    authorizationCache: createDefaultAuthorizationCache(),
    chains,
    chainSelector: createDefaultChainSelector(),
    onWalletNotFound: createDefaultWalletNotFoundHandler(),
  })
  console.log(`Loaded Solana Mobile Wallet Adapter`)
}
