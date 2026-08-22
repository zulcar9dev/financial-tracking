'use client'

import { useRef, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import AppSelect from '@/components/app-select'
import { archiveCategoryAction, createCategoryAction, reactivateCategoryAction, updateCategoryAction } from '@/lib/actions/categories'
import type { Category } from '@/lib/types'

const KINDS = [
  { value: 'expense', label: 'Expense' },
  { value: 'income', label: 'Income' },
  { value: 'both', label: 'Both' },
]

const COLORS = [
  { value: 'default', label: 'Default', dot: null },
  { value: '#c9f46c', label: 'Lime', dot: '#c9f46c' },
  { value: '#8b5cf6', label: 'Violet', dot: '#8b5cf6' },
  { value: '#e9a23b', label: 'Amber', dot: '#e9a23b' },
  { value: '#f0593a', label: 'Coral', dot: '#f0593a' },
  { value: '#5b8def', label: 'Blue', dot: '#5b8def' },
]

export function CategoryForm({ category, onDone }: { category?: Category; onDone?: () => void }) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const formRef = useRef<HTMLFormElement>(null)

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)
    const formData = new FormData(e.currentTarget)
    if (formData.get('color') === 'default') formData.set('color', '')
    startTransition(async () => {
      const result = category ? await updateCategoryAction(formData) : await createCategoryAction(formData)
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
      <input type="hidden" name="id" value={category?.id ?? ''} />
      {error ? <p className="form-error full" role="alert">{error}</p> : null}

      <div className="field">
        <label htmlFor="category-name">Nama kategori</label>
        <input className="input" id="category-name" name="name" type="text" required
          defaultValue={category?.name ?? ''} placeholder="Contoh: Hewan peliharaan" />
      </div>

      <div className="field">
        <label htmlFor="category-kind">Jenis</label>
        <AppSelect
          id="category-kind"
          name="category_kind"
          defaultValue={category?.category_kind ?? 'expense'}
          aria-label="Jenis kategori"
          options={KINDS}
        />
      </div>

      <div className="field">
        <label htmlFor="category-color">Warna</label>
        <AppSelect
          id="category-color"
          name="color"
          defaultValue={category?.color || 'default'}
          aria-label="Warna kategori"
          options={COLORS}
        />
      </div>

      <div className="manual-footer" style={{ gridColumn: '1 / -1' }}>
        <button type="button" className="page-button ghost" onClick={onDone}>Batal</button>
        <button type="submit" className="page-button primary" disabled={pending}>
          {pending ? 'Menyimpan…' : category ? 'Simpan perubahan' : 'Simpan kategori'}
        </button>
      </div>
    </form>
  )
}

export function CategoryActions({ category, archived = false }: { category: Category; archived?: boolean }) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()

  function run(action: (f: FormData) => Promise<{ error: string | null }>) {
    const f = new FormData()
    f.set('id', category.id)
    startTransition(async () => {
      await action(f)
      router.refresh()
    })
  }

  return (
    <span className="category-actions" style={{ display: 'flex', gap: 6 }}>
      {archived ? (
        <button className="page-button small" disabled={pending} onClick={() => run(reactivateCategoryAction)}>Aktifkan</button>
      ) : !category.is_system ? (
        <>
          <button className="page-button small" disabled={pending} onClick={() => {
            if (window.confirm(`Arsipkan kategori "${category.name}"? Transaksi lama tetap tersimpan.`)) run(archiveCategoryAction)
          }}>Arsip</button>
        </>
      ) : (
        <span style={{ color: '#718177', fontSize: 9 }}>system</span>
      )}
    </span>
  )
}