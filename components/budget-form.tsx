'use client'

import { useRef, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Plus, X } from '@phosphor-icons/react'
import { createBudgetAction, deleteBudgetAction, updateBudgetAction, type BudgetPayload } from '@/lib/actions/budgets'
import { parseIDRInput } from '@/lib/format'
import type { Budget, BudgetAllocation, BudgetModel, Category } from '@/lib/types'

const MODELS: { key: BudgetModel; label: string }[] = [
  { key: 'monthly_category', label: 'Per kategori' },
  { key: 'flexible_period', label: 'Periode fleksibel' },
  { key: 'envelope', label: 'Envelope' },
]

const today = () => new Date().toISOString().slice(0, 10)

export default function BudgetForm({
  categories,
  budget,
  allocations,
  onDone,
}: {
  categories: Category[]
  budget?: Budget
  allocations?: BudgetAllocation[]
  onDone?: () => void
}) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [model, setModel] = useState<BudgetModel>(budget?.budget_model ?? 'monthly_category')
  const [targetText, setTargetText] = useState(budget?.target_amount_idr ? String(budget.target_amount_idr) : '')
  const [rows, setRows] = useState<{ category_id: string; allocated: string }[]>(
    allocations?.length
      ? allocations.map((a) => ({ category_id: a.category_id, allocated: String(a.allocated_amount_idr) }))
      : [{ category_id: '', allocated: '' }],
  )
  const formRef = useRef<HTMLFormElement>(null)
  const editing = Boolean(budget)

  const expenseCategories = categories.filter((c) => c.is_active && (c.category_kind === 'expense' || c.category_kind === 'both'))

  function setRow(i: number, patch: Partial<{ category_id: string; allocated: string }>) {
    setRows((prev) => prev.map((r, idx) => (idx === i ? { ...r, ...patch } : r)))
  }

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)
    const fd = new FormData(e.currentTarget)

    const target = model === 'envelope' ? null : parseIDRInput(targetText)
    if (model !== 'envelope' && !target) {
      setError('Target nominal wajib diisi.')
      return
    }

    const allocations = model === 'envelope'
      ? rows
          .filter((r) => r.category_id && r.allocated.replace(/\D/g, ''))
          .map((r) => ({
            category_id: r.category_id,
            period_start: String(fd.get('period_start') ?? ''),
            period_end: String(fd.get('period_end') ?? ''),
            allocated_amount_idr: parseIDRInput(r.allocated) ?? 0,
          }))
      : []

    const payload: BudgetPayload = {
      budget_model: model,
      name: String(fd.get('name') ?? '').trim(),
      category_id: model === 'monthly_category' ? (String(fd.get('category_id') ?? '') || null) : null,
      period_start: String(fd.get('period_start') ?? ''),
      period_end: String(fd.get('period_end') ?? ''),
      target_amount_idr: target,
      rollover_enabled: fd.get('rollover_enabled') === 'on',
      notify_at_80: fd.get('notify_at_80') === 'on',
      notify_at_100: fd.get('notify_at_100') === 'on',
      notify_over: fd.get('notify_over') === 'on',
      allocations,
    }

    startTransition(async () => {
      const result = editing && budget ? await updateBudgetAction({ ...payload, id: budget.id }) : await createBudgetAction(payload)
      if (result.error) {
        setError(result.error)
        return
      }
      formRef.current?.reset()
      setRows([{ category_id: '', allocated: '' }])
      setTargetText('')
      onDone?.()
      router.refresh()
    })
  }

  function onDelete() {
    if (!budget) return
    if (!window.confirm(`Hapus anggaran "${budget.name}"?`)) return
    const fd = new FormData()
    fd.set('id', budget.id)
    startTransition(async () => {
      await deleteBudgetAction(fd)
      onDone?.()
      router.refresh()
    })
  }

  return (
    <form ref={formRef} onSubmit={onSubmit} className="manual-card surface-card" id="new-budget">
      <div className="model-tabs" role="tablist">
        {MODELS.map((m) => (
          <button
            key={m.key}
            type="button"
            role="tab"
            aria-selected={model === m.key}
            className={`model-tab${model === m.key ? ' active' : ''}`}
            onClick={() => setModel(m.key)}
            disabled={pending}
          >
            {m.label}
          </button>
        ))}
      </div>

      {error ? <p className="form-error" role="alert">{error}</p> : null}

      <div className="manual-grid">
        <div className="field">
          <label htmlFor="budget-name">Nama anggaran</label>
          <input className="input" id="budget-name" name="name" type="text" required
            defaultValue={budget?.name ?? ''} placeholder="Contoh: Makan di luar" />
        </div>

        {model === 'monthly_category' ? (
          <div className="field">
            <label htmlFor="budget-category">Kategori</label>
            <select className="select" id="budget-category" name="category_id" required defaultValue={budget?.category_id ?? ''}>
              <option value="" disabled>Pilih kategori…</option>
              {expenseCategories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
        ) : (
          <div className="field"><label>&nbsp;</label><small style={{ alignSelf: 'center' }}>
            {model === 'flexible_period' ? 'Seluruh pengeluaran dalam periode dihitung.' : 'Alokasi per kategori di bawah.'}
          </small></div>
        )}

        {model !== 'envelope' ? (
          <div className="field">
            <label htmlFor="budget-target">Target (IDR)</label>
            <input className="input" id="budget-target" name="target_amount_idr" type="text" inputMode="numeric"
              value={targetText} onChange={(e) => setTargetText(e.target.value.replace(/\D/g, ''))}
              placeholder="Rp2.000.000" required />
          </div>
        ) : <div className="field"><label>&nbsp;</label></div>}

        <div className="field">
          <label htmlFor="period-start">Periode mulai</label>
          <input className="input" id="period-start" name="period_start" type="date" required
            defaultValue={budget?.period_start ?? today()} />
        </div>

        <div className="field">
          <label htmlFor="period-end">Periode selesai</label>
          <input className="input" id="period-end" name="period_end" type="date" required
            defaultValue={budget?.period_end ?? new Date(new Date().setMonth(new Date().getMonth() + 1)).toISOString().slice(0, 10)} />
        </div>

        {model === 'envelope' ? (
          <div className="field full">
            <label>Alokasi per kategori</label>
            <div style={{ display: 'grid', gap: 8 }}>
              {rows.map((row, i) => (
                <div key={i} style={{ display: 'grid', gridTemplateColumns: '1fr 150px 36px', gap: 8 }}>
                  <select className="select" value={row.category_id} required
                    onChange={(e) => setRow(i, { category_id: e.target.value })}>
                    <option value="" disabled>Pilih kategori…</option>
                    {expenseCategories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                  <input className="input" type="text" inputMode="numeric" placeholder="Nominal"
                    value={row.allocated} required
                    onChange={(e) => setRow(i, { allocated: e.target.value.replace(/\D/g, '') })} />
                  <button type="button" className="page-button ghost" aria-label="Hapus baris"
                     onClick={() => setRows((prev) => (prev.length > 1 ? prev.filter((_, idx) => idx !== i) : prev))}><X size={16} weight="regular" aria-hidden="true" /></button>
                </div>
              ))}
              <button type="button" className="page-button ghost" style={{ justifySelf: 'start' }}
                onClick={() => setRows((prev) => [...prev, { category_id: '', allocated: '' }])}>
                <Plus size={16} weight="regular" aria-hidden="true" /> Tambah alokasi
              </button>
            </div>
          </div>
        ) : null}

        <div className="field full check-row">
          <input id="notify-80" name="notify_at_80" type="checkbox" defaultChecked={budget?.notify_at_80 ?? true} />
          <label htmlFor="notify-80">Beri notifikasi saat 80% terpakai</label>
        </div>
        <div className="field full check-row">
          <input id="notify-100" name="notify_at_100" type="checkbox" defaultChecked={budget?.notify_at_100 ?? true} />
          <label htmlFor="notify-100">Beri notifikasi saat 100% terpakai</label>
        </div>
        <div className="field full check-row">
          <input id="notify-over" name="notify_over" type="checkbox" defaultChecked={budget?.notify_over ?? true} />
          <label htmlFor="notify-over">Beri notifikasi saat melebihi anggaran</label>
        </div>
        {model === 'envelope' ? (
          <div className="field full check-row">
            <input id="rollover" name="rollover_enabled" type="checkbox" defaultChecked={budget?.rollover_enabled ?? false} />
            <label htmlFor="rollover">Terapkan rollover antar periode (sisa alokasi dibawa)</label>
          </div>
        ) : null}
      </div>

      <div className="manual-footer">
        {editing ? (
          <button type="button" className="page-button danger" onClick={onDelete} disabled={pending}>Hapus anggaran</button>
        ) : null}
        <button type="button" className="page-button ghost" onClick={onDone}>Batal</button>
        <button type="submit" className="page-button primary" disabled={pending}>
          {pending ? 'Menyimpan…' : editing ? 'Simpan perubahan' : 'Buat anggaran'}
        </button>
      </div>
    </form>
  )
}
