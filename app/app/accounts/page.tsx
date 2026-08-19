import Link from 'next/link'
import { Archive, ArrowLeft, PlusCircle } from '@phosphor-icons/react/ssr'
import { AccountCard } from '@/components/account-card'
import { AccountForm } from '@/components/account-form'
import { getCurrentUser } from '@/lib/insforge/server'
import { getAccountsWithBalances, getProfile } from '@/lib/db'
import { formatDate, formatIDRFull } from '@/lib/format'

export const dynamic = 'force-dynamic'

export default async function AccountsPage() {
  const user = await getCurrentUser()
  const profile = await getProfile(user!.id)
  const accounts = await getAccountsWithBalances(user!.id)

  const active = accounts.filter((a) => a.is_active)
  const archived = accounts.filter((a) => !a.is_active)

  return (
    <div className="page-stack">
      <section className="page-heading">
        <div>
          <span className="page-kicker">Accounts / {active.length} aktif</span>
          <h1>Akun keuangan.</h1>
          <p>Pisahkan saldo tunai, bank, dompet digital, dan kartu kredit secara manual.</p>
        </div>
        <div className="heading-actions">
          <Link className="page-button ghost" href="/app/dashboard"><ArrowLeft className="finance-icon" size={15} weight="regular" aria-hidden="true" /> Dashboard</Link>
        </div>
      </section>

      <section className="account-grid">
        {active.map((account, i) => (
          <AccountCard key={account.id} account={account} featured={i === 0} />
        ))}
        <a className="add-account" href="#new-account">
          <div><PlusCircle size={22} weight="duotone" aria-hidden="true" /><strong>Tambah akun baru</strong><small>Bank, tunai, dompet digital, atau kartu kredit</small></div>
        </a>
      </section>

      {archived.length > 0 ? (
        <section className="surface-card" style={{ marginTop: 11 }}>
          <div className="surface-header">
            <div><span className="surface-kicker">Diarsipkan</span><h2>Akun nonaktif</h2><p>Akun yang diarsipkan tidak ikut dihitung di dashboard.</p></div>
            <span className="status-pill warning">{archived.length} akun</span>
          </div>
          <div className="recurring-list">
            {archived.map((account) => (
              <div key={account.id} className="recurring-row">
                <span className="recurring-symbol"><Archive size={19} weight="duotone" aria-hidden="true" /></span>
                <div><strong>{account.name}</strong><small>diarsipkan {formatDate(account.archived_at, profile?.timezone ?? 'Asia/Jakarta')}</small></div>
                <div style={{ display: 'flex', gap: 7, alignItems: 'center' }}>
                  <strong className="recurring-amount">{formatIDRFull(account.balance_idr)}</strong>
                  <form action={async (fd) => {
                    'use server'
                    const { reactivateAccountAction } = await import('@/lib/actions/accounts')
                    await reactivateAccountAction(fd)
                  }}>
                    <input type="hidden" name="id" value={account.id} />
                    <button className="page-button small" type="submit">Aktifkan</button>
                  </form>
                </div>
              </div>
            ))}
          </div>
        </section>
      ) : null}

      <section className="surface-card" id="new-account" style={{ marginTop: 11 }}>
        <div className="surface-header">
          <div>
            <span className="surface-kicker">Manual account setup</span>
            <h2>Buat akun keuangan</h2>
            <p>Saldo berjalan akan dihitung dari saldo awal dan transaksi confirmed.</p>
          </div>
          <span className="status-pill">IDR</span>
        </div>
        <AccountForm />
      </section>
    </div>
  )
}
