'use client'

import { useState } from 'react'
import { ArrowsClockwise } from '@phosphor-icons/react'
import TemplateForm, { TemplateActions } from '@/components/template-form'
import { formatDateTime, formatIDRFull } from '@/lib/format'
import type { Account, Category, RecurringTemplate } from '@/lib/types'

export function TemplateItem({
  template,
  accounts,
  categories,
  timezone,
}: {
  template: RecurringTemplate
  accounts: Account[]
  categories: Category[]
  timezone: string
}) {
  const [editing, setEditing] = useState(false)

  if (editing) {
    return (
      <div className="surface-card" style={{ marginTop: 11 }}>
        <div className="surface-header">
          <div>
            <span className="surface-kicker">Edit template</span>
            <h2>{template.name}</h2>
            <p>Ubah jadwal, nominal, akun, atau pengingat transaksi berulang.</p>
          </div>
          <span className="status-pill">{template.frequency}</span>
        </div>
        <div style={{ marginTop: 16 }}>
          <TemplateForm accounts={accounts} categories={categories} template={template} onDone={() => setEditing(false)} />
        </div>
      </div>
    )
  }

  const from = template.transaction_type === 'transfer'
    ? `${accounts.find((a) => a.id === template.transfer_from_id)?.name ?? '—'} ke ${accounts.find((a) => a.id === template.transfer_to_id)?.name ?? '—'}`
    : accounts.find((a) => a.id === template.account_id)?.name ?? '—'

  return (
    <div className="recurring-row" style={{ opacity: template.is_active ? 1 : 0.5 }}>
      <span className="recurring-symbol"><ArrowsClockwise size={19} weight="duotone" aria-hidden="true" /></span>
      <div>
        <strong>{template.name}</strong>
        <small>
          {template.frequency}{template.interval_value > 1 ? ` · setiap ${template.interval_value}` : ''} · {from}
          {template.end_date ? ` · s.d. ${template.end_date}` : ''} · berikutnya {formatDateTime(template.next_occurrence_at, timezone)}
          {!template.is_active ? ' · dijeda' : ''}
        </small>
      </div>
      <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
        <strong className="recurring-amount">{formatIDRFull(template.amount_idr)}</strong>
        <TemplateActions template={template} onEdit={() => setEditing(true)} />
      </div>
    </div>
  )
}