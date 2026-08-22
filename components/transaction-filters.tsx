'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { useTransition } from 'react'
import AppSelect from '@/components/app-select'
import type { Account, Category } from '@/lib/types'

export default function TransactionFilters({
  accounts,
  categories,
}: {
  accounts: Account[]
  categories: Category[]
}) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [pending, startTransition] = useTransition()

  function apply(key: string, value: string) {
    const params = new URLSearchParams(searchParams.toString())
    if (key === 'q' && !value) params.delete(key)
    else if (value) params.set(key, value)
    else params.delete(key)
    if (key !== 'page') params.delete('page')
    startTransition(() => {
      router.push(`/app/transactions${params.toString() ? `?${params.toString()}` : ''}`)
    })
  }

  const current = {
    q: searchParams.get('q') ?? '',
    type: searchParams.get('type') ?? '',
    accountId: searchParams.get('account') ?? '',
    categoryId: searchParams.get('category') ?? '',
  }

  return (
    <div className="filter-bar" style={{ opacity: pending ? 0.6 : 1 }}>
      <input
        className="input filter-search"
        type="search"
        placeholder="Cari merchant atau catatan…"
        defaultValue={current.q}
        onKeyDown={(e) => {
          if (e.key === 'Enter') apply('q', (e.target as HTMLInputElement).value.trim())
        }}
      />
      <AppSelect
        value={current.type || 'all'}
        onValueChange={(v) => apply('type', v === 'all' ? '' : v)}
        aria-label="Filter tipe"
        options={[
          { value: 'all', label: 'Semua tipe' },
          { value: 'expense', label: 'Pengeluaran' },
          { value: 'income', label: 'Pendapatan' },
          { value: 'transfer', label: 'Transfer' },
        ]}
      />
      <AppSelect
        value={current.accountId || 'all'}
        onValueChange={(v) => apply('account', v === 'all' ? '' : v)}
        aria-label="Filter akun"
        options={[
          { value: 'all', label: 'Semua akun' },
          ...accounts.filter((a) => a.is_active).map((a) => ({ value: a.id, label: a.name })),
        ]}
      />
      <AppSelect
        value={current.categoryId || 'all'}
        onValueChange={(v) => apply('category', v === 'all' ? '' : v)}
        aria-label="Filter kategori"
        options={[
          { value: 'all', label: 'Semua kategori' },
          ...categories.filter((c) => c.is_active).map((c) => ({ value: c.id, label: c.name, dot: c.color })),
        ]}
      />
      {(current.q || current.type || current.accountId || current.categoryId) ? (
        <button className="page-button ghost" type="button" onClick={() => {
          startTransition(() => router.push('/app/transactions'))
        }}>Reset</button>
      ) : null}
    </div>
  )
}