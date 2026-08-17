'use client'

import { useMemo, useRef, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { confirmTransactionAction, updateTransactionAction, deleteTransactionAction, type ConfirmTransactionPayload } from '@/lib/actions/transactions'
import { parseIDRInput } from '@/lib/format'
import type { Account, Category, TransactionWithRelations } from '@/lib/types'

type Mode = 'expense' | 'income' | 'transfer' | 'adjustment'

const MODES: { key: Mode; label: string }[] = [
  { key: 'expense', label: 'Pengeluaran' },
  { key: 'income', label: 'Pendapatan' },
  { key: 'transfer', label: 'Transfer' },
]

export default function TransactionForm({
  accounts,
  categories,
  transaction,
  timezone,
  onDone,
}: {
  accounts: Account[]
  categories: Category[]
  transaction?: TransactionWithRelations
  timezone: string
  onDone?: () => void
}) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [mode, setMode] = useState<Mode>(transaction?.transaction_type ?? 'expense')
  const [amountText, setAmountText] = useState<string>(transaction ? String(transaction.amount_idr) : '')

  const editing = Boolean(transaction)
  const idempotencyKey = useRef<string>(editing ? undefined : crypto.randomUUID())
  const formRef = useRef<HTMLFormElement>(null)

  const activeAccounts = useMemo(() => accounts.filter((a) => a.is_active), [accounts])
  const expenseCategories = useMemo(
    () => categories.filter((c) => c.is_active && (c.category_kind === 'expense' || c.category_kind === 'both')),
    [categories],
  )
  const incomeCategories = useMemo(
    () => categories.filter((c) => c.is_active && (c.category_kind === 'income' || c.category_kind === 'both')),
    [categories],
  )

  const categoriesForMode = mode === 'income' ? incomeCategories : expenseCategories

  function onAmountInput(v: string) {
    const digits = v.replace(/\D/g, '').replace(/^0+(?=\d)/, '')
    setAmountText(digits)
  }

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)
    const fd = new FormData(e.currentTarget)
    const amount = parseIDRInput(amountText)
    if (!amount) {
      setError('Nominal harus diisi dan lebih dari nol.')
      return
    }

    const payload: ConfirmTransactionPayload = {
      transaction_type: mode,
      amount_idr: amount,
      occurred_at: String(fd.get('occurred_at') ?? new Date().toISOString()),
      merchant: String(fd.get('merchant') ?? '').trim() || null,
      note: String(fd.get('note') ?? '').trim() || null,
      category_id: (String(fd.get('category_id') ?? '') as string) || null,
      source: 'manual',
      account_id: (String(fd.get('account_id') ?? '') as string) || null,
      transfer_from_id: (String(fd.get('transfer_from_id') ?? '') as string) || null,
      transfer_to_id: (String(fd.get('transfer_to_id') ?? '') as string) || null,
      leg_direction: null,
      idempotency_key: editing ? undefined : idempotencyKey.current,
    }

    startTransition(async () => {
      const result = editing && transaction
        ? await updateTransactionAction({ ...payload, transaction_id: transaction.id })
        : await confirmTransactionAction(payload)
      if (result.error) {
        setError(result.error)
        return
      }
      formRef.current?.reset()
      setAmountText('')
      onDone?.()
      router.refresh()
    })
  }

  function onDelete() {
    if (!transaction) return
    if (!window.confirm('Hapus transaksi ini? Transaksi akan ditandai terhapus dan saldo akun diperbarui.')) return
    startTransition(async () => {
      const result = await deleteTransactionAction({ id: transaction.id })
      if (result.error) setError(result.error)
      else {
        onDone?.()
        router.push('/app/transactions')
        router.refresh()
      }
    })
  }

  return (
    <form ref={formRef} onSubmit={onSubmit} className="manual-card surface-card" id="manual">
      <div className="capture-tabs" role="tablist">
        {MODES.map((m) => (
          <button
            key={m.key}
            type="button"
            role="tab"
            aria-selected={mode === m.key}
            className={`capture-tab${mode === m.key ? ' active' : ''}`}
            onClick={() => setMode(m.key)}
            disabled={pending}
          >
            {m.label}
          </button>
        ))}
      </div>

      {error ? <p className="form-error" role="alert">{error}</p> : null}

      <div className="manual-grid">
        <div className="field">
          <label htmlFor="t-amount">Nominal (IDR)</label>
          <input
            className="input"
            id="t-amount"
            name="amount_idr"
            type="text"
            inputMode="numeric"
            required
            value={amountText}
            onChange={(e) => onAmountInput(e.target.value)}
            placeholder="Rp0"
            autoFocus
          />
        </div>

        <div className="field">
          <label htmlFor="t-date">Tanggal</label>
          <input
            className="input"
            id="t-date"
            name="occurred_at"
            type="datetime-local"
            required
            defaultValue={transaction ? new Date(transaction.occurred_at).toISOString().slice(0, 16) : new Date(new Date().getTime() - new Date().getTimezoneOffset() * 60000).toISOString().slice(0, 16)}
          />
          <small>Zona waktu {timezone}</small>
        </div>

        {mode === 'transfer' ? (
          <>
            <div className="field">
              <label htmlFor="t-from">Akun sumber</label>
              <select className="select" id="t-from" name="transfer_from_id" required defaultValue={transaction?.legs?.find((l) => l.direction === 'out')?.account_id ?? ''}>
                <option value="" disabled>Pilih akun sumber…</option>
                {activeAccounts.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
              </select>
            </div>
            <div className="field">
              <label htmlFor="t-to">Akun tujuan</label>
              <select className="select" id="t-to" name="transfer_to_id" required defaultValue={transaction?.legs?.find((l) => l.direction === 'in')?.account_id ?? ''}>
                <option value="" disabled>Pilih akun tujuan…</option>
                {activeAccounts.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
              </select>
            </div>
          </>
        ) : (
          <div className="field">
            <label htmlFor="t-account">Akun</label>
            <select className="select" id="t-account" name="account_id" required defaultValue={transaction?.legs?.[0]?.account_id ?? ''}>
              <option value="" disabled>Pilih akun…</option>
              {activeAccounts.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
            </select>
          </div>
        )}

        {mode !== 'transfer' ? (
          <div className="field">
            <label htmlFor="t-category">Kategori</label>
            <select className="select" id="t-category" name="category_id" defaultValue={transaction?.category_id ?? ''}>
              <option value="">Tanpa kategori</option>
              {categoriesForMode.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
        ) : null}

        <div className="field">
          <label htmlFor="t-merchant">Merchant / keterangan</label>
          <input className="input" id="t-merchant" name="merchant" type="text"
            defaultValue={transaction?.merchant ?? ''} placeholder="Contoh: Warteg Sederhana" />
        </div>

        <div className="field full">
          <label htmlFor="t-note">Catatan</label>
          <textarea className="textarea" id="t-note" name="note"
            defaultValue={transaction?.note ?? ''} placeholder="Catatan opsional…"></textarea>
        </div>
      </div>

      <div className="manual-footer">
        {editing ? (
          <button type="button" className="page-button danger" onClick={onDelete} disabled={pending}>
            Hapus transaksi
          </button>
        ) : null}
        <button type="button" className="page-button ghost" onClick={() => { formRef.current?.reset(); setAmountText(''); setError(null); }}>
          Batal
        </button>
        <button type="submit" className="page-button primary" disabled={pending || activeAccounts.length === 0}>
          {pending ? 'Menyimpan…' : editing ? 'Simpan perubahan' : mode === 'transfer' ? 'Konfirmasi transfer' : 'Konfirmasi & simpan'}
        </button>
      </div>

      {activeAccounts.length === 0 ? (
        <p className="form-error" role="alert">Buat akun keuangan terlebih dahulu sebelum mencatat transaksi.</p>
      ) : null}
    </form>
  )
}