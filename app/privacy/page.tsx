import Link from 'next/link'

export default function PrivacyPage() {
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
          <Link href="/terms">Ketentuan</Link>
        </nav>
        <div className="public-actions">
          <Link className="text-link" href="/login">Masuk</Link>
          <Link className="page-button primary" href="/register">Mulai gratis</Link>
        </div>
      </header>
      <main className="legal-wrap">
        <span className="page-kicker">Transparansi data</span>
        <h1>Kebijakan privasi.</h1>
        <p className="legal-intro">
          Versi ringkas ini menjelaskan bagaimana Financial Tracking AI menggunakan data yang diperlukan
          untuk menyediakan pencatatan keuangan personal.
        </p>
        <div className="legal-content">
          <nav className="legal-toc">
            <a href="#data">Data yang diproses</a>
            <a href="#ai">Pemrosesan AI</a>
            <a href="#kontrol">Kontrol Anda</a>
            <a href="#provider">Provider</a>
          </nav>
          <div className="legal-sections">
            <section className="legal-section" id="data">
              <h2>Data yang kami proses</h2>
              <p>
                Kami memproses profil, akun keuangan, kategori, transaksi yang Anda konfirmasi, anggaran,
                template berulang, preferensi notifikasi, dan metadata lampiran yang Anda pilih untuk
                disimpan.
              </p>
            </section>
            <section className="legal-section" id="ai">
              <h2>AI hanya membantu menyiapkan draft</h2>
              <p>
                Pesan chat atau foto struk diproses untuk menghasilkan rancangan terstruktur. Draft tidak
                menjadi transaksi confirmed sebelum Anda meninjau dan memilih Konfirmasi dan simpan. Q&amp;A
                finansial bersifat read-only dan tidak dapat mengubah data.
              </p>
            </section>
            <section className="legal-section" id="kontrol">
              <h2>Kontrol ada pada Anda</h2>
              <ul>
                <li>Anda dapat mengedit, menghapus, dan mengarsipkan data sesuai alur aplikasi.</li>
                <li>Anda dapat meminta ekspor JSON atau CSV kapan saja.</li>
                <li>
                  Anda dapat menghapus data secara permanen setelah reauthentication dan konfirmasi
                  eksplisit.
                </li>
              </ul>
            </section>
            <section className="legal-section" id="provider">
              <h2>Provider pihak ketiga</h2>
              <p>
                AI dipanggil melalui fungsi server. API key tidak dikirim ke browser. Retensi teknis
                provider pihak ketiga tunduk pada kebijakan dan konfigurasi provider yang benar-benar
                aktif; aplikasi tidak menjanjikan retensi nol di luar konfigurasi tersebut.
              </p>
            </section>
          </div>
        </div>
      </main>
      <footer className="public-footer">
        <span>Terakhir diperbarui: 17 Agustus 2026</span>
        <nav>
          <Link href="/">Beranda</Link>
          <Link href="/terms">Ketentuan</Link>
          <Link href="/register">Daftar</Link>
        </nav>
      </footer>
    </div>
  )
}