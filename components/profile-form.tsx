'use client'

import { useRef, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { updateProfileAction } from '@/lib/actions/settings'
import type { Profile } from '@/lib/types'

const TIMEZONES = [
  'Asia/Jakarta',
  'Asia/Makassar',
  'Asia/Jayapura',
]

const LOCALES = [
  { value: 'id-ID', label: 'Indonesia (id-ID)' },
]

export default function ProfileForm({ profile, redirectTo }: { profile: Profile | null; redirectTo?: string }) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const formRef = useRef<HTMLFormElement>(null)

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)
    const formData = new FormData(e.currentTarget)
    startTransition(async () => {
      const result = await updateProfileAction(formData)
      if (result.error) {
        setError(result.error)
        return
      }
      if (redirectTo) {
        router.push(redirectTo)
        router.refresh()
      } else {
        router.refresh()
      }
    })
  }

  return (
    <form ref={formRef} onSubmit={onSubmit} className="form-stack">
      <input type="hidden" name="user_id" value={profile?.id ?? ''} />

      {error ? <p className="form-error" role="alert">{error}</p> : null}

      <div className="field">
        <label htmlFor="display_name">Nama tampilan</label>
        <input
          id="display_name"
          name="display_name"
          type="text"
          className="input"
          required
          autoComplete="name"
          defaultValue={profile?.display_name ?? ''}
          placeholder="Mis. Alya Rahma"
          aria-describedby="display-name-help"
        />
        <small id="display-name-help">Nama yang ditampilkan di aplikasi.</small>
      </div>

      <div className="field">
        <label htmlFor="timezone">Zona waktu</label>
        <select className="select" id="timezone" name="timezone" defaultValue={profile?.timezone ?? 'Asia/Jakarta'} aria-describedby="timezone-help">
          {TIMEZONES.map((tz) => (
            <option key={tz} value={tz}>{tz}</option>
          ))}
        </select>
        <small id="timezone-help">Digunakan untuk menghitung periode harian, bulanan, dan pengingat.</small>
      </div>

      <div className="field">
        <label htmlFor="locale">Format angka & tanggal</label>
        <select className="select" id="locale" name="locale" defaultValue={profile?.locale ?? 'id-ID'}>
          {LOCALES.map((l) => (
            <option key={l.value} value={l.value}>{l.label}</option>
          ))}
        </select>
      </div>

      <div className="settings-footer">
        <button type="submit" className="button button-primary" disabled={pending}>
          {pending ? 'Menyimpan…' : 'Simpan perubahan'}
        </button>
      </div>
    </form>
  )
}
