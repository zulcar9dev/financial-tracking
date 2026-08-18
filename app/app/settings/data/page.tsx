import Link from 'next/link'
import { Database, UserCircle } from '@phosphor-icons/react/ssr'
import { DangerZone, ExportButtons } from '@/components/data-settings'
import { getCurrentUser } from '@/lib/insforge/server'
import { getProfile } from '@/lib/db'
import { formatDate } from '@/lib/format'

export const dynamic = 'force-dynamic'

export default async function SettingsDataPage() {
  const user = await getCurrentUser()
  const profile = await getProfile(user!.id)
  const timezone = profile?.timezone ?? 'Asia/Jakarta'

  return (
    <div className="page-stack">
      <section className="page-heading">
        <div>
          <span className="page-kicker">Settings / data &amp; privasi</span>
          <h1>Data &amp; privasi.</h1>
          <p>Ekspor data kapan saja, atau hapus akun beserta seluruh data.</p>
        </div>
      </section>

      <div className="settings-layout">
        <nav className="settings-menu surface-card">
          <Link href="/app/settings/profile"><UserCircle size={16} weight="regular" aria-hidden="true" /> Profil</Link>
          <Link className="active" href="/app/settings/data"><Database size={16} weight="regular" aria-hidden="true" /> Data &amp; privasi</Link>
        </nav>

        <div className="settings-content">
          <section className="settings-section">
            <ExportButtons />
          </section>

          <section className="surface-card settings-section">
            <div className="surface-header">
              <div><span className="surface-kicker">Keanggotaan</span><h2>Akun Anda</h2></div>
              <span className="status-pill">Personal</span>
            </div>
            <div className="detail-side-list">
              <div className="detail-side-row"><span>Email</span><strong>{user!.email}</strong></div>
              <div className="detail-side-row"><span>Terdaftar</span><strong>{formatDate(user!.createdAt, timezone)}</strong></div>
              <div className="detail-side-row"><span>Email terverifikasi</span><strong>{user!.emailVerified ? 'Ya' : 'Belum'}</strong></div>
            </div>
          </section>

          <section className="surface-card settings-section danger-zone">
            <div className="surface-header">
              <div><span className="surface-kicker">Zona berbahaya</span><h2>Hapus akun</h2><p>Menghapus seluruh data: akun, kategori, transaksi, legs, anggaran, template berulang, notifikasi, dan percakapan AI. Tidak dapat dipulihkan.</p></div>
              <span className="status-pill danger">Permanen</span>
            </div>
            <DangerZone />
          </section>
        </div>
      </div>
    </div>
  )
}
