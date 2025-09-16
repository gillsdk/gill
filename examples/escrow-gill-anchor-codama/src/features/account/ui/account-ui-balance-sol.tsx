import { Lamports, lamportsToSol } from 'gill'

export function AccountUiBalanceSol({ balance }: { balance: Lamports }) {
  return <span>{lamportsToSol(balance)}</span>
}
