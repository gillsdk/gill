import { address } from 'gill'
import { useSolana } from '@/components/solana/use-solana'
import { AccountUiBalanceCheck } from './account-ui-balance-check'

export function AccountUiChecker() {
  const { account } = useSolana()
  if (!account) {
    return null
  }
  return <AccountUiBalanceCheck address={address(account.address)} />
}
