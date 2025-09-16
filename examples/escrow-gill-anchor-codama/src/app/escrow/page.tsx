'use client'

import dynamic from 'next/dynamic'

const EscrowFeature = dynamic(() => import('@/features/escrow/escrow-feature'), {
  ssr: false,
  loading: () => <div className="text-center p-8">Loading...</div>,
})

export default function EscrowPage() {
  return <EscrowFeature />
}
