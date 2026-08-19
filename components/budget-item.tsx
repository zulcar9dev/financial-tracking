'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Pause, Play, PencilSimple, Trash, Warning } from '@phosphor-icons/react'
import BudgetForm from '@/components/budget-form'
import { toggleBudgetActiveAction, deleteBudgetAction } from '@/lib/actions/budgets'
import { formatIDRFull } from '@/lib/format'
import type { BudgetSummary } from '@/lib/budget'
import type { Category } from '@/lib/types'

const MODEL_LABEL: Record<string, string> = {
  monthly_category: 'Per kategori',
  flexible_period: 'Periode fleksibel',
  envelope: 'Envelope',
}

export function BudgetItem({
  summary,
  categories,
  allocationSpent,
}: {
  summary: BudgetSummary
  categories: Category[]
  allocationSpent: Record<string, number>
}) {
  const router = useRouter()
  const { budget } = summary
  const [editing, setEditing] = useState(false)
  const [pending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  if (editing) {
    return (
      <div className="surface-card" style={{ marginTop: 11 }}>
        <div className="surface-header">
          <div>
            <span className="surface-kicker">Edit anggaran</span>
            <h2>{budget.name}</h2>
            <p>{MODEL_LABEL[budget.budget_model] ?? budget.budget_model} · {formatIDRFull(summary.allocated)} dialokasikan.</p>
          </div>
          <span className="status-pill">{budget.budget_model}</span>
        </div>
        <div style={{ marginTop: 16 }}>
          <BudgetForm
            categories={categories}
            budget={budget}
            allocations={summary.allocations}
            onDone={() => setEditing(false)}
          />
        </div>
      </div>
    )
  }

  function toggle() {
    setError(null)
    const fd = new FormData()
    fd.set('id', budget.id)
    fd.set('active', budget.is_active ? 'off' : 'on')
    startTransition(async () => {
      const result = await toggleBudgetActiveAction(fd)
      if (result.error) setError(result.error)
      else router.refresh()
    })
  }

  function remove() {
    if (!window.confirm(`Hapus anggaran "${budget.name}"?`)) return
    setError(null)
    const fd = new FormData()
    fd.set('id', budget.id)
    startTransition(async () => {
      const result = await deleteBudgetAction(fd)
      if (result.error) setError(result.error)
      else router.refresh()
    })
  }

  return (
    <div key={budget.id} style={{ opacity: budget.is_active ? 1 : 0.6 }}>
      <div className="budget-line-head">
        <span>
          {budget.name}
          <small style={{ color: '#718177', fontWeight: 400 }}> · {MODEL_LABEL[budget.budget_model] ?? budget.budget_model}</small>
          {!budget.is_active ? <small style={{ color: '#718177', fontWeight: 400 }}> · dijeda</small> : null}
        </span>
        <strong>{summary.usedPercent ?? 0}%</strong>
      </div>
      <div className={`budget-progress${summary.status === 'over' ? ' coral' : summary.status === 'near' ? ' amber' : ''}`}>
        <i style={{ width: `${Math.min(100, summary.usedPercent ?? 0)}%` }}></i>
      </div>
      <div className="budget-line-foot">
        <span>{formatIDRFull(summary.spent)} terpakai</span>
        <span>dari {formatIDRFull(summary.allocated)}{budget.budget_model === 'envelope' ? ' + rollover' : ''}</span>
      </div>
      {budget.budget_model === 'envelope' && summary.allocations.length > 0 ? (
        <div className="envelope-grid">
          {summary.allocations.map((a) => {
            const spent = allocationSpent[a.id] ?? 0
            const avail = a.allocated_amount_idr + (a.rollover_amount_idr ?? 0) - spent
            return (
              <div key={a.id} className="envelope">
                <div className="envelope-top"><span>{categories.find((c) => c.id === a.category_id)?.name ?? '—'}</span>{spent > a.allocated_amount_idr ? <Warning size={15} weight="duotone" aria-label="Anggaran terlampaui" /> : null}</div>
                <strong>{formatIDRFull(avail)}</strong>
                <small>sisa dari {formatIDRFull(a.allocated_amount_idr)}</small>
              </div>
            )
          })}
        </div>
      ) : null}
      <div style={{ display: 'flex', gap: 7, marginTop: 10, flexWrap: 'wrap', alignItems: 'center' }}>
        {error ? <small style={{ color: 'var(--page-coral)', fontSize: 10 }}>{error}</small> : null}
        <button type="button" className="page-button small" onClick={() => setEditing(true)} disabled={pending}>
          <PencilSimple size={13} weight="regular" aria-hidden="true" /> Edit
        </button>
        <button type="button" className="page-button small" onClick={toggle} disabled={pending}>
          {budget.is_active ? <><Pause size={13} weight="regular" aria-hidden="true" /> Jeda</> : <><Play size={13} weight="regular" aria-hidden="true" /> Aktifkan</>}
        </button>
        <button type="button" className="page-button small danger" onClick={remove} disabled={pending}>
          <Trash size={13} weight="regular" aria-hidden="true" /> Hapus
        </button>
      </div>
    </div>
  )
}