import { getExplorerLink, GetExplorerLinkArgs } from 'gill'
import { useSolana } from '@/components/solana/use-solana'
import { ArrowUpRightFromSquare } from 'lucide-react'

export function AppExplorerLink({
  className,
  label = '',
  ...link
}: GetExplorerLinkArgs & {
  className?: string
  label: string
}) {
  const { cluster } = useSolana()
  return (
    <a
      href={getExplorerLink({ ...link, cluster: cluster.cluster })}
      target="_blank"
      rel="noopener noreferrer"
      className={className ? className : `link font-mono inline-flex gap-1`}
    >
      {label}
      <ArrowUpRightFromSquare size={12} />
    </a>
  )
}
