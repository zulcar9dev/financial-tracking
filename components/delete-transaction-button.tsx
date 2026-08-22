'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Trash } from '@phosphor-icons/react'
import { deleteTransactionAction } from '@/lib/actions/transactions'

export function DeleteTransactionButton({ id }: { id: string }) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  function remove() {
    if (!window.confirm('Hapus transaksi ini? Transaksi akan ditandai terhapus dan saldo akun diperbarui.')) return
    setError(null)
    startTransition(async () => {
      const result = await deleteTransactionAction({ id })
      if (result.error) setError(result.error)
      else {
        router.push('/app/transactions')
        router.refresh()
      }
    })
  }

  return (
    <div>
      {error ? <p className="form-error" role="alert">{error}</p> : null}
      <button type="button" className="page-button danger" onClick={remove} disabled={pending}>
        <Trash className="finance-icon" size={16} weight="regular" aria-hidden="true" /> Hapus transaksi
      </button>
    </div>
  )
}