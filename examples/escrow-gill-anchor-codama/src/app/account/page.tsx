'use client'
import { redirect } from 'next/navigation'
import AccountFeatureIndex from '@/features/account/account-feature-index'

export default function Page() {
  return <AccountFeatureIndex redirect={redirect} />
}
