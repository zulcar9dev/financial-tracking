import Link from 'next/link'
import { ArrowsClockwise, CalendarBlank } from '@phosphor-icons/react/ssr'
import TemplateForm, { TemplateActions } from '@/components/template-form'
import { getCurrentUser } from '@/lib/insforge/server'
import { getAccounts, getCategories, getProfile, getRecurringTemplates, getUpcomingRecurring } from '@/lib/db'
import { formatDateTime, formatIDRFull } from '@/lib/format'

export const dynamic = 'force-dynamic'

export default async function RecurringPage() {
  const user = await getCurrentUser()
  const [profile, accounts, categories, templates, upcoming] = await Promise.all([
    getProfile(user!.id),
    getAccounts(user!.id),
    getCategories(user!.id),
    getRecurringTemplates(user!.id),
    getUpcomingRecurring(user!.id, 3),
  ])
  const timezone = profile?.timezone ?? 'Asia/Jakarta'
  const next = upcoming[0]

  return (
    <div className="page-stack">
      <section className="page-heading">
        <div>
          <span className="page-kicker">Recurring / {templates.filter((t) => t.is_active).length} aktif</span>
          <h1>Transaksi berulang.</h1>
          <p>Template untuk pemasukan dan pengeluaran berkala; muncul sebagai pengingat.</p>
        </div>
      </section>

      <div className="recurring-layout">
        <section className="surface-card">
          <div className="surface-header">
            <div><span className="surface-kicker">Templates</span><h2>Semua template</h2><p>Jadwal berikutnya dihitung otomatis dari frekuensi dan tanggal mulai.</p></div>
            <span className="status-pill">{templates.length} template</span>
          </div>

          {templates.length === 0 ? (
            <div className="empty-state">
              <div>
                <ArrowsClockwise className="empty-mark" size={38} weight="duotone" aria-hidden="true" />
                <h2>Belum ada template</h2>
                <p>Buat template untuk gaji, sewa, tagihan bulanan, atau transfer rutin.</p>
              </div>
            </div>
          ) : (
            <div className="recurring-list">
              {templates.map((t) => {
                const from = t.transaction_type === 'transfer'
                  ? `${accounts.find((a) => a.id === t.transfer_from_id)?.name ?? '—'} ke ${accounts.find((a) => a.id === t.transfer_to_id)?.name ?? '—'}`
                  : accounts.find((a) => a.id === t.account_id)?.name ?? '—'
                return (
                  <div key={t.id} className="recurring-row" style={{ opacity: t.is_active ? 1 : 0.5 }}>
                    <span className="recurring-symbol"><ArrowsClockwise size={19} weight="duotone" aria-hidden="true" /></span>
                    <div>
                      <strong>{t.name}</strong>
                      <small>
                        {t.frequency}{t.interval_value > 1 ? ` · setiap ${t.interval_value}` : ''} · {from}
                        {t.end_date ? ` · s.d. ${t.end_date}` : ''} · berikutnya {formatDateTime(t.next_occurrence_at, timezone)}
                        {!t.is_active ? ' · dijeda' : ''}
                      </small>
                    </div>
                    <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                      <strong className="recurring-amount">{formatIDRFull(t.amount_idr)}</strong>
                      <TemplateActions template={t} />
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </section>

        <div style={{ display: 'grid', gap: 11, alignContent: 'start' }}>
          {next ? (
            <section className="upcoming-card">
              <span className="upcoming-date"><CalendarBlank size={15} weight="regular" aria-hidden="true" /> {formatDateTime(next.next_occurrence_at, timezone)}</span>
              <h2>{next.name}</h2>
              <p>Transaksi berulang berikutnya. Konfirmasi dengan menekan tombol jika sudah terjadi.</p>
              <div className="upcoming-amount">{formatIDRFull(next.amount_idr)}</div>
              <Link className="page-button primary" href={`/app/recurring#new-template`}><ArrowsClockwise className="finance-icon" size={16} weight="regular" aria-hidden="true" /> Kelola template</Link>
            </section>
          ) : (
            <section className="upcoming-card">
              <span className="upcoming-date"><CalendarBlank size={15} weight="regular" aria-hidden="true" /> Tidak ada jadwal</span>
              <h2>Buat template</h2>
              <p>Jadwalkan transaksi yang terjadi berulang agar pengingat muncul otomatis.</p>
            </section>
          )}
          <TemplateForm accounts={accounts} categories={categories} />
        </div>
      </div>
    </div>
  )
}
