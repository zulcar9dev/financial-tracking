import { MarkAllReadButton, NotificationRow, PreferencesForm } from '@/components/notification-widgets'
import { getCurrentUser } from '@/lib/insforge/server'
import { getNotificationJobs, getNotificationPreferences } from '@/lib/db'

export const dynamic = 'force-dynamic'

export default async function NotificationsPage() {
  const user = await getCurrentUser()
  const [jobs, prefs] = await Promise.all([
    getNotificationJobs(user!.id, 50),
    getNotificationPreferences(user!.id),
  ])

  const unread = jobs.filter((j) => !j.read_at).length

  return (
    <div className="page-stack">
      <section className="page-heading">
        <div>
          <span className="page-kicker">Inbox / {unread} belum dibaca</span>
          <h1>Notifikasi.</h1>
          <p>Pengingat berulang dan peringatan ambang anggaran.</p>
        </div>
        <div className="heading-actions">
          {unread > 0 ? <MarkAllReadButton /> : null}
        </div>
      </section>

      <div className="notification-layout">
        <section className="surface-card">
          <div className="surface-header">
            <div><span className="surface-kicker">Inbox</span><h2>Semua notifikasi</h2><p>Notifikasi dibuat oleh scheduler backend; dibaca tersimpan per pengguna.</p></div>
            <span className="status-pill">{jobs.length} total</span>
          </div>

          {jobs.length === 0 ? (
            <div className="empty-state">
              <div>
                <span className="empty-mark">◌</span>
                <h2>Belum ada notifikasi</h2>
                <p>Pengingat berulang dan peringatan anggaran akan muncul di sini.</p>
              </div>
            </div>
          ) : (
            <div className="notification-list">
              {jobs.map((job) => (
                <NotificationRow key={job.id} job={job} />
              ))}
            </div>
          )}
        </section>

        <section className="surface-card">
          <div className="surface-header">
            <div><span className="surface-kicker">Preferences</span><h2>Preferensi notifikasi</h2><p>Kontrol saluran dan jenis notifikasi.</p></div>
            <span className="status-pill">In-app dulu</span>
          </div>
          <PreferencesForm
            defaults={{
              in_app_enabled: prefs?.in_app_enabled ?? true,
              email_enabled: prefs?.email_enabled ?? false,
              recurring_reminder_enabled: prefs?.recurring_reminder_enabled ?? true,
              budget_threshold_enabled: prefs?.budget_threshold_enabled ?? true,
              default_reminder_offset_minutes: prefs?.default_reminder_offset_minutes ?? 1440,
            }}
          />
          <div className="privacy-callout">
            <span>i</span>
            <p><b>Catatan rilis:</b> scheduler backend (edge function <code>schedule-recurring-reminders</code>, tiap 6 jam) membuat pengingat berulang &amp; peringatan ambang anggaran secara otomatis.</p>
          </div>
        </section>
      </div>
    </div>
  )
}