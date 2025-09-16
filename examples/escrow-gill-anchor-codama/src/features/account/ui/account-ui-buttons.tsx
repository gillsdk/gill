import { Address } from 'gill'
import { ErrorBoundary } from 'next/dist/client/components/error-boundary'
import { useSolana } from '@/components/solana/use-solana'
import { AccountUiModalAirdrop } from './account-ui-modal-airdrop'
import { AccountUiModalReceive } from './account-ui-modal-receive'
import { AccountUiModalSend } from './account-ui-modal-send'

export function AccountUiButtons({ address }: { address: Address }) {
  const { account, cluster } = useSolana()

  return account ? (
    <div>
      <div className="space-x-2">
        {cluster.id === 'solana:mainnet' ? null : <AccountUiModalAirdrop address={address} />}
        <ErrorBoundary errorComponent={() => null}>
          <AccountUiModalSend address={address} />
        </ErrorBoundary>
        <AccountUiModalReceive address={address} />
      </div>
    </div>
  ) : null
}
