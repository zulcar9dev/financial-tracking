import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, PencilSimple } from '@phosphor-icons/react/ssr'
import { getCurrentUser } from '@/lib/insforge/server'
import { getProfile, getTransaction } from '@/lib/db'
import { formatDateTime, formatIDRFull } from '@/lib/format'
import { TRANSACTION_TYPE_ICONS } from '@/lib/finance-icons'

export const dynamic = 'force-dynamic'

export default async function TransactionDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const user = await getCurrentUser()
  const [profile, transaction] = await Promise.all([
    getProfile(user!.id),
    getTransaction(user!.id, id),
  ])

  if (!transaction) notFound()
  const timezone = profile?.timezone ?? 'Asia/Jakarta'

  const legs = transaction.legs ?? []
  const accountLabel = transaction.transaction_type === 'transfer'
    ? `${legs.find((l) => l.direction === 'out')?.account?.name ?? '—'} ke ${legs.find((l) => l.direction === 'in')?.account?.name ?? '—'}`
    : legs.map((l) => l.account?.name).join(', ') || '—'

  const typeLabel = transaction.transaction_type === 'income'
    ? 'Pendapatan'
    : transaction.transaction_type === 'transfer'
      ? 'Transfer'
      : 'Pengeluaran'

  return (
    <div className="page-stack">
      <section className="page-heading">
        <div>
          <span className="page-kicker">Transaction / detail</span>
          <h1>Detail transaksi.</h1>
          <p>Informasi lengkap dan riwayat satu transaksi.</p>
        </div>
        <div className="heading-actions">
          <Link className="page-button ghost" href="/app/transactions"><ArrowLeft className="finance-icon" size={15} weight="regular" aria-hidden="true" /> Kembali</Link>
        </div>
      </section>

      <div className="detail-layout">
        <section className="surface-card">
          <div className="detail-hero">
            <span className={`detail-symbol${transaction.transaction_type === 'income' ? '' : ''}`}
              style={transaction.transaction_type === 'income' ? { color: '#c9f46c', background: 'rgba(201, 244, 108, .1)' } : {}}>
              {(() => { const TransactionIcon = TRANSACTION_TYPE_ICONS[transaction.transaction_type]; return <TransactionIcon size={24} weight="duotone" aria-hidden="true" /> })()}
            </span>
            <div>
              <h2>{transaction.merchant ?? 'Tanpa keterangan'}</h2>
              <p>{formatDateTime(transaction.occurred_at, timezone)}</p>
            </div>
            <strong className="detail-amount" style={transaction.transaction_type === 'income' ? { color: '#c9f46c' } : {}}>
              {transaction.transaction_type === 'income' ? '+' : transaction.transaction_type === 'expense' ? '−' : '⇄'} {formatIDRFull(transaction.amount_idr)}
            </strong>
          </div>

          <div className="detail-fields">
            <div><small className="surface-kicker">Tipe</small><p className="detail-value">{typeLabel}</p></div>
            <div><small className="surface-kicker">Akun</small><p className="detail-value">{accountLabel}</p></div>
            <div><small className="surface-kicker">Kategori</small><p className="detail-value">{transaction.category?.name ?? '—'}</p></div>
              <div><small className="surface-kicker">Sumber</small><p className="detail-value">
              {transaction.source === 'recurring' ? 'Berulang' : transaction.source === 'chat' ? 'Chat' : transaction.source === 'receipt' ? 'Struk' : 'Manual'}
            </p></div>
            <div><small className="surface-kicker">Status</small><p className="detail-value">{transaction.status}</p></div>
            <div><small className="surface-kicker">ID Empuk (idempotency)</small><p className="detail-value" style={{ font: '400 9px var(--page-mono)' }}>{transaction.idempotency_key ?? '—'}</p></div>
            {transaction.note ? (
              <div className="full" style={{ gridColumn: '1 / -1' }}><small className="surface-kicker">Catatan</small><p className="detail-value">{transaction.note}</p></div>
            ) : null}
          </div>

          {transaction.items && transaction.items.length > 0 ? (
            <div className="detail-side-list">
              {transaction.items.map((item) => (
                <div key={item.id} className="detail-side-row">
                  <span>{item.name} ×{item.quantity}</span>
                  <strong>{formatIDRFull((item.total_amount_idr ?? item.unit_amount_idr) ?? 0)}</strong>
                </div>
              ))}
            </div>
          ) : null}
        </section>

        <div className="detail-layout-aside" style={{ display: 'grid', gap: 11, alignContent: 'start' }}>
          <section className="surface-card">
            <div className="surface-header">
              <div><span className="surface-kicker">Sisi pencatatan</span><h3>Leg transaksi</h3><p>Perubahan saldo per akun.</p></div>
            </div>
            <div className="detail-side-list">
              {legs.map((leg) => (
                <div key={leg.id} className="detail-side-row">
                  <span>{leg.account?.name ?? '—'} · {leg.direction === 'in' ? 'masuk' : 'keluar'}</span>
                  <strong className={leg.direction === 'in' ? 'income' : 'money'} style={{ color: leg.direction === 'in' ? 'var(--page-acid)' : 'var(--page-coral)' }}>
                    {leg.direction === 'in' ? '+' : '−'} {formatIDRFull(leg.amount_idr)}
                  </strong>
                </div>
              ))}
            </div>
          </section>

          <Link className="page-button primary" href={`/app/transactions/${transaction.id}/edit`}>
            <PencilSimple className="finance-icon" size={16} weight="regular" aria-hidden="true" /> Edit transaksi
          </Link>
        </div>
      </div>
    </div>
  )
}
