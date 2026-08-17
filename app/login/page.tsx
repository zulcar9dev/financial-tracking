'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { signInAction } from '@/lib/actions/auth'

export default function LoginPage() {
  const router = useRouter()
  const [error, setError] = useState<string | null>(null)
  const [pending, setPending] = useState(false)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setPending(true)
    setError(null)
    const result = await signInAction(new FormData(e.currentTarget))
    setPending(false)
    if (result.error) {
      setError(result.error)
      return
    }
    router.push('/app/dashboard')
    router.refresh()
  }

  return (
    <div className="page-body">
      <main className="auth-page">
        <section className="auth-visual">
<Link className="page-brand auth-mark" href="/">
          <span className="page-brand-mark">ft</span>
          <span>
            financial<span>tracking</span>
          </span>
        </Link>
          <div className="auth-visual-copy">
            <span className="landing-kicker">Ruang pribadi Anda</span>
            <h1>
              Uang lebih jelas, kepala lebih <em>tenang.</em>
            </h1>
            <p>
              Catat pengeluaran, pahami pola, dan buat keputusan berdasarkan data yang Anda konfirmasi
              sendiri.
            </p>
          </div>
          <div className="auth-note">
            <strong>ft</strong>
            <span>Privat sejak awal. Manual fallback selalu tersedia.</span>
          </div>
        </section>
        <section className="auth-form-side">
          <div className="auth-form-wrap">
            <Link className="auth-back" href="/">
              <span>&lt;-</span> Kembali ke beranda
            </Link>
            <h2>Selamat datang kembali.</h2>
            <p>Masuk ke ruang keuangan personal Anda.</p>
            <form className="auth-form" onSubmit={handleSubmit}>
              <div className="field">
                <label htmlFor="email">Email</label>
                <input className="input" id="email" name="email" type="email" placeholder="nama@email.com" autoComplete="email" required />
              </div>
              <div className="field">
                <label htmlFor="password">Password</label>
                <input className="input" id="password" name="password" type="password" placeholder="Masukkan password" autoComplete="current-password" required />
              </div>
              <div className="auth-help">
                <span>Gunakan password minimal 6 karakter.</span>
                <Link href="/forgot-password">Lupa password?</Link>
              </div>
              {error && <p className="form-error" role="alert">{error}</p>}
              <button className="page-button primary" type="submit" disabled={pending}>
                {pending ? 'Memeriksa...' : <>Masuk ke dashboard <span>-&gt;</span></>}
              </button>
            </form>
            <div className="auth-divider">
              <span>akun baru?</span>
            </div>
            <p className="auth-switch">
              Belum punya akun? <Link href="/register">Daftar gratis</Link>
            </p>
          </div>
        </section>
      </main>
    </div>
  )
}