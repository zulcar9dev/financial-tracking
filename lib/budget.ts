import type { Budget, BudgetAllocation, Transaction } from '@/lib/types'

export type BudgetStatus = 'ok' | 'near' | 'over'

export interface BudgetSummary {
  budget: Budget
  allocations: BudgetAllocation[]
  spent: number
  allocated: number
  available: number
  usedPercent: number | null
  status: BudgetStatus
}

export function inRange(dateStr: string, start: string, end: string): boolean {
  const d = dateStr.slice(0, 10)
  return d >= start.slice(0, 10) && d <= end.slice(0, 10)
}

/**
 * Mesin anggaran bersama (FR-BUDGET-14): semua model memakai kategori dan
 * transaksi yang sama. Spent hanya dari transaksi expense berstatus confirmed.
 * Transfer tidak pernah dihitung sebagai spent (FR-BUDGET-04).
 */
export function computeBudgets(
  budgets: Budget[],
  allocations: BudgetAllocation[],
  transactions: Transaction[],
): BudgetSummary[] {
  const now = new Date().toISOString()
  const active = budgets.filter((b) => b.is_active)

  return active.map((budget) => {
    const ownAllocations = allocations.filter((a) => a.budget_id === budget.id)
    const isEnvelope = budget.budget_model === 'envelope'

    // Periode aktif (envelope bisa multi-bulan; gunakan rentang yang masih berjalan).
    const end = isEnvelope
      ? budget.period_end < now.slice(0, 10)
        ? budget.period_end
        : now.slice(0, 10)
      : budget.period_end < now.slice(0, 10)
        ? budget.period_end
        : now.slice(0, 10)

    let spent = 0
    if (isEnvelope) {
      for (const alloc of ownAllocations) {
        for (const t of transactions) {
          if (t.transaction_type !== 'expense') continue
          if (t.category_id !== alloc.category_id) continue
          if (!inRange(t.occurred_at, alloc.period_start, alloc.period_end)) continue
          spent += t.amount_idr
        }
      }
    } else {
      for (const t of transactions) {
        if (t.transaction_type !== 'expense') continue
        if (budget.category_id && t.category_id !== budget.category_id) continue
        if (!inRange(t.occurred_at, budget.period_start, end)) continue
        spent += t.amount_idr
      }
    }

    const allocated = isEnvelope
      ? ownAllocations.reduce((sum, a) => sum + a.allocated_amount_idr, 0)
      : (budget.target_amount_idr ?? 0)

    const rollover = isEnvelope
      ? ownAllocations.reduce((sum, a) => sum + (a.rollover_amount_idr ?? 0), 0)
      : 0

    const available = allocated + rollover - spent
    const usedPercent = allocated > 0 ? Math.round((spent / allocated) * 100) : null

    let status: BudgetStatus = 'ok'
    if (allocated > 0) {
      if (budget.notify_over && spent > allocated) status = 'over'
      else if (budget.notify_at_100 && spent >= allocated) status = 'over'
      else if (budget.notify_at_80 && usedPercent !== null && usedPercent >= 80) status = 'near'
    }

    return {
      budget,
      allocations: ownAllocations,
      spent,
      allocated,
      available,
      usedPercent,
      status,
    }
  })
}