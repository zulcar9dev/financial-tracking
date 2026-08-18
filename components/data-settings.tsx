'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { FileText, Table, Trash } from '@phosphor-icons/react'
import { deleteAccountAction, exportCsvAction, exportJsonAction } from '@/lib/actions/data'

function download(fileName: string, content: string, mime: string) {
  const blob = new Blob([content], { type: mime })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = fileName
  document.body.appendChild(a)
  a.click()
  a.remove()
  URL.revokeObjectURL(url)
}

export function ExportButtons() {
  const [pending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  function doExport(kind: 'json' | 'csv') {
    setError(null)
    startTransition(async () => {
      const result = kind === 'json' ? await exportJsonAction() : await exportCsvAction()
      if (result.error || !result.content) {
        setError(result.error ?? 'Gagal mengekspor data.')
        return
      }
      download(result.fileName!, result.content, kind === 'json' ? 'application/json' : 'text/csv')
    })
  }

  return (
    <div className="data-grid">
      <section className="surface-card data-card">
        <span className="data-icon"><FileText size={21} weight="duotone" aria-hidden="true" /></span>
        <h2>Ekspor JSON</h2>
        <p>Seluruh data Anda — akun, kategori, transaksi, legs, anggaran, template, dan preferensi — dalam satu file JSON.</p>
        <button className="page-button primary" disabled={pending} onClick={() => doExport('json')}>
          {pending ? 'Mempersiapkan…' : 'Ekspor JSON'}
        </button>
      </section>
      <section className="surface-card data-card">
        <span className="data-icon"><Table size={21} weight="duotone" aria-hidden="true" /></span>
        <h2>Ekspor CSV</h2>
        <p>Riwayat transaksi (hingga 2.000 terbaru) dalam format CSV untuk spreadsheet.</p>
        <button className="page-button primary" disabled={pending} onClick={() => doExport('csv')}>
          {pending ? 'Mempersiapkan…' : 'Ekspor CSV'}
        </button>
      </section>
      {error ? <p className="form-error" style={{ gridColumn: '1 / -1' }} role="alert">{error}</p> : null}
    </div>
  )
}

export function DangerZone() {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  function onDelete(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const fd = new FormData(e.currentTarget)
    if (!window.confirm('Penghapusan permanen. Semua data Anda akan dihapus dan tidak dapat dipulihkan. Lanjutkan?')) return
    setError(null)
    startTransition(async () => {
      const result = await deleteAccountAction({
        password: String(fd.get('password') ?? ''),
        confirmation: String(fd.get('confirmation') ?? ''),
      })
      if (result.error) {
        setError(result.error)
        return
      }
      router.push('/login?deleted=1')
      router.refresh()
    })
  }

  return (
    <form onSubmit={onDelete}>
      {error ? <p className="form-error" role="alert">{error}</p> : null}
      <div className="danger-confirm">
        <div className="field">
          <label htmlFor="delete-password">Password (verifikasi ulang)</label>
          <input className="input" id="delete-password" name="password" type="password" required autoComplete="current-password" />
        </div>
        <div className="field">
          <label htmlFor="delete-confirm">Ketik <strong>HAPUS DATA SAYA</strong></label>
          <input className="input" id="delete-confirm" name="confirmation" type="text" required autoComplete="off" />
        </div>
      </div>
      <div className="manual-footer">
        <button type="submit" className="page-button danger" disabled={pending}>
           {pending ? 'Menghapus…' : <><Trash className="finance-icon" size={16} weight="regular" aria-hidden="true" /> Hapus akun &amp; seluruh data</>}
        </button>
      </div>
    </form>
  )
}
