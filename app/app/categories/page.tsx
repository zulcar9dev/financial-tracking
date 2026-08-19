import { PlusCircle } from '@phosphor-icons/react/ssr'
import { CategoryCard } from '@/components/category-card'
import { CategoryForm } from '@/components/category-form'
import { getCurrentUser } from '@/lib/insforge/server'
import { getCategories } from '@/lib/db'

export const dynamic = 'force-dynamic'

export default async function CategoriesPage() {
  const user = await getCurrentUser()
  const categories = await getCategories(user!.id)

  const active = categories.filter((c) => c.is_active)
  const archived = categories.filter((c) => !c.is_active)

  return (
    <div className="page-stack">
      <section className="page-heading">
        <div>
          <span className="page-kicker">Taxonomy / {active.length} aktif</span>
          <h1>Kategori transaksi.</h1>
          <p>Gunakan kategori yang sama untuk pencatatan, laporan, dan ketiga model anggaran.</p>
        </div>
      </section>

      <section className="surface-card">
        <div className="surface-header">
          <div><span className="surface-kicker">Kategori aktif</span><h2>Kategori</h2><p>Kategori default sistem tidak dapat dihapus destruktif.</p></div>
          <span className="status-pill">{active.length} aktif</span>
        </div>
        <div className="category-grid" style={{ marginTop: 18 }}>
          {active.map((category) => (
            <CategoryCard key={category.id} category={category} />
          ))}
          <a className="category-new" href="#new-category"><PlusCircle size={18} weight="duotone" aria-hidden="true" /> Tambah kategori</a>
        </div>
      </section>

      {archived.length > 0 ? (
        <section className="surface-card" style={{ marginTop: 11 }}>
          <div className="surface-header">
            <div><span className="surface-kicker">Diarsipkan</span><h2>Kategori nonaktif</h2><p>Kategori yang diarsipkan tidak muncul di pemilihan.</p></div>
            <span className="status-pill warning">{archived.length} kategori</span>
          </div>
          <div className="category-grid" style={{ marginTop: 18 }}>
            {archived.map((category) => (
              <CategoryCard key={category.id} category={category} archived />
            ))}
          </div>
        </section>
      ) : null}

      <section className="surface-card" id="new-category" style={{ marginTop: 11 }}>
        <div className="surface-header">
          <div><span className="surface-kicker">Custom category</span><h2>Buat kategori baru</h2><p>Transfer tidak membutuhkan kategori income atau expense.</p></div>
          <span className="status-pill">Manual</span>
        </div>
        <CategoryForm />
      </section>
    </div>
  )
}
