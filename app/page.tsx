import Link from 'next/link'

export default function LandingPage() {
  return (
    <div className="page-body public-page">
      <header className="public-nav">
        <Link className="page-brand" href="/" aria-label="Financial Tracking AI beranda">
          <span className="page-brand-mark">ft</span>
          <span>
            financial<span>tracking</span>
          </span>
</Link>
        <nav className="public-links" aria-label="Navigasi publik">
          <a href="#cara-kerja">Cara kerja</a>
          <a href="#prinsip">Prinsip kami</a>
          <Link href="/privacy">Privasi</Link>
        </nav>
        <div className="public-actions">
          <Link className="text-link" href="/login">
            Masuk
          </Link>
          <Link className="page-button primary" href="/register">
            Mulai gratis <span>-&gt;</span>
          </Link>
        </div>
      </header>

      <main className="public-main">
        <section className="landing-hero">
          <div className="hero-copy">
            <span className="landing-kicker">Financial Tracking AI</span>
            <h1>
              Keuangan Anda, akhirnya terasa <em>ringan.</em>
            </h1>
            <p className="landing-copy">
              Catat transaksi lewat chat, foto struk, atau formulir manual. Selalu tinjau hasilnya sebelum
              data disimpan.
            </p>
            <div className="landing-actions">
              <Link className="page-button primary" href="/register">
                Buat akun gratis <span>-&gt;</span>
              </Link>
              <a className="page-button ghost" href="#cara-kerja">
                Lihat cara kerja
              </a>
            </div>
            <div className="landing-proof">
              <span className="proof-mark">✓</span>
              <span>IDR · Bahasa Indonesia · Data tetap milik Anda</span>
            </div>
          </div>
          <div className="hero-visual" aria-label="Pratinjau dashboard Financial Tracking AI">
            <span className="hero-glow"></span>
            <div className="landing-preview">
              <div className="preview-top">
                <span>RUANG PRIBADI / DASHBOARD</span>
                <span className="preview-dots">
                  <i></i>
                  <i></i>
                  <i></i>
                </span>
              </div>
              <div className="preview-greeting">
                <div>
                  <small>17 AGUSTUS 2026</small>
                  <h3>Selamat pagi.</h3>
                </div>
                <span className="preview-score">84</span>
              </div>
              <div className="preview-metrics">
                <div className="preview-metric featured">
                  <span>Total saldo</span>
                  <strong>Rp12,84 jt</strong>
                  <small>+ Rp1,24 jt</small>
                </div>
                <div className="preview-metric">
                  <span>Pendapatan</span>
                  <strong>Rp8,5 jt</strong>
                  <small>+4,2%</small>
                </div>
                <div className="preview-metric">
                  <span>Pengeluaran</span>
                  <strong>Rp4,26 jt</strong>
                  <small>-8,7%</small>
                </div>
              </div>
              <div className="preview-capture">
                <div className="preview-chart">
                  <strong>Arus kas</strong>
                  <div className="preview-bars">
                    <i></i>
                    <i></i>
                    <i></i>
                    <i></i>
                    <i></i>
                    <i></i>
                  </div>
                </div>
                <div className="preview-ai">
                  <span>AI bantu catat</span>
                  <p>&quot;Makan siang 45 ribu dari BCA.&quot;</p>
                  <b>Review sebelum simpan -&gt;</b>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="value-grid" id="cara-kerja">
          <article className="value-card">
            <h2>Tulis seperti biasa</h2>
            <p>Bahasa Indonesia sehari-hari diubah menjadi draft transaksi yang bisa Anda periksa.</p>
          </article>
          <article className="value-card">
            <h2>Review, lalu simpan</h2>
            <p>AI tidak pernah menyimpan otomatis. Nominal, akun, tanggal, dan kategori tetap berada di tangan Anda.</p>
          </article>
          <article className="value-card" id="prinsip">
            <h2>Kontrol penuh</h2>
            <p>Kelola akun manual, anggaran, pengingat, ekspor, dan penghapusan data dari satu ruang pribadi.</p>
          </article>
        </section>
      </main>

      <footer className="public-footer">
        <span>Financial Tracking AI · IDR · Asia/Jakarta</span>
        <nav>
          <Link href="/privacy">Privasi</Link>
          <Link href="/terms">Ketentuan</Link>
          <Link href="/login">Masuk</Link>
        </nav>
      </footer>
    </div>
  )
}