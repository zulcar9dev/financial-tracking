'use client'

import { useTransition } from 'react'
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
      <span aria-hidden="true">↪</span>
      {pending ? 'Keluar…' : 'Keluar'}
    </button>
  )
}