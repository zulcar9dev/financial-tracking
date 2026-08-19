'use client'

import { useRef, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { createTemplateAction, deleteTemplateAction, recordOccurrenceAction, toggleTemplateAction, updateTemplateAction, type TemplatePayload } from '@/lib/actions/recurring'
import { parseIDRInput } from '@/lib/format'
import type { Account, Category, RecurringTemplate } from '@/lib/types'

const OFFSET_OPTIONS = [
  { value: 1440, label: '1 hari sebelumnya' },
  { value: 4320, label: '3 hari sebelumnya' },
  { value: 10080, label: '1 minggu sebelumnya' },
]

const FREQUENCIES = [
  { value: 'daily', label: 'Harian' },
  { value: 'weekly', label: 'Mingguan' },
  { value: 'monthly', label: 'Bulanan' },
  { value: 'yearly', label: 'Tahunan' },
]

export default function TemplateForm({
  accounts,
  categories,
  template,
  onDone,
}: {
  accounts: Account[]
  categories: Category[]
  template?: RecurringTemplate
  onDone?: () => void
}) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [type, setType] = useState<'expense' | 'income' | 'transfer' | 'adjustment'>(template?.transaction_type ?? 'expense')
  const [amountText, setAmountText] = useState(template ? String(template.amount_idr) : '')
  const formRef = useRef<HTMLFormElement>(null)
  const editing = Boolean(template)

  const activeAccounts = accounts.filter((a) => a.is_active)
  const expenseCategories = categories.filter((c) => c.is_active && (c.category_kind === 'expense' || c.category_kind === 'both'))
  const incomeCategories = categories.filter((c) => c.is_active && (c.category_kind === 'income' || c.category_kind === 'both'))

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)
    const fd = new FormData(e.currentTarget)
    const amount = parseIDRInput(amountText)
    if (!amount) {
      setError('Nominal wajib diisi dan lebih dari nol.')
      return
    }

    const reminders = OFFSET_OPTIONS.filter((o) => fd.getAll('reminder_offsets').includes(String(o.value))).map((o) => o.value)

    const payload: TemplatePayload = {
      name: String(fd.get('name') ?? '').trim(),
      transaction_type: type,
      amount_idr: amount,
      account_id: type === 'transfer' ? null : (String(fd.get('account_id') ?? '') || null),
      transfer_from_id: type === 'transfer' ? (String(fd.get('transfer_from_id') ?? '') || null) : null,
      transfer_to_id: type === 'transfer' ? (String(fd.get('transfer_to_id') ?? '') || null) : null,
      category_id: type === 'expense' ? (String(fd.get('category_id') ?? '') || null) : null,
      frequency: String(fd.get('frequency') ?? 'monthly') as TemplatePayload['frequency'],
      interval_value: Math.max(1, parseInt(String(fd.get('interval_value') ?? '1'), 10) || 1),
      start_date: String(fd.get('start_date') ?? ''),
      end_date: (String(fd.get('end_date') ?? '') || null),
      reminder_offsets: reminders,
    }

    startTransition(async () => {
      const result = editing && template ? await updateTemplateAction({ ...payload, id: template.id }) : await createTemplateAction(payload)
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
    if (!template) return
    if (!window.confirm(`Hapus template "${template.name}"?`)) return
    const fd = new FormData()
    fd.set('id', template.id)
    startTransition(async () => {
      await deleteTemplateAction(fd)
      onDone?.()
      router.refresh()
    })
  }

  return (
    <form ref={formRef} onSubmit={onSubmit} className="manual-card surface-card" id="new-template">
      <div className="capture-tabs" role="tablist">
        {(['expense', 'income', 'transfer'] as const).map((t) => (
          <button key={t} type="button" role="tab" aria-selected={type === t}
            className={`capture-tab${type === t ? ' active' : ''}`} onClick={() => setType(t)} disabled={pending}>
            {t === 'expense' ? 'Pengeluaran' : t === 'income' ? 'Pendapatan' : 'Transfer'}
          </button>
        ))}
      </div>

      {error ? <p className="form-error" role="alert">{error}</p> : null}

      <div className="manual-grid">
        <div className="field">
          <label htmlFor="tpl-name">Nama template</label>
          <input className="input" id="tpl-name" name="name" type="text" required
            defaultValue={template?.name ?? ''} placeholder="Contoh: Gaji bulanan" />
        </div>

        <div className="field">
          <label htmlFor="tpl-amount">Nominal (IDR)</label>
          <input className="input" id="tpl-amount" name="amount_idr" type="text" inputMode="numeric" required
            value={amountText} onChange={(e) => setAmountText(e.target.value.replace(/\D/g, ''))}
            placeholder="Rp500.000" />
        </div>

        {type === 'transfer' ? (
          <>
            <div className="field">
              <label htmlFor="tpl-from">Akun sumber</label>
              <select className="select" id="tpl-from" name="transfer_from_id" required defaultValue={template?.transfer_from_id ?? ''}>
                <option value="" disabled>Pilih akun…</option>
                {activeAccounts.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
              </select>
            </div>
            <div className="field">
              <label htmlFor="tpl-to">Akun tujuan</label>
              <select className="select" id="tpl-to" name="transfer_to_id" required defaultValue={template?.transfer_to_id ?? ''}>
                <option value="" disabled>Pilih akun…</option>
                {activeAccounts.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
              </select>
            </div>
          </>
        ) : (
          <div className="field">
            <label htmlFor="tpl-account">Akun</label>
            <select className="select" id="tpl-account" name="account_id" required defaultValue={template?.account_id ?? ''}>
              <option value="" disabled>Pilih akun…</option>
              {activeAccounts.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
            </select>
          </div>
        )}

        {type !== 'transfer' ? (
          <div className="field">
            <label htmlFor="tpl-category">Kategori</label>
            <select className="select" id="tpl-category" name="category_id" defaultValue={template?.category_id ?? ''}>
              <option value="">Tanpa kategori</option>
              {(type === 'income' ? incomeCategories : expenseCategories).map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
        ) : <div className="field"><label>&nbsp;</label></div>}

        <div className="field">
          <label htmlFor="tpl-frequency">Frekuensi</label>
          <select className="select" id="tpl-frequency" name="frequency" defaultValue={template?.frequency ?? 'monthly'}>
            {FREQUENCIES.map((f) => <option key={f.value} value={f.value}>{f.label}</option>)}
          </select>
        </div>

        <div className="field">
          <label htmlFor="tpl-interval">Ulangi setiap</label>
          <input className="input" id="tpl-interval" name="interval_value" type="number" min="1" required
            defaultValue={template?.interval_value ?? 1} />
        </div>

        <div className="field">
          <label htmlFor="tpl-start">Tanggal mulai</label>
          <input className="input" id="tpl-start" name="start_date" type="date" required
            defaultValue={template?.start_date ?? new Date().toISOString().slice(0, 10)} />
        </div>

        <div className="field">
          <label htmlFor="tpl-end">Tanggal selesai (opsional)</label>
          <input className="input" id="tpl-end" name="end_date" type="date" defaultValue={template?.end_date ?? ''} />
        </div>

        <div className="field full">
          <label>Pengingat</label>
          <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap', minHeight: 42, alignItems: 'center' }}>
            {OFFSET_OPTIONS.map((o) => (
              <label key={o.value} className="check-row">
                <input type="checkbox" name="reminder_offsets" value={o.value}
                  defaultChecked={(template?.reminder_offsets ?? [1440]).includes(o.value)} />
                {o.label}
              </label>
            ))}
          </div>
        </div>
      </div>

      <div className="manual-footer">
        {editing ? (
          <button type="button" className="page-button danger" onClick={onDelete} disabled={pending}>Hapus template</button>
        ) : null}
        <button type="button" className="page-button ghost" onClick={onDone}>Batal</button>
        <button type="submit" className="page-button primary" disabled={pending}>
          {pending ? 'Menyimpan…' : editing ? 'Simpan perubahan' : 'Buat template'}
        </button>
      </div>
    </form>
  )
}

export function TemplateActions({ template, onEdit }: { template: RecurringTemplate; onEdit?: () => void }) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  function toggle() {
    const fd = new FormData()
    fd.set('id', template.id)
    fd.set('active', template.is_active ? 'off' : 'on')
    startTransition(async () => {
      await toggleTemplateAction(fd)
      router.refresh()
    })
  }

  function recordNow() {
    if (!window.confirm(`Catat "${template.name}" senilai ${template.amount_idr.toLocaleString('id-ID')} sekarang?`)) return
    startTransition(async () => {
      const result = await recordOccurrenceAction({
        template_id: template.id,
        occurred_at: new Date().toISOString(),
      })
      if (result.error) setError(result.error)
      else router.refresh()
    })
  }

  function remove() {
    if (!window.confirm(`Hapus template "${template.name}"? Pengingat terkait akan ikut terhapus.`)) return
    const fd = new FormData()
    fd.set('id', template.id)
    startTransition(async () => {
      const result = await deleteTemplateAction(fd)
      if (result.error) setError(result.error)
      else router.refresh()
    })
  }

  return (
    <div style={{ display: 'flex', gap: 6, alignItems: 'center', flexWrap: 'wrap', justifyContent: 'flex-end' }}>
      {error ? <small style={{ color: 'var(--page-coral)' }}>{error}</small> : null}
      <button type="button" className="page-button small" onClick={recordNow} disabled={pending}>Catat sekarang</button>
      <button type="button" className="page-button small" onClick={toggle} disabled={pending}>
        {template.is_active ? 'Jeda' : 'Aktifkan'}
      </button>
      <button type="button" className="page-button small" onClick={onEdit} disabled={pending}>Edit</button>
      <button type="button" className="page-button small danger" onClick={remove} disabled={pending}>Hapus</button>
    </div>
  )
}