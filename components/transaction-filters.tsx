'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { useTransition } from 'react'
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
      <select className="select" value={current.type} onChange={(e) => apply('type', e.target.value)} aria-label="Filter tipe">
        <option value="">Semua tipe</option>
        <option value="expense">Pengeluaran</option>
        <option value="income">Pendapatan</option>
        <option value="transfer">Transfer</option>
      </select>
      <select className="select" value={current.accountId} onChange={(e) => apply('account', e.target.value)} aria-label="Filter akun">
        <option value="">Semua akun</option>
        {accounts.filter((a) => a.is_active).map((a) => (
          <option key={a.id} value={a.id}>{a.name}</option>
        ))}
      </select>
      <select className="select" value={current.categoryId} onChange={(e) => apply('category', e.target.value)} aria-label="Filter kategori">
        <option value="">Semua kategori</option>
        {categories.filter((c) => c.is_active).map((c) => (
          <option key={c.id} value={c.id}>{c.name}</option>
        ))}
      </select>
      {(current.q || current.type || current.accountId || current.categoryId) ? (
        <button className="page-button ghost" type="button" onClick={() => {
          startTransition(() => router.push('/app/transactions'))
        }}>Reset</button>
      ) : null}
    </div>
  )
}