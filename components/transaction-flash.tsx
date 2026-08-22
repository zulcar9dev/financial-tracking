'use client'

import { useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { CheckCircle } from '@phosphor-icons/react'

export default function TransactionFlash() {
  const searchParams = useSearchParams()
  const hl = searchParams.get('hl')
  const variant = searchParams.get('m') === 'updated' ? 'updated' : 'created'
  const [dismissed, setDismissed] = useState<string | null>(null)

  const visible = hl !== null && dismissed !== hl

  useEffect(() => {
    if (!visible || !hl) return
    const timer = setTimeout(() => {
      setDismissed(hl)
      const params = new URLSearchParams(window.location.search)
      params.delete('hl')
      params.delete('m')
      const qs = params.toString()
      window.history.replaceState(
        window.history.state,
        '',
        qs ? `/app/transactions?${qs}` : '/app/transactions',
      )
    }, 3200)
    return () => clearTimeout(timer)
  }, [hl, visible])

  if (!hl) return null

  return (
    <div className={`toast-wrap${visible ? ' show' : ''}`}>
      <div className="toast" role="status" aria-live="polite">
        <CheckCircle size={15} weight="fill" aria-hidden="true" />
        <span>{variant === 'updated' ? 'Perubahan transaksi tersimpan.' : 'Transaksi berhasil dicatat.'}</span>
      </div>
    </div>
  )
}
