'use client'

import { useRef, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import AppSelect from '@/components/app-select'
import { ACCOUNT_TYPE_ICONS } from '@/lib/finance-icons'
import { createAccountAction, updateAccountAction, archiveAccountAction, deleteAccountAction } from '@/lib/actions/accounts'
import { formatIDRFull } from '@/lib/format'
import type { Account } from '@/lib/types'

const TYPES = [
  { value: 'bank', label: 'Rekening bank' },
  { value: 'cash', label: 'Tunai' },
  { value: 'e_wallet', label: 'Dompet digital' },
  { value: 'credit_card', label: 'Kartu kredit' },
]

const COLORS = ['#c9f46c', '#8b5cf6', '#e9a23b', '#f0593a', '#5b8def', '#2fbf9f']

export function AccountForm({ account, onDone }: { account?: Account; onDone?: () => void }) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const formRef = useRef<HTMLFormElement>(null)

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)
    const formData = new FormData(e.currentTarget)
    startTransition(async () => {
      const result = account ? await updateAccountAction(formData) : await createAccountAction(formData)
      if (result.error) {
        setError(result.error)
        return
      }
      formRef.current?.reset()
      onDone?.()
      router.refresh()
    })
  }

  return (
    <form ref={formRef} onSubmit={onSubmit} className="manual-grid">
      <input type="hidden" name="id" value={account?.id ?? ''} />
      {error ? <p className="form-error full" role="alert">{error}</p> : null}

      <div className="field">
        <label htmlFor="account-name">Nama akun</label>
        <input className="input" id="account-name" name="name" type="text" required
          defaultValue={account?.name ?? ''} placeholder="Contoh: Kartu Kredit BCA" />
      </div>

      <div className="field">
        <label htmlFor="account-type">Tipe akun</label>
        <AppSelect
          id="account-type"
          name="account_type"
          defaultValue={account?.account_type ?? 'bank'}
          aria-label="Tipe akun"
          options={TYPES.map((t) => {
            const TypeIcon = ACCOUNT_TYPE_ICONS[t.value as keyof typeof ACCOUNT_TYPE_ICONS]
            return { value: t.value, label: t.label, icon: <TypeIcon size={14} weight="regular" aria-hidden="true" /> }
          })}
        />
      </div>

      {!account ? (
        <div className="field">
          <label htmlFor="opening-balance">Saldo awal</label>
          <input className="input" id="opening-balance" name="opening_balance_idr" type="number" min="0" step="1000" placeholder="Rp0" />
        </div>
      ) : (
        <div className="field">
          <label>Warna</label>
          <div className="color-picker" style={{ display: 'flex', gap: 7, flexWrap: 'wrap', alignItems: 'center', minHeight: 42 }}>
            {COLORS.map((c) => (
              <label key={c} style={{ display: 'grid', placeItems: 'center' }}>
                <input type="radio" name="color" value={c} defaultChecked={account.color === c || (!account.color && c === '#c9f46c')} style={{ position: 'absolute', opacity: 0 }} />
                <span style={{ width: 24, height: 24, borderRadius: 7, display: 'inline-block', background: c, border: account.color === c ? '2px solid #fff' : '2px solid transparent', cursor: 'pointer' }} />
              </label>
            ))}
          </div>
        </div>
      )}

      <div className="field">
        <label htmlFor="opening-date">Tanggal saldo awal</label>
        <input className="input" id="opening-date" name="opening_balance_at" type="date"
          defaultValue={account?.opening_balance_at ? new Date(account.opening_balance_at).toISOString().slice(0, 10) : new Date().toISOString().slice(0, 10)} />
      </div>

      {account ? (
        <div className="field full check-row" style={{ marginTop: 12 }}>
          <input id="is_active" name="is_active" type="checkbox" defaultChecked={account.is_active} />
          <label htmlFor="is_active" style={{ fontWeight: 400 }}>Akun aktif (tampil di dashboard dan pemilihan akun)</label>
        </div>
      ) : null}

      <div className="manual-footer" style={{ gridColumn: '1 / -1' }}>
        {account ? (
          <>
            <span className="field-note" style={{ marginRight: 'auto', color: '#718177', fontSize: 10 }}>Saldo awal: {formatIDRFull(account.opening_balance_idr)}</span>
            <button type="button" className="page-button ghost" onClick={onDone}>Batal</button>
          </>
        ) : (
          <button type="button" className="page-button ghost" onClick={onDone}>Batal</button>
        )}
        <button type="submit" className="page-button primary" disabled={pending}>
          {pending ? 'Menyimpan…' : account ? 'Simpan perubahan' : 'Simpan akun'}
        </button>
      </div>
    </form>
  )
}

export function AccountActions({ account }: { account: Account }) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  function run(action: (f: FormData) => Promise<{ error: string | null }>, extra?: FormData) {
    setError(null)
    const f = new FormData()
    f.set('id', account.id)
    extra?.forEach((v, k) => f.set(k, v))
    startTransition(async () => {
      const result = await action(f)
      if (result.error) setError(result.error)
      else router.refresh()
    })
  }

  return (
    <div className="account-menu" onClick={(e) => e.stopPropagation()}>
      {error ? <p className="form-error" role="alert">{error}</p> : null}
      <div style={{ display: 'flex', gap: 7, flexWrap: 'wrap' }}>
        <button className="page-button small" disabled={pending} onClick={() => run(archiveAccountAction)}>Arsipkan</button>
        <button className="page-button small danger" disabled={pending} onClick={() => {
          if (window.confirm(`Hapus akun "${account.name}"? Transaksi terkait ikut terhapus.`)) run(deleteAccountAction)
        }}>Hapus</button>
      </div>
    </div>
  )
}