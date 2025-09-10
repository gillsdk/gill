'use client'

import * as React from 'react'
import { SolanaClusterId, useWalletUi, useWalletUiCluster } from '@wallet-ui/react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

export function ClusterDropdown() {
  const { cluster } = useWalletUi()
  const { clusters, setCluster } = useWalletUiCluster()

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline">{cluster.label}</Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56">
        <DropdownMenuRadioGroup value={cluster.id} onValueChange={(cluster) => setCluster(cluster as SolanaClusterId)}>
          {clusters.map((cluster) => {
            return (
              <DropdownMenuRadioItem key={cluster.id} value={cluster.id}>
                {cluster.label}
              </DropdownMenuRadioItem>
            )
          })}
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
