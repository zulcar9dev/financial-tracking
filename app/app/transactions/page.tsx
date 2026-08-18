import Link from 'next/link'
import { ArrowLeft, ArrowRight, PlusCircle, Receipt } from '@phosphor-icons/react/ssr'
import TransactionFilters from '@/components/transaction-filters'
import { getCurrentUser } from '@/lib/insforge/server'
import { getAccounts, getCategories, getProfile, getTransactions } from '@/lib/db'
import { formatDateTime, formatIDRFull } from '@/lib/format'

export const dynamic = 'force-dynamic'

const PAGE_SIZE = 20

export default async function TransactionsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; type?: string; account?: string; category?: string; page?: string }>
}) {
  const sp = await searchParams
  const user = await getCurrentUser()
  const [profile, accounts, categories] = await Promise.all([
    getProfile(user!.id),
    getAccounts(user!.id),
    getCategories(user!.id),
  ])
  const timezone = profile?.timezone ?? 'Asia/Jakarta'

  const page = Math.max(1, parseInt(sp.page ?? '1', 10) || 1)
  const { rows, total } = await getTransactions(user!.id, {
    merchant: sp.q,
    type: sp.type,
    accountId: sp.account,
    categoryId: sp.category,
    page,
    pageSize: PAGE_SIZE,
  })

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE))
  const accountName = (id: string) => accounts.find((a) => a.id === id)?.name

  return (
    <div className="page-stack">
      <section className="page-heading">
        <div>
          <span className="page-kicker">Ledger / {total} transaksi</span>
          <h1>Transaksi.</h1>
          <p>Riwayat lengkap transaksi confirmed dari semua akun.</p>
        </div>
        <div className="heading-actions">
          <Link className="page-button primary" href="/app/capture"><PlusCircle className="finance-icon" size={17} weight="regular" aria-hidden="true" /> Catat transaksi</Link>
        </div>
      </section>

      <section className="surface-card table-card">
        <div className="surface-header">
          <div><span className="surface-kicker">All transactions</span><h2>Riwayat</h2><p>Transfer dicatat sebagai satu transaksi dengan dua sisi leg.</p></div>
          <span className="status-pill">{rows.length}/{total}</span>
        </div>

        <TransactionFilters accounts={accounts} categories={categories} />

        {rows.length === 0 ? (
          <div className="empty-state">
            <div>
              <Receipt className="empty-mark" size={38} weight="duotone" aria-hidden="true" />
              <h2>Belum ada transaksi</h2>
              <p>Transaksi yang Anda catat akan muncul di sini. Mulai dengan mencatat pengeluaran atau pendapatan pertama.</p>
              <Link className="page-button primary" href="/app/capture"><PlusCircle className="finance-icon" size={17} weight="regular" aria-hidden="true" /> Catat transaksi</Link>
            </div>
          </div>
        ) : (
          <div className="table-scroll">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Tanggal</th>
                  <th>Deskripsi</th>
                  <th>Kategori</th>
                  <th>Akun</th>
                  <th style={{ textAlign: 'right' }}>Jumlah</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((t) => {
                  const legs = t.legs ?? []
                  const accountLabel = t.transaction_type === 'transfer'
                     ? `${accountName(legs.find((l) => l.direction === 'out')?.account_id ?? '')} ke ${accountName(legs.find((l) => l.direction === 'in')?.account_id ?? '')}`
                    : legs.map((l) => accountName(l.account_id)).join(', ') || '—'
                  const amountClass = t.transaction_type === 'income' ? 'income' : t.transaction_type === 'expense' ? 'money' : ''
                  const sign = t.transaction_type === 'income' ? '+' : t.transaction_type === 'expense' ? '−' : '⇄'
                  return (
                    <tr key={t.id}>
                      <td>
                        <Link href={`/app/transactions/${t.id}`} style={{ color: 'inherit' }}>
                          {formatDateTime(t.occurred_at, timezone)}
                        </Link>
                      </td>
                      <td>
                        <Link href={`/app/transactions/${t.id}`}>
                          <strong>{t.merchant ?? 'Tanpa keterangan'}</strong>
                          <small>{t.note ?? t.transaction_type}</small>
                        </Link>
                      </td>
                      <td>{t.category?.name ?? (t.transaction_type === 'transfer' ? 'Transfer' : '—')}</td>
                      <td><small>{accountLabel}</small></td>
                      <td style={{ textAlign: 'right' }}>
                        <span className={amountClass}>{sign} {formatIDRFull(t.amount_idr)}</span>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}

        {totalPages > 1 ? (
          <div className="manual-footer">
            <span style={{ marginRight: 'auto', color: '#718177', fontSize: 10 }}>
              Halaman {page} dari {totalPages}
            </span>
            {page > 1 ? (
              <Link className="page-button ghost" href={`/app/transactions?page=${page - 1}${sp.q ? `&q=${sp.q}` : ''}${sp.type ? `&type=${sp.type}` : ''}${sp.account ? `&account=${sp.account}` : ''}${sp.category ? `&category=${sp.category}` : ''}`}><ArrowLeft className="finance-icon" size={15} weight="regular" aria-hidden="true" /> Sebelumnya</Link>
            ) : null}
            {page < totalPages ? (
              <Link className="page-button primary" href={`/app/transactions?page=${page + 1}${sp.q ? `&q=${sp.q}` : ''}${sp.type ? `&type=${sp.type}` : ''}${sp.account ? `&account=${sp.account}` : ''}${sp.category ? `&category=${sp.category}` : ''}`}>Berikutnya <ArrowRight className="finance-icon" size={15} weight="regular" aria-hidden="true" /></Link>
            ) : null}
          </div>
        ) : null}
      </section>
    </div>
  )
}
