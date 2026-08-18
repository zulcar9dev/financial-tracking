'use client'

import { useTransition } from 'react'
import { SignOut } from '@phosphor-icons/react'
import { signOutAction } from '@/lib/actions/auth'

export default function LogoutButton({ className = '' }: { className?: string }) {
  const [pending, startTransition] = useTransition()

  return (
    <button
      type="button"
      className={className}
      disabled={pending}
      onClick={() => startTransition(async () => signOutAction())}
    >
      <SignOut size={16} weight="regular" aria-hidden="true" />
      {pending ? 'Keluar…' : 'Keluar'}
    </button>
  )
}
