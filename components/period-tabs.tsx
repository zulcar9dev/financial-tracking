'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { useState, useTransition } from 'react'

const TABS = [
  { key: 'this_month', label: 'Bulan ini' },
  { key: 'last_month', label: 'Bulan lalu' },
  { key: 'last_30_days', label: '30 hari' },
  { key: 'this_year', label: 'Tahun ini' },
  { key: 'custom', label: 'Kustom' },
]

export default function PeriodTabs() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [pending, startTransition] = useTransition()
  const current = searchParams.get('period') ?? 'this_month'

  const [showInputs, setShowInputs] = useState(current === 'custom')
  const [from, setFrom] = useState(searchParams.get('from') ?? '')
  const [to, setTo] = useState(searchParams.get('to') ?? '')
  const [error, setError] = useState<string | null>(null)

  function push(params: URLSearchParams) {
    startTransition(() => {
      router.push(`/app/dashboard${params.toString() ? `?${params.toString()}` : ''}`)
    })
  }

  function select(key: string) {
    if (key === 'custom') {
      setShowInputs((open) => !open)
      return
    }
    if (key === current) return
    setShowInputs(false)
    setError(null)
    const params = new URLSearchParams(searchParams.toString())
    if (key === 'this_month') params.delete('period')
    else params.set('period', key)
    params.delete('from')
    params.delete('to')
    push(params)
  }

  function applyCustom() {
    if (!from || !to) {
      setError('Isi tanggal mulai dan tanggal akhir.')
      return
    }
    if (to < from) {
      setError('Tanggal akhir tidak boleh sebelum tanggal mulai.')
      return
    }
    setError(null)
    const params = new URLSearchParams()
    params.set('period', 'custom')
    params.set('from', from)
    params.set('to', to)
    push(params)
  }

  return (
    <div>
      <div className="period-tabs">
        {TABS.map((tab) => (
          <button
            key={tab.key}
            type="button"
            className={`period-tab${tab.key === current ? ' active' : ''}`}
            aria-expanded={tab.key === 'custom' ? showInputs : undefined}
            onClick={() => select(tab.key)}
            disabled={pending}
          >
            {tab.label}
          </button>
        ))}
      </div>
      {showInputs ? (
        <div style={{ display: 'flex', gap: 9, alignItems: 'center', flexWrap: 'wrap', marginTop: 10 }}>
          <input
            className="input"
            type="date"
            aria-label="Tanggal mulai"
            value={from}
            max={to || undefined}
            onChange={(e) => setFrom(e.target.value)}
            style={{ width: 150 }}
          />
          <span aria-hidden="true">–</span>
          <input
            className="input"
            type="date"
            aria-label="Tanggal akhir"
            value={to}
            min={from || undefined}
            onChange={(e) => setTo(e.target.value)}
            style={{ width: 150 }}
          />
          <button type="button" className="page-button small primary" onClick={applyCustom} disabled={pending}>
            Terapkan
          </button>
          {error ? <small style={{ color: 'var(--page-coral)' }}>{error}</small> : null}
        </div>
      ) : null}
    </div>
  )
}