'use client'

import { useState } from 'react'
import { PencilSimple } from '@phosphor-icons/react'
import { CategoryActions, CategoryForm } from '@/components/category-form'
import type { Category } from '@/lib/types'

export function CategoryCard({ category, archived = false }: { category: Category; archived?: boolean }) {
  const [editing, setEditing] = useState(false)

  if (editing) {
    return (
      <div className="surface-card" style={{ marginTop: 11 }}>
        <div className="surface-header">
          <div>
            <span className="surface-kicker">Edit kategori</span>
            <h2>{category.name}</h2>
            <p>Ubah nama, jenis, atau warna kategori.</p>
          </div>
          <span className="status-pill">{category.category_kind}</span>
        </div>
        <div style={{ marginTop: 16 }}>
          <CategoryForm category={category} onDone={() => setEditing(false)} />
        </div>
      </div>
    )
  }

  const dotClass = [
    'category-dot',
    category.category_kind === 'income' ? ' income' : '',
    category.name === 'Transportasi' ? ' utility' : '',
    category.name === 'Kesehatan' ? ' health' : '',
  ].join('')

  return (
    <div key={category.id} className={`category-card${archived ? ' archived' : ''}`}>
      <span className={dotClass} style={category.color ? { background: category.color } : undefined}></span>
      <div>
        <strong>{category.name}</strong>
        <small>{category.category_kind}{category.is_system ? ' · system' : ''}</small>
      </div>
      <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
        {!category.is_system ? (
          <button type="button" className="page-button small" onClick={() => setEditing(true)}>
            <PencilSimple size={13} weight="regular" aria-hidden="true" /> Edit
          </button>
        ) : null}
        <CategoryActions category={category} archived={archived} />
      </div>
    </div>
  )
}