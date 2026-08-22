import Link from 'next/link'
import { Bell, Database, LockKey, ShieldCheck, Tag, UserCircle } from '@phosphor-icons/react/ssr'
import ProfileForm from '@/components/profile-form'
import { getCurrentUser } from '@/lib/insforge/server'
import { getNotificationPreferences, getProfile } from '@/lib/db'
import { initialsOf } from '@/lib/format'

export const dynamic = 'force-dynamic'

export default async function SettingsProfilePage() {
  const user = await getCurrentUser()
  const [profile, prefs] = await Promise.all([
    getProfile(user!.id),
    getNotificationPreferences(user!.id),
  ])

  const displayName = profile?.display_name ?? 'Pengguna'

  return (
    <div className="page-stack">
      <section className="page-heading">
        <div>
          <span className="page-kicker">Settings / profil</span>
          <h1>Pengaturan.</h1>
          <p>Profil, preferensi zona waktu, dan saluran notifikasi.</p>
        </div>
      </section>

      <div className="settings-layout">
        <nav className="settings-menu surface-card" aria-label="Menu pengaturan">
          <Link className="active" href="/app/settings/profile"><UserCircle size={16} weight="regular" aria-hidden="true" /> Profil</Link>
          <Link href="/app/notifications"><Bell size={16} weight="regular" aria-hidden="true" /> Notifikasi</Link>
          <Link href="/app/categories"><Tag size={16} weight="regular" aria-hidden="true" /> Kategori</Link>
          <Link href="/app/settings/data"><Database size={16} weight="regular" aria-hidden="true" /> Data &amp; privasi</Link>
          <Link href="/privacy"><ShieldCheck size={16} weight="regular" aria-hidden="true" /> Kebijakan privasi</Link>
        </nav>

        <div className="settings-content">
          <section className="surface-card settings-section">
            <div className="profile-banner">
              <span className="large-avatar">{initialsOf(displayName)}</span>
              <div>
                <h2>{displayName}</h2>
                <p>{user!.email}</p>
              </div>
            </div>
            <div className="profile-form-wrap">
              <ProfileForm profile={profile} />
            </div>
          </section>

          <section className="surface-card settings-section">
            <div className="surface-header">
              <div><span className="surface-kicker">Notification defaults</span><h2>Ringkasan preferensi</h2></div>
              <span className="status-pill">{prefs?.in_app_enabled ? 'In-app aktif' : 'In-app nonaktif'}</span>
            </div>
            <div className="detail-side-list">
              <div className="detail-side-row"><span>Pengingat berulang</span><strong>{prefs?.recurring_reminder_enabled ? 'Aktif' : 'Nonaktif'}</strong></div>
              <div className="detail-side-row"><span>Ambang anggaran</span><strong>{prefs?.budget_threshold_enabled ? 'Aktif' : 'Nonaktif'}</strong></div>
              <div className="detail-side-row"><span>Pengingat default</span><strong>{Math.round((prefs?.default_reminder_offset_minutes ?? 1440) / 1440)} hari sebelum jatuh tempo</strong></div>
            </div>
            <Link className="page-button ghost" href="/app/notifications">Kelola notifikasi</Link>
          </section>

          <section className="surface-card settings-section">
            <div className="surface-header">
              <div><span className="surface-kicker">Keamanan</span><h2>Session dan password</h2><p>Refresh session dikelola secara aman oleh sistem authentication.</p></div>
              <Link className="page-button ghost" href="/forgot-password"><LockKey size={15} weight="regular" aria-hidden="true" /> Reset password</Link>
            </div>
          </section>
        </div>
      </div>
    </div>
  )
}
