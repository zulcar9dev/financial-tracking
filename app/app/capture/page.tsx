import TransactionForm from '@/components/transaction-form'
import { getCurrentUser } from '@/lib/insforge/server'
import { getAccounts, getCategories, getProfile } from '@/lib/db'

export const dynamic = 'force-dynamic'

export default async function CapturePage() {
  const user = await getCurrentUser()
  const [profile, accounts, categories] = await Promise.all([
    getProfile(user!.id),
    getAccounts(user!.id),
    getCategories(user!.id),
  ])

  return (
    <div className="page-stack">
      <section className="page-heading">
        <div>
          <span className="page-kicker">Capture / manual</span>
          <h1>Catat transaksi.</h1>
          <p>Isi manual: pengeluaran, pendapatan, atau transfer antar akun Anda.</p>
        </div>
      </section>

      <section className="surface-card" style={{ borderColor: 'rgba(201, 244, 108, .25)' }}>
        <div className="surface-header">
          <div>
            <span className="surface-kicker">Catat transaksi</span>
            <h2>Isi manual</h2>
            <p>Transaksi disimpan sebagai confirmed; saldo akun diperbarui secara otomatis.</p>
          </div>
          <span className="status-pill">Confirmed</span>
        </div>
        <div style={{ marginTop: 16 }}>
          <TransactionForm
            accounts={accounts}
            categories={categories}
            timezone={profile?.timezone ?? 'Asia/Jakarta'}
          />
        </div>
      </section>

      <section className="surface-card" style={{ marginTop: 11 }}>
        <div className="surface-header">
          <div>
            <span className="surface-kicker">AI capture</span>
            <h2>Foto struk &amp; catatan otomatis</h2>
            <p>Fitur AI (OCR struk, parsing bahasa alami, tanya jawab) dijadwalkan pada rilis berikutnya. Untuk saat ini, gunakan pengisian manual.</p>
          </div>
          <span className="status-pill warning">Segera hadir</span>
        </div>
        <div className="upload-drop" style={{ marginTop: 18 }}>
          <div><strong>▧ Upload foto struk</strong><small>Menunggu rilis AI — striktur teks belum tersedia.</small></div>
        </div>
      </section>
    </div>
  )
}