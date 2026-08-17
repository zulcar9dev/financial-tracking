'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  exchangeResetCodeAction,
  resetPasswordAction,
  sendResetPasswordEmailAction,
} from '@/lib/actions/auth'

export default function ForgotPasswordPage() {
  const router = useRouter()
  const [step, setStep] = useState<'email' | 'code' | 'password'>('email')
  const [email, setEmail] = useState('')
  const [code, setCode] = useState('')
  const [token, setToken] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [info, setInfo] = useState<string | null>(null)
  const [pending, setPending] = useState(false)

  async function handleEmail(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setPending(true)
    setError(null)
    setInfo(null)
    const formData = new FormData(e.currentTarget)
    const value = String(formData.get('email') ?? '').trim()
    setEmail(value)
    const result = await sendResetPasswordEmailAction(formData)
    setPending(false)
    if (result.error) {
      setError(result.error)
      return
    }
    setStep('code')
    setInfo('Kode reset 6 digit telah dikirim ke email Anda.')
  }

  async function handleCode(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setPending(true)
    setError(null)
    const result = await exchangeResetCodeAction({ email, code })
    setPending(false)
    if (result.error || !result.token) {
      setError(result.error ?? 'Kode tidak valid.')
      return
    }
    setToken(result.token)
    setStep('password')
  }

  async function handlePassword(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setPending(true)
    setError(null)
    const formData = new FormData(e.currentTarget)
    const newPassword = String(formData.get('password') ?? '')
    if (!token) {
      setError('Sesi reset kedaluwarsa. Ulangi dari awal.')
      setPending(false)
      return
    }
    const result = await resetPasswordAction({ token, newPassword })
    setPending(false)
    if (result.error) {
      setError(result.error)
      return
    }
    router.push('/login')
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
            <span className="landing-kicker">Akses aman</span>
            <h1>
              Kembali ke ruang <em>Anda.</em>
            </h1>
            <p>Kami akan mengirim kode reset ke email yang terhubung dengan akun Anda.</p>
          </div>
          <div className="auth-note">
            <strong>02</strong>
            <span>Kode reset hanya berlaku sesuai kebijakan keamanan akun.</span>
          </div>
        </section>
        <section className="auth-form-side">
          <div className="auth-form-wrap">
            <Link className="auth-back" href="/login">
              <span>&lt;-</span> Kembali ke login
            </Link>
            {step === 'email' && (
              <>
                <h2>Atur ulang password.</h2>
                <p>Masukkan email akun Anda. Jika terdaftar, kami akan mengirim instruksi berikutnya.</p>
                <form className="auth-form" onSubmit={handleEmail}>
                  <div className="field">
                    <label htmlFor="email">Email akun</label>
                    <input className="input" id="email" name="email" type="email" placeholder="nama@email.com" autoComplete="email" required />
                  </div>
                  {error && <p className="form-error" role="alert">{error}</p>}
                  <button className="page-button primary" type="submit" disabled={pending}>
                    {pending ? 'Mengirim...' : <>Kirim kode reset <span>-&gt;</span></>}
                  </button>
                </form>
              </>
            )}
            {step === 'code' && (
              <>
                <h2>Masukkan kode.</h2>
                <p>Kode 6 digit telah dikirim ke <strong>{email}</strong>.</p>
                <form className="auth-form" onSubmit={handleCode}>
                  <div className="field">
                    <label htmlFor="code">Kode reset</label>
                    <input
                      className="input"
                      id="code"
                      type="text"
                      inputMode="numeric"
                      maxLength={6}
                      value={code}
                      onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
                      placeholder="123456"
                      required
                    />
                  </div>
                  {error && <p className="form-error" role="alert">{error}</p>}
                  {info && <p className="form-info" role="status">{info}</p>}
                  <button className="page-button primary" type="submit" disabled={pending || code.length !== 6}>
                    {pending ? 'Memeriksa...' : 'Lanjutkan'}
                  </button>
                </form>
              </>
            )}
            {step === 'password' && (
              <>
                <h2>Password baru.</h2>
                <p>Buat password baru untuk akun Anda.</p>
                <form className="auth-form" onSubmit={handlePassword}>
                  <div className="field">
                    <label htmlFor="password">Password baru</label>
                    <input className="input" id="password" name="password" type="password" placeholder="Minimal 6 karakter" autoComplete="new-password" required />
                  </div>
                  {error && <p className="form-error" role="alert">{error}</p>}
                  <button className="page-button primary" type="submit" disabled={pending}>
                    {pending ? 'Menyimpan...' : 'Simpan password baru'}
                  </button>
                </form>
              </>
            )}
            <div className="auth-divider">
              <span>butuh bantuan?</span>
            </div>
            <p className="auth-switch">
              Kembali ke <Link href="/login">halaman login</Link>.
            </p>
          </div>
        </section>
      </main>
    </div>
  )
}