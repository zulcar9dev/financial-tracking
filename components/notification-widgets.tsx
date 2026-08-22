'use client'

import Link from 'next/link'
import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowUpRight, ArrowsClockwise, Bell, ChartDonut, Check } from '@phosphor-icons/react'
import { markAllNotificationsReadAction, markNotificationReadAction, updateNotificationPreferencesAction } from '@/lib/actions/notifications'
import type { NotificationJob } from '@/lib/types'

const SOURCE_LINKS: Record<string, { href: string; label: string }> = {
  recurring_template: { href: '/app/recurring', label: 'Buka template' },
  budget: { href: '/app/budgets', label: 'Buka anggaran' },
}

export function NotificationRow({ job }: { job: NotificationJob }) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const unread = !job.read_at
  const NotificationIcon = job.type.includes('budget') ? ChartDonut : job.type.includes('recurring') ? ArrowsClockwise : Bell
  const sourceLink = job.source_type ? SOURCE_LINKS[job.source_type] : undefined

  return (
    <div className="notification-row" style={{ opacity: unread ? 1 : 0.55 }}>
      <span className={`notification-icon${job.channel === 'email' ? ' warning' : ''}`}>
        <NotificationIcon size={19} weight="duotone" aria-hidden="true" />
      </span>
      <div>
        <strong>{job.title}</strong>
        <small>{job.body}</small>
        {sourceLink ? (
          <Link href={sourceLink.href} className="text-button" style={{ display: 'inline-flex', marginTop: 4 }}>
            {sourceLink.label} <ArrowUpRight size={12} weight="regular" aria-hidden="true" />
          </Link>
        ) : null}
      </div>
      {unread ? (
        <button type="button" className="page-button small" disabled={pending}
          onClick={() => startTransition(async () => { await markNotificationReadAction({ id: job.id }); router.refresh() })}>
          Tandai dibaca
        </button>
      ) : (
        <span className="notification-time">{job.channel === 'email' ? 'email' : 'in-app'}</span>
      )}
    </div>
  )
}

export function MarkAllReadButton() {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  return (
      <button type="button" className="page-button ghost small" disabled={pending}
        onClick={() => startTransition(async () => { await markAllNotificationsReadAction(); router.refresh() })}>
      <Check className="finance-icon" size={15} weight="regular" aria-hidden="true" /> Tandai semua dibaca
    </button>
  )
}

export function PreferencesForm({
  defaults,
}: {
  defaults: {
    in_app_enabled: boolean
    email_enabled: boolean
    recurring_reminder_enabled: boolean
    budget_threshold_enabled: boolean
    default_reminder_offset_minutes: number
  }
}) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const fd = new FormData(e.currentTarget)
    startTransition(async () => {
      const result = await updateNotificationPreferencesAction(fd)
      if (result.error) setError(result.error)
      else router.refresh()
    })
  }

  return (
    <form onSubmit={onSubmit}>
      {error ? <p className="form-error" role="alert">{error}</p> : null}
      <div className="preference-list">
        <label className="preference-row">
          <span><strong>Notifikasi in-app</strong><small>Notifikasi di dalam aplikasi (halaman Notifikasi).</small></span>
          <input type="checkbox" name="in_app_enabled" className="toggle" style={{ accentColor: 'var(--page-acid)' }} defaultChecked={defaults.in_app_enabled} />
        </label>
        <label className="preference-row">
          <span><strong>Notifikasi email</strong><small>Pengingat melalui email. Membutuhkan SMTP aktif di backend.</small></span>
          <input type="checkbox" name="email_enabled" className="toggle" style={{ accentColor: 'var(--page-acid)' }} defaultChecked={defaults.email_enabled} />
        </label>
        <label className="preference-row">
          <span><strong>Pengingat berulang</strong><small>Tampilkan peringatan sebelum transaksi berulang jatuh tempo.</small></span>
          <input type="checkbox" name="recurring_reminder_enabled" className="toggle" style={{ accentColor: 'var(--page-acid)' }} defaultChecked={defaults.recurring_reminder_enabled} />
        </label>
        <label className="preference-row">
          <span><strong>Ambang anggaran</strong><small>Notifikasi saat anggaran mencapai 80%, 100%, atau melebihi batas.</small></span>
          <input type="checkbox" name="budget_threshold_enabled" className="toggle" style={{ accentColor: 'var(--page-acid)' }} defaultChecked={defaults.budget_threshold_enabled} />
        </label>
        <div className="preference-row">
          <span><strong>Pengingat default (menit sebelum jatuh tempo)</strong><small>Default 1440 menit = 1 hari sebelumnya.</small></span>
          <input className="input" type="number" min="0" step="60" name="default_reminder_offset_minutes"
            style={{ width: 110 }} defaultValue={defaults.default_reminder_offset_minutes} />
        </div>
      </div>
      <div className="manual-footer">
        <button type="submit" className="page-button primary" disabled={pending}>{pending ? 'Menyimpan…' : 'Simpan preferensi'}</button>
      </div>
    </form>
  )
}
