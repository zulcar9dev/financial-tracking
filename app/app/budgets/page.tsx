import BudgetForm from '@/components/budget-form'
import { BudgetItem } from '@/components/budget-item'
import { CalendarBlank, ChartDonut } from '@phosphor-icons/react/ssr'
import { getCurrentUser } from '@/lib/insforge/server'
import { getBudgetAllocations, getBudgets, getCategories, getConfirmedExpenseTransactions, getProfile } from '@/lib/db'
import { computeBudgets } from '@/lib/budget'
import { formatIDRFull, monthLabel, todayInTimezone } from '@/lib/format'

export const dynamic = 'force-dynamic'

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

  const allocationSpent: Record<string, number> = {}
  for (const a of allocations) {
    allocationSpent[a.id] = expenseTransactions
      .filter((t) => t.category_id === a.category_id)
      .filter((t) => t.occurred_at.slice(0, 10) >= a.period_start.slice(0, 10) && t.occurred_at.slice(0, 10) <= a.period_end.slice(0, 10))
      .reduce((sum, t) => sum + t.amount_idr, 0)
  }

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
                <ChartDonut className="empty-mark" size={38} weight="duotone" aria-hidden="true" />
                <h2>Belum ada anggaran</h2>
                <p>Buat anggaran pertama untuk memantau batas pengeluaran per kategori.</p>
              </div>
            </div>
          ) : (
            <div className="budget-lines">
              {summaries.map((s) => (
                <BudgetItem key={s.budget.id} summary={s} categories={categories} allocationSpent={allocationSpent} />
              ))}
            </div>
          )}
        </section>

        <div style={{ display: 'grid', gap: 11, alignContent: 'start' }}>
          <section className="upcoming-card">
            <span className="upcoming-date"><CalendarBlank size={15} weight="regular" aria-hidden="true" /> {monthLabel(now, profile?.timezone ?? 'Asia/Jakarta')}</span>
            <h2>Buat anggaran baru</h2>
            <p>Pilih model yang cocok: batas per kategori, batas total periode, atau alokasi envelope per kategori.</p>
          </section>
          <BudgetForm categories={categories} />
        </div>
      </div>
    </div>
  )
}
