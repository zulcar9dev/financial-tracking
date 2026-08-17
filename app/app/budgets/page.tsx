import BudgetForm from '@/components/budget-form'
import { getCurrentUser } from '@/lib/insforge/server'
import { getBudgetAllocations, getBudgets, getCategories, getConfirmedExpenseTransactions, getProfile } from '@/lib/db'
import { computeBudgets } from '@/lib/budget'
import { formatIDRFull, monthLabel, todayInTimezone } from '@/lib/format'

export const dynamic = 'force-dynamic'

const MODEL_LABEL: Record<string, string> = {
  per_category: 'Per kategori',
  flexible_period: 'Periode fleksibel',
  envelope: 'Envelope',
}

export default async function BudgetsPage() {
  const user = await getCurrentUser()
  const [profile, budgets, allocations, categories, expenseTransactions] = await Promise.all([
    getProfile(user!.id),
    getBudgets(user!.id),
    getBudgetAllocations(user!.id),
    getCategories(user!.id),
    getConfirmedExpenseTransactions(user!.id),
  ])

  const summaries = computeBudgets(budgets, allocations, expenseTransactions)
  const totalAllocated = summaries.reduce((s, b) => s + b.allocated, 0)
  const totalSpent = summaries.reduce((s, b) => s + b.spent, 0)
  const now = todayInTimezone(profile?.timezone ?? 'Asia/Jakarta')

  return (
    <div className="page-stack">
      <section className="page-heading">
        <div>
          <span className="page-kicker">Budgets / {summaries.length} aktif</span>
          <h1>Anggaran.</h1>
          <p>Tiga model anggaran — per kategori, periode fleksibel, dan envelope.</p>
        </div>
      </section>

      <div className="budget-layout">
        <section className="surface-card">
          <div className="surface-header">
            <div><span className="surface-kicker">Ringkasan</span><h2>Status anggaran</h2><p>{monthLabel(now, profile?.timezone ?? 'Asia/Jakarta')} · semua model memakai kategori yang sama.</p></div>
            <span className="status-pill">{summaries.length} aktif</span>
          </div>

          <div className="budget-total">
            <div><span>Total dialokasikan</span><strong>{formatIDRFull(totalAllocated)}</strong></div>
            <small>Terpakai {formatIDRFull(totalSpent)} · sisa {formatIDRFull(totalAllocated - totalSpent)}</small>
          </div>

          {summaries.length === 0 ? (
            <div className="empty-state">
              <div>
                <span className="empty-mark">◒</span>
                <h2>Belum ada anggaran</h2>
                <p>Buat anggaran pertama untuk memantau batas pengeluaran per kategori.</p>
              </div>
            </div>
          ) : (
            <div className="budget-lines">
              {summaries.map((s) => (
                <div key={s.budget.id}>
                  <div className="budget-line-head">
                    <span>{s.budget.name} <small style={{ color: '#718177', fontWeight: 400 }}>· {MODEL_LABEL[s.budget.budget_model]}</small></span>
                    <strong>{s.usedPercent ?? 0}%</strong>
                  </div>
                  <div className={`budget-progress${s.status === 'over' ? ' coral' : s.status === 'near' ? ' amber' : ''}`}>
                    <i style={{ width: `${Math.min(100, s.usedPercent ?? 0)}%` }}></i>
                  </div>
                  <div className="budget-line-foot">
                    <span>{formatIDRFull(s.spent)} terpakai</span>
                    <span>dari {formatIDRFull(s.allocated)}{s.budget.budget_model === 'envelope' ? ' + rollover' : ''}</span>
                  </div>
                  {s.budget.budget_model === 'envelope' && s.allocations.length > 0 ? (
                    <div className="envelope-grid">
                      {s.allocations.map((a) => {
                        const spent = expenseTransactions
                          .filter((t) => t.category_id === a.category_id)
                          .filter((t) => t.occurred_at.slice(0, 10) >= a.period_start.slice(0, 10) && t.occurred_at.slice(0, 10) <= a.period_end.slice(0, 10))
                          .reduce((sum, t) => sum + t.amount_idr, 0)
                        const avail = a.allocated_amount_idr + (a.rollover_amount_idr ?? 0) - spent
                        return (
                          <div key={a.id} className="envelope">
                            <div className="envelope-top"><span>{categories.find((c) => c.id === a.category_id)?.name ?? '—'}</span><span>{spent > a.allocated_amount_idr ? '⚠' : ''}</span></div>
                            <strong>{formatIDRFull(avail)}</strong>
                            <small>sisa dari {formatIDRFull(a.allocated_amount_idr)}</small>
                          </div>
                        )
                      })}
                    </div>
                  ) : null}
                </div>
              ))}
            </div>
          )}
        </section>

        <div style={{ display: 'grid', gap: 11, alignContent: 'start' }}>
          <section className="upcoming-card">
            <span className="upcoming-date">◌ {monthLabel(now, profile?.timezone ?? 'Asia/Jakarta')}</span>
            <h2>Buat anggaran baru</h2>
            <p>Pilih model yang cocok: batas per kategori, batas total periode, atau alokasi envelope per kategori.</p>
          </section>
          <BudgetForm categories={categories} />
        </div>
      </div>
    </div>
  )
}