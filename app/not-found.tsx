import Link from 'next/link'
import { Compass } from '@phosphor-icons/react/ssr'

export default function NotFound() {
  return (
    <main style={{ minHeight: '100vh', display: 'grid', placeItems: 'center', padding: 24 }}>
      <div className="surface-card" style={{ maxWidth: 460, width: '100%', textAlign: 'center', display: 'grid', gap: 13, justifyItems: 'center', padding: '38px 26px' }}>
        <Compass className="empty-mark" size={42} weight="duotone" aria-hidden="true" />
        <span className="page-kicker">404 · Halaman tidak ditemukan</span>
        <h1 style={{ fontSize: 31, letterSpacing: '-0.06em', lineHeight: 1 }}>Halaman ini tidak ada.</h1>
        <p style={{ color: 'var(--page-muted, #718177)', fontSize: 12, lineHeight: 1.6 }}>
          Tautan mungkin salah atau halamannya sudah dipindahkan. Data keuangan Anda tetap aman.
        </p>
        <div style={{ display: 'flex', gap: 9, flexWrap: 'wrap', justifyContent: 'center' }}>
          <Link className="page-button primary" href="/app/dashboard">Buka dashboard</Link>
          <Link className="page-button ghost" href="/">Ke halaman utama</Link>
        </div>
      </div>
    </main>
  )
}