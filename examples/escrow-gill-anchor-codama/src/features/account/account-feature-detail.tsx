import { assertIsAddress } from 'gill'
import { useMemo } from 'react'
import { useParams } from 'next/navigation'
import { AppHero } from '@/components/app-hero'
import { ellipsify } from '@/lib/utils'

import { AccountUiTransactions } from './ui/account-ui-transactions'
import { AccountUiBalance } from '@/features/account/ui/account-ui-balance'
import { AppExplorerLink } from '@/components/app-explorer-link'
import { AccountUiButtons } from '@/features/account/ui/account-ui-buttons'
import { AccountUiTokens } from '@/features/account/ui/account-ui-tokens'

export default function AccountFeatureDetail() {
  const params = useParams()
  const address = useMemo(() => {
    if (!params.address || typeof params.address !== 'string') {
      return
    }
    assertIsAddress(params.address)
    return params.address
  }, [params])
  if (!address) {
    return <div>Error loading account</div>
  }

  return (
    <div>
      <AppHero
        title={<AccountUiBalance address={address} />}
        subtitle={
          <div className="my-4">
            <AppExplorerLink address={address.toString()} label={ellipsify(address.toString())} />
          </div>
        }
      >
        <div className="my-4">
          <AccountUiButtons address={address} />
        </div>
      </AppHero>
      <div className="space-y-8">
        <AccountUiTokens address={address} />
        <AccountUiTransactions address={address} />
      </div>
    </div>
  )
}
