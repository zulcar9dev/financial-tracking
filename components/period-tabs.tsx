'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { useTransition } from 'react'

const TABS = [
  { key: 'this_month', label: 'Bulan ini' },
  { key: 'last_month', label: 'Bulan lalu' },
  { key: 'last_30_days', label: '30 hari' },
  { key: 'this_year', label: 'Tahun ini' },
]

export default function PeriodTabs() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [pending, startTransition] = useTransition()
  const current = searchParams.get('period') ?? 'this_month'

  function select(key: string) {
    if (key === current) return
    const params = new URLSearchParams(searchParams.toString())
    if (key === 'this_month') params.delete('period')
    else params.set('period', key)
    startTransition(() => {
      router.push(`/app/dashboard${params.toString() ? `?${params.toString()}` : ''}`)
    })
  }

  return (
    <div className="period-tabs">
      {TABS.map((tab) => (
        <button
          key={tab.key}
          type="button"
          className={`period-tab${tab.key === current ? ' active' : ''}`}
          onClick={() => select(tab.key)}
          disabled={pending}
        >
          {tab.label}
        </button>
      ))}
    </div>
  )
}