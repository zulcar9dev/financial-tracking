import Link from 'next/link'
import {
  ArrowDownLeft,
  ArrowUpRight,
  ArrowsClockwise,
  CalendarBlank,
  ChartLine,
  DownloadSimple,
  PlusCircle,
  TrendUp,
  Wallet,
  Warning,
} from '@phosphor-icons/react/ssr'
import PeriodTabs from '@/components/period-tabs'
import { getCurrentUser } from '@/lib/insforge/server'
import {
  getAccountsWithBalances,
  getBudgets,
  getBudgetAllocations,
  getCategorySpending,
  getConfirmedExpenseTransactions,
  getPeriodTotals,
  getProfile,
  getRecentTransactions,
  getUpcomingRecurring,
} from '@/lib/db'
import { computeBudgets } from '@/lib/budget'
import {
  formatDateShort,
  formatDateTime,
  formatIDR,
  formatIDRFull,
  monthLabel,
  periodRange,
  todayInTimezone,
  type PeriodKey,
} from '@/lib/format'
import type { PeriodKey as PeriodKeyT } from '@/lib/format'
import { ACCOUNT_TYPE_ICONS, TRANSACTION_TYPE_ICONS } from '@/lib/finance-icons'

export const dynamic = 'force-dynamic'

const VALID: PeriodKeyT[] = ['this_month', 'last_month', 'last_30_days', 'this_year', 'custom']
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ period?: string; from?: string; to?: string }>
}) {
  const { period: periodParam, from: fromParam, to: toParam } = await searchParams
  const hasCustom = Boolean(
    fromParam && toParam && DATE_RE.test(fromParam) && DATE_RE.test(toParam) && toParam >= fromParam,
  )
  const period = (VALID.includes(periodParam as PeriodKeyT) && (periodParam !== 'custom' || hasCustom)
    ? periodParam
    : 'this_month') as PeriodKey

  const user = await getCurrentUser()
  const profile = await getProfile(user!.id)
  const timezone = profile?.timezone ?? 'Asia/Jakarta'

  const bounds = periodRange(period, timezone, period === 'custom' ? { from: fromParam!, to: toParam! } : undefined)

  const [accounts, totals, categorySpending, recent, budgets, allocations, upcoming, expenseTransactions] = await Promise.all([
    getAccountsWithBalances(user!.id),
    getPeriodTotals(user!.id, bounds.from, bounds.to),
    getCategorySpending(user!.id, bounds.from, bounds.to),
    getRecentTransactions(user!.id, 6),
    getBudgets(user!.id),
    getBudgetAllocations(user!.id),
    getUpcomingRecurring(user!.id, 5),
    getConfirmedExpenseTransactions(user!.id),
  ])

  const totalBalance = accounts.reduce((sum, a) => sum + (a.is_active ? a.balance_idr : 0), 0)
  const activeAccounts = accounts.filter((a) => a.is_active)
  const netFlow = totals.income - totals.expense
  const spendingTotal = categorySpending.reduce((sum, c) => sum + c.total, 0)

  const now = todayInTimezone(timezone)
  const hour = now.getHours()
  const greeting = hour < 11 ? 'Selamat pagi' : hour < 15 ? 'Selamat siang' : hour < 19 ? 'Selamat sore' : 'Selamat malam'
  const todayLabel = new Intl.DateTimeFormat('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric', timeZone: timezone }).format(now)

  const summaries = computeBudgets(budgets, allocations, expenseTransactions)
  const overOrNear = summaries.filter((b) => b.status === 'over' || b.status === 'near')

  const topCategories = categorySpending.slice(0, 5)
  const donutColor = (name: string) => {
    const palette = ['#e9a23b', '#8b5cf6', '#f0593a', '#2fbf9f', '#5b8def', '#9aa3b2']
    const known: Record<string, string> = { Makanan: '#e9a23b', Tagihan: '#8b5cf6', Belanja: '#f0593a', Transportasi: '#2fbf9f' }
    if (known[name]) return known[name]
    return palette[Math.abs(name.split('').reduce((h, c) => h + c.charCodeAt(0), 0)) % palette.length]
  }

  return (
    <div className="page-stack">
      <section className="page-intro">
        <div>
          <p className="eyebrow">{todayLabel}</p>
          <h1>{greeting}, {profile?.display_name ?? 'Pengguna'}.</h1>
          <p className="intro-copy">Ini ringkasan keuangan Anda untuk {period === 'custom' ? 'rentang tanggal terpilih' : monthLabel(now, timezone)}.</p>
        </div>
        <div className="intro-actions">
          <Link className="button button-secondary" href="/app/settings/data"><DownloadSimple className="finance-icon" size={17} weight="regular" aria-hidden="true" /> Ekspor data</Link>
          <Link className="button button-primary" href="/app/capture"><PlusCircle className="finance-icon" size={17} weight="regular" aria-hidden="true" /> Catat transaksi</Link>
        </div>
      </section>

      <section className="period-bar" aria-label="Filter periode">
        <PeriodTabs />
        <span className="date-filter"><CalendarBlank className="finance-icon" size={16} weight="regular" aria-hidden="true" /> {formatDateShort(bounds.from.toISOString(), timezone)} – {formatDateShort(bounds.to.toISOString(), timezone)}</span>
      </section>

      <section className="metric-grid" aria-label="Ringkasan periode">
        <article className="metric-card balance-card">
          <div className="metric-top"><span className="metric-label">Total saldo</span><span className="metric-icon balance-icon"><Wallet size={18} weight="duotone" aria-hidden="true" /></span></div>
          <strong className="metric-value">{formatIDR(totalBalance)}</strong>
          <div className="metric-foot"><span className="status-positive"><TrendUp size={13} weight="regular" aria-hidden="true" /> {activeAccounts.length} akun aktif</span><span>semua saldo</span></div>
          <div className="balance-context"><span>{activeAccounts.length} akun aktif</span><span>·</span><span>saldo berjalan</span></div>
          <div className="balance-bars" aria-hidden="true">{Array.from({ length: 12 }).map((_, i) => <i key={i}></i>)}</div>
        </article>
        <article className="metric-card">
          <div className="metric-top"><span className="metric-label">Pendapatan</span><span className="metric-icon income-icon"><ArrowDownLeft size={18} weight="duotone" aria-hidden="true" /></span></div>
          <strong className="metric-value">{formatIDR(totals.income)}</strong>
          <div className="metric-foot"><span className="status-positive">masuk</span><span>periode ini</span></div>
          <div className="mini-line income-line" aria-hidden="true"><span></span></div>
        </article>
        <article className="metric-card">
          <div className="metric-top"><span className="metric-label">Pengeluaran</span><span className="metric-icon expense-icon"><ArrowUpRight size={18} weight="duotone" aria-hidden="true" /></span></div>
          <strong className="metric-value">{formatIDR(totals.expense)}</strong>
          <div className="metric-foot"><span className="status-negative">keluar</span><span>periode ini</span></div>
          <div className="mini-line expense-line" aria-hidden="true"><span></span></div>
        </article>
        <article className="metric-card net-card">
          <div className="metric-top"><span className="metric-label">Arus kas bersih</span><span className="metric-icon net-icon"><ChartLine size={18} weight="duotone" aria-hidden="true" /></span></div>
          <strong className="metric-value">{formatIDR(Math.max(0, netFlow))}</strong>
          <div className="metric-foot">
            <span className={netFlow >= 0 ? 'status-positive' : 'status-negative'}>{netFlow >= 0 ? 'Sehat' : 'Defisit'}</span>
            <span>bulan ini</span>
          </div>
          <div className="net-line" aria-hidden="true"><span></span></div>
        </article>
      </section>

      <section className="visual-grid" aria-label="Visual keuangan">
        <article className="panel accounts-panel">
          <div className="panel-header">
            <div><span className="panel-kicker">RUANG UANG</span><h2>Akun aktif</h2><p>Saldo berjalan dari transaksi confirmed.</p></div>
            <Link className="round-link" href="/app/accounts" aria-label="Kelola akun"><ArrowUpRight size={16} weight="regular" aria-hidden="true" /></Link>
          </div>
          {activeAccounts.length === 0 ? (
            <p className="empty-hint">Belum ada akun. <Link className="text-button" href="/app/accounts">Buat akun pertama <ArrowUpRight size={13} weight="regular" aria-hidden="true" /></Link></p>
          ) : (
            <div className="account-stack">
              {activeAccounts.slice(0, 3).map((account) => (
                <div key={account.id} className={`account-card account-${account.account_type}`}>
                  <div className="account-top">
                    {(() => { const AccountIcon = ACCOUNT_TYPE_ICONS[account.account_type]; return <span className="account-logo"><AccountIcon size={19} weight="duotone" aria-hidden="true" /></span> })()}
                    <span className="account-type">{account.account_type.replace('_', ' ').toUpperCase()}</span>
                  </div>
                  <strong>{formatIDR(account.balance_idr)}</strong>
                  <div className="account-bottom">
                    <span>{account.name}</span>
                    <span className="account-status"><i></i>{account.is_active ? 'Aktif' : 'Nonaktif'}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
          <Link className="panel-link" href="/app/accounts">Lihat semua akun <ArrowUpRight size={13} weight="regular" aria-hidden="true" /></Link>
        </article>
      </section>

      <section className="dashboard-grid">
        <article className="panel spending-panel">
          <div className="panel-header"><div><h2>Pengeluaran per kategori</h2><p>Ringkasan transaksi yang telah dikonfirmasi.</p></div></div>
          {topCategories.length === 0 ? (
            <p className="empty-hint">Belum ada pengeluaran di periode ini.</p>
          ) : (
            <div className="spending-content">
              <div className="donut-chart" style={{ background: `conic-gradient(${topCategories.map((c, i) => `${donutColor(c.name)} ${topCategories.slice(0, i).reduce((s, x) => s + (x.total / Math.max(1, spendingTotal)) * 360, 0)}% ${topCategories.slice(0, i + 1).reduce((s, x) => s + (x.total / Math.max(1, spendingTotal)) * 360, 0)}%`).join(',')})` }}>
                <div><strong>{formatIDR(spendingTotal, { compact: true })}</strong><small>total pengeluaran</small></div>
              </div>
              <ul className="legend-list">
                {topCategories.map((c) => (
                  <li key={c.category_id}>
                    <span className="legend-color" style={{ background: donutColor(c.name) }}></span>
                    <span>{c.name}</span>
                    <strong>{formatIDR(c.total)}</strong>
                    <small>{spendingTotal > 0 ? Math.round((c.total / spendingTotal) * 100) : 0}%</small>
                  </li>
                ))}
              </ul>
            </div>
          )}
          <Link className="panel-link" href="/app/transactions">Lihat semua transaksi <ArrowUpRight size={13} weight="regular" aria-hidden="true" /></Link>
        </article>

        <article className="panel budget-panel">
          <div className="panel-header"><div><h2>Status anggaran</h2><p>{monthLabel(now, timezone)} · semua model</p></div><Link className="text-button" href="/app/budgets">Kelola <ArrowUpRight size={13} weight="regular" aria-hidden="true" /></Link></div>
          {summaries.length === 0 ? (
            <p className="empty-hint">Belum ada anggaran. <Link className="text-button" href="/app/budgets">Buat anggaran <ArrowUpRight size={13} weight="regular" aria-hidden="true" /></Link></p>
          ) : (
            <>
              <div className="budget-list">
                {summaries.slice(0, 3).map((s) => (
                  <div key={s.budget.id} className="budget-row">
                    <div className="budget-title">
                      <span className="budget-dot violet"></span>
                      <span>{s.budget.name}</span>
                      <strong className={s.status === 'over' ? 'over-budget' : ''}>{s.usedPercent ?? 0}%</strong>
                    </div>
                    <div className="progress-track">
                      <span className={`progress-fill ${s.status === 'over' ? 'coral-fill' : 'violet-fill'}`} style={{ width: `${Math.min(100, s.usedPercent ?? 0)}%` }}></span>
                    </div>
                    <div className="budget-meta"><span>{formatIDR(s.spent)} terpakai</span><span>dari {formatIDR(s.allocated)}</span></div>
                  </div>
                ))}
              </div>
              {overOrNear.length > 0 ? (
                <div className="budget-alert"><Warning size={17} weight="duotone" aria-hidden="true" /><p>Anggaran <strong>{overOrNear[0].budget.name}</strong> {overOrNear[0].status === 'over' ? 'telah melebihi batas' : 'hampir mencapai batas'}.</p><Link href="/app/budgets">Tinjau</Link></div>
              ) : null}
            </>
          )}
        </article>
      </section>

      <section className="lower-grid">
        <article className="panel transactions-panel">
          <div className="panel-header"><div><h2>Transaksi terbaru</h2><p>Aktivitas terakhir yang tersimpan.</p></div><Link className="text-button" href="/app/transactions">Lihat semua <ArrowUpRight size={13} weight="regular" aria-hidden="true" /></Link></div>
          {recent.length === 0 ? (
            <p className="empty-hint">Belum ada transaksi. <Link className="text-button" href="/app/capture">Catat transaksi pertama <ArrowUpRight size={13} weight="regular" aria-hidden="true" /></Link></p>
          ) : (
            <div className="transaction-list">
              {recent.map((t) => (
                <Link key={t.id} className="transaction-row" href={`/app/transactions/${t.id}`}>
                  <span className={`transaction-symbol ${t.transaction_type === 'income' ? 'income-symbol' : t.transaction_type === 'transfer' ? 'bill-symbol' : 'food-symbol'}`}>
                    {(() => { const TransactionIcon = TRANSACTION_TYPE_ICONS[t.transaction_type]; return <TransactionIcon size={18} weight="duotone" aria-hidden="true" /> })()}
                  </span>
                  <div className="transaction-info">
                    <strong>{t.merchant ?? 'Tanpa keterangan'}</strong>
                    <small>{formatDateTime(t.occurred_at, timezone)} · {t.category?.name ?? (t.transaction_type === 'transfer' ? 'Transfer' : 'Tanpa kategori')} · <em>{t.source === 'recurring' ? 'Berulang' : t.source === 'chat' ? 'Chat' : t.source === 'receipt' ? 'Struk' : 'Manual'}</em></small>
                  </div>
                  <strong className={`amount ${t.transaction_type === 'income' ? 'income-amount' : t.transaction_type === 'transfer' ? 'transfer-amount' : 'expense-amount'}`}>
                    {t.transaction_type === 'income' ? '+' : t.transaction_type === 'expense' ? '−' : '⇄'} {formatIDRFull(t.amount_idr)}
                  </strong>
                </Link>
              ))}
            </div>
          )}
        </article>

        <article className="panel recurring-panel">
          <div className="panel-header"><div><h2>Berlangganan berikutnya</h2><p>Transaksi berulang yang akan datang.</p></div><Link className="text-button" href="/app/recurring">Kelola <ArrowUpRight size={13} weight="regular" aria-hidden="true" /></Link></div>
          {upcoming.length === 0 ? (
            <p className="empty-hint">Tidak ada transaksi berulang mendatang.</p>
          ) : (
            <div className="transaction-list">
              {upcoming.map((t) => (
                <div key={t.id} className="transaction-row">
                  <span className="transaction-symbol bill-symbol"><ArrowsClockwise size={18} weight="duotone" aria-hidden="true" /></span>
                  <div className="transaction-info">
                    <strong>{t.name}</strong>
                    <small>{formatDateTime(t.next_occurrence_at, timezone)} · {t.frequency}</small>
                  </div>
                  <strong className="amount expense-amount">− {formatIDRFull(t.amount_idr)}</strong>
                </div>
              ))}
            </div>
          )}
        </article>
      </section>

      <footer className="page-footer">
        <span>Financial Tracking AI · IDR · {timezone}</span>
        <span>{totals.income > 0 || totals.expense > 0 ? 'Data dari transaksi confirmed' : 'Belum ada transaksi pada periode ini'}</span>
      </footer>
    </div>
  )
}
