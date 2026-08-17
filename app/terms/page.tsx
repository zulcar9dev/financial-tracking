import Link from 'next/link'

export default function TermsPage() {
  return (
    <div className="page-body public-page">
      <header className="public-nav">
        <Link className="page-brand" href="/">
          <span className="page-brand-mark">ft</span>
          <span>
            financial<span>tracking</span>
          </span>
        </Link>
        <nav className="public-links">
          <Link href="/#cara-kerja">Cara kerja</Link>
          <Link href="/privacy">Privasi</Link>
        </nav>
        <div className="public-actions">
          <Link className="text-link" href="/login">Masuk</Link>
          <Link className="page-button primary" href="/register">Mulai gratis</Link>
        </div>
      </header>
      <main className="legal-wrap">
        <span className="page-kicker">Cara kami bekerja</span>
        <h1>Ketentuan penggunaan.</h1>
        <p className="legal-intro">
          Ketentuan dasar untuk menggunakan ruang pencatatan keuangan personal Financial Tracking AI
          secara aman dan bertanggung jawab.
        </p>
        <div className="legal-content">
          <nav className="legal-toc">
            <a href="#akun">Akun</a>
            <a href="#data">Data dan AI</a>
            <a href="#batasan">Batasan layanan</a>
            <a href="#hapus">Penghapusan</a>
          </nav>
          <div className="legal-sections">
            <section className="legal-section" id="akun">
              <h2>Akun personal</h2>
              <p>
                Satu akun ditujukan untuk satu pemilik data. Anda bertanggung jawab menjaga email,
                password, dan sesi akses tetap aman. Halaman aplikasi yang berisi data finansial
                memerlukan session yang valid.
              </p>
            </section>
            <section className="legal-section" id="data">
              <h2>Data dan konfirmasi</h2>
              <p>
                Anda tetap menjadi pihak yang menentukan data transaksi. AI boleh menyarankan tipe,
                nominal, akun, kategori, tanggal, merchant, dan catatan, tetapi tidak boleh menyimpan
                transaksi tanpa konfirmasi Anda.
              </p>
            </section>
            <section className="legal-section" id="batasan">
              <h2>Batasan layanan</h2>
              <p>
                Aplikasi membantu pencatatan dan analisis deskriptif. Aplikasi tidak menyediakan nasihat
                investasi, rekomendasi finansial personal, sinkronisasi bank, atau keputusan profesional
                mengenai uang Anda.
              </p>
            </section>
            <section className="legal-section" id="hapus">
              <h2>Ekspor dan penghapusan</h2>
              <p>
                Anda dapat mengekspor data dan meminta penghapusan permanen. Penghapusan membutuhkan
                reauthentication dan teks konfirmasi eksplisit. Setelah selesai, session lama tidak boleh
                digunakan untuk mengakses data yang dihapus.
              </p>
            </section>
          </div>
        </div>
      </main>
      <footer className="public-footer">
        <span>Terakhir diperbarui: 17 Agustus 2026</span>
        <nav>
          <Link href="/">Beranda</Link>
          <Link href="/privacy">Privasi</Link>
          <Link href="/register">Daftar</Link>
        </nav>
      </footer>
    </div>
  )
}