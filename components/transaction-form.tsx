'use client'

import { useMemo, useRef, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import AppSelect from '@/components/app-select'
import { ACCOUNT_TYPE_ICONS } from '@/lib/finance-icons'
import { confirmTransactionAction, updateTransactionAction, deleteTransactionAction, type ConfirmTransactionPayload } from '@/lib/actions/transactions'
import { parseIDRInput } from '@/lib/format'
import type { Account, Category, TransactionWithRelations } from '@/lib/types'

type Mode = 'expense' | 'income' | 'transfer' | 'adjustment'

const MODES: { key: Mode; label: string }[] = [
  { key: 'expense', label: 'Pengeluaran' },
  { key: 'income', label: 'Pendapatan' },
  { key: 'transfer', label: 'Transfer' },
  { key: 'adjustment', label: 'Penyesuaian' },
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

  const accountOptions = useMemo(
    () =>
      activeAccounts.map((a) => {
        const TypeIcon = ACCOUNT_TYPE_ICONS[a.account_type]
        return { value: a.id, label: a.name, icon: <TypeIcon size={14} weight="regular" aria-hidden="true" /> }
      }),
    [activeAccounts],
  )

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
    if (mode === 'transfer' && (!String(fd.get('transfer_from_id') ?? '') || !String(fd.get('transfer_to_id') ?? ''))) {
      setError('Pilih akun sumber dan tujuan terlebih dahulu.')
      return
    }
    if (mode !== 'transfer' && mode !== 'adjustment' && !String(fd.get('account_id') ?? '')) {
      setError('Pilih akun terlebih dahulu.')
      return
    }

    const rawCategoryId = String(fd.get('category_id') ?? '')

    const payload: ConfirmTransactionPayload = {
      transaction_type: mode,
      amount_idr: amount,
      occurred_at: String(fd.get('occurred_at') ?? new Date().toISOString()),
      merchant: String(fd.get('merchant') ?? '').trim() || null,
      note: String(fd.get('note') ?? '').trim() || null,
      category_id: rawCategoryId && rawCategoryId !== 'none' ? rawCategoryId : null,
      source: 'manual',
      account_id: (String(fd.get('account_id') ?? '') as string) || null,
      transfer_from_id: (String(fd.get('transfer_from_id') ?? '') as string) || null,
      transfer_to_id: (String(fd.get('transfer_to_id') ?? '') as string) || null,
      leg_direction:
        mode === 'adjustment'
          ? (String(fd.get('leg_direction') ?? 'in') === 'out' ? 'out' : 'in')
          : null,
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
              <AppSelect
                id="t-from"
                name="transfer_from_id"
                defaultValue={transaction?.legs?.find((l) => l.direction === 'out')?.account_id ?? ''}
                placeholder="Pilih akun sumber…"
                aria-label="Akun sumber"
                options={accountOptions}
              />
            </div>
            <div className="field">
              <label htmlFor="t-to">Akun tujuan</label>
              <AppSelect
                id="t-to"
                name="transfer_to_id"
                defaultValue={transaction?.legs?.find((l) => l.direction === 'in')?.account_id ?? ''}
                placeholder="Pilih akun tujuan…"
                aria-label="Akun tujuan"
                options={accountOptions}
              />
            </div>
          </>
        ) : (
          <div className="field">
            <label htmlFor="t-account">Akun</label>
            <AppSelect
              id="t-account"
              name="account_id"
              defaultValue={transaction?.legs?.[0]?.account_id ?? ''}
              placeholder="Pilih akun…"
              aria-label="Akun transaksi"
              options={accountOptions}
            />
          </div>
        )}

        {mode === 'adjustment' ? (
          <div className="field">
            <label htmlFor="t-direction">Arah penyesuaian</label>
            <AppSelect
              id="t-direction"
              name="leg_direction"
              defaultValue={transaction?.legs?.[0]?.direction ?? 'in'}
              aria-label="Arah penyesuaian"
              options={[
                { value: 'in', label: 'Tambah saldo (+)' },
                { value: 'out', label: 'Kurangi saldo (−)' },
              ]}
            />
            <small>Koreksi saldo akun tanpa transaksi baru, mis. dana masuk tak tercatat.</small>
          </div>
        ) : null}

        {mode !== 'transfer' && mode !== 'adjustment' ? (
          <div className="field">
            <label htmlFor="t-category">Kategori</label>
            <AppSelect
              id="t-category"
              name="category_id"
              defaultValue={transaction?.category_id ?? 'none'}
              placeholder="Tanpa kategori"
              aria-label="Kategori transaksi"
              options={[
                { value: 'none', label: 'Tanpa kategori' },
                ...categoriesForMode.map((c) => ({ value: c.id, label: c.name, dot: c.color })),
              ]}
            />
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
          {pending ? 'Menyimpan…' : editing ? 'Simpan perubahan' : mode === 'transfer' ? 'Konfirmasi transfer' : mode === 'adjustment' ? 'Simpan penyesuaian' : 'Konfirmasi & simpan'}
        </button>
      </div>

      {activeAccounts.length === 0 ? (
        <p className="form-error" role="alert">Buat akun keuangan terlebih dahulu sebelum mencatat transaksi.</p>
      ) : null}
    </form>
  )
}