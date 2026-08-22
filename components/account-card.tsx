'use client'

import { useState } from 'react'
import { CheckCircle, PencilSimple } from '@phosphor-icons/react'
import { AccountForm, AccountActions } from '@/components/account-form'
import { formatIDRFull } from '@/lib/format'
import { ACCOUNT_TYPE_ICONS } from '@/lib/finance-icons'
import type { AccountWithBalance } from '@/lib/types'

export function AccountCard({ account, featured = false }: { account: AccountWithBalance; featured?: boolean }) {
  const [editing, setEditing] = useState(false)

  if (editing) {
    return (
      <div className="surface-card" style={{ marginTop: 11 }}>
        <div className="surface-header">
          <div>
            <span className="surface-kicker">Edit akun</span>
            <h2>{account.name}</h2>
            <p>Ubah nama, tipe, warna, atau status aktif akun.</p>
          </div>
          <span className="status-pill">{account.account_type.replace('_', ' ').toUpperCase()}</span>
        </div>
        <div style={{ marginTop: 16 }}>
          <AccountForm account={account} onDone={() => setEditing(false)} />
        </div>
      </div>
    )
  }

  const AccountIcon = ACCOUNT_TYPE_ICONS[account.account_type]

  return (
    <article className={`account-page-card${featured ? ' featured' : ''}`}>
      <div className="account-top">
        <span className="account-logo"><AccountIcon size={21} weight="duotone" aria-hidden="true" /></span>
        <span className="account-type">{account.account_type.replace('_', ' ').toUpperCase()}</span>
      </div>
      <div className="account-name">{account.name}</div>
      <div className="account-balance">{formatIDRFull(account.balance_idr)}</div>
      <div className="account-foot">
        <span>Saldo awal {formatIDRFull(account.opening_balance_idr)}</span>
        <span><CheckCircle size={13} weight="regular" aria-hidden="true" /> Aktif</span>
      </div>
      <div className="account-card-actions">
        <button type="button" className="page-button small" onClick={() => setEditing(true)}>
          <PencilSimple size={13} weight="regular" aria-hidden="true" /> Edit
        </button>
        <AccountActions account={account} />
      </div>
    </article>
  )
}