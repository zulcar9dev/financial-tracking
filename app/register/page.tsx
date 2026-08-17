'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { resendVerificationAction, signUpAction, verifyEmailAction } from '@/lib/actions/auth'

export default function RegisterPage() {
  const router = useRouter()
  const [step, setStep] = useState<'form' | 'verify'>('form')
  const [email, setEmail] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [info, setInfo] = useState<string | null>(null)
  const [pending, setPending] = useState(false)
  const [otp, setOtp] = useState('')

  async function handleSignUp(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setPending(true)
    setError(null)
    setInfo(null)
    const formData = new FormData(e.currentTarget)
    setEmail(String(formData.get('email') ?? ''))
    const result = await signUpAction(formData)
    setPending(false)
    if (result.error) {
      setError(result.error)
      return
    }
    setStep('verify')
    setInfo('Kode verifikasi 6 digit telah dikirim ke email Anda.')
  }

  async function handleVerify(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setPending(true)
    setError(null)
    const result = await verifyEmailAction({ email, otp })
    setPending(false)
    if (result.error) {
      setError(result.error)
      return
    }
    router.push('/onboarding')
    router.refresh()
  }

  async function handleResend() {
    setPending(true)
    setError(null)
    const result = await resendVerificationAction({ email })
    setPending(false)
    if (result.error) setError(result.error)
    else setInfo('Kode verifikasi baru telah dikirim.')
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
            <span className="landing-kicker">Mulai dari satu transaksi</span>
            <h1>
              Catat dulu. Pahami <em>pelan-pelan.</em>
            </h1>
            <p>
              Anda tidak perlu spreadsheet, integrasi bank, atau pengetahuan akuntansi untuk memulai.
            </p>
          </div>
          <div className="auth-note">
            <strong>01</strong>
            <span>Gratis untuk memulai · Mata uang dasar IDR</span>
          </div>
        </section>
        <section className="auth-form-side">
          <div className="auth-form-wrap">
            <Link className="auth-back" href="/">
              <span>&lt;-</span> Kembali ke beranda
            </Link>
            {step === 'form' ? (
              <>
                <h2>Buat ruang pribadi.</h2>
                <p>Satu akun untuk satu pemilik data keuangan.</p>
                <form className="auth-form" onSubmit={handleSignUp}>
                  <div className="field">
                    <label htmlFor="display-name">Nama tampilan</label>
                    <input className="input" id="display-name" name="name" type="text" placeholder="Contoh: Alya Rahma" autoComplete="name" required />
                  </div>
                  <div className="field">
                    <label htmlFor="email">Email</label>
                    <input className="input" id="email" name="email" type="email" placeholder="nama@email.com" autoComplete="email" required />
                  </div>
                  <div className="field">
                    <label htmlFor="password">Password</label>
                    <input className="input" id="password" name="password" type="password" placeholder="Minimal 6 karakter" autoComplete="new-password" required />
                  </div>
                  <label className="check-row">
                    <input type="checkbox" name="agreed" /> <span>
                      Saya menyetujui <Link href="/terms">Ketentuan penggunaan</Link> dan{' '}
                      <Link href="/privacy">Kebijakan privasi</Link>.
                    </span>
                  </label>
                  {error && <p className="form-error" role="alert">{error}</p>}
                  <button className="page-button primary" type="submit" disabled={pending}>
                    {pending ? 'Membuat akun...' : <>Buat akun <span>-&gt;</span></>}
                  </button>
                </form>
              </>
            ) : (
              <>
                <h2>Verifikasi email Anda.</h2>
                <p>Masukkan kode 6 digit yang dikirim ke <strong>{email}</strong>.</p>
                <form className="auth-form" onSubmit={handleVerify}>
                  <div className="field">
                    <label htmlFor="otp">Kode verifikasi</label>
                    <input
                      className="input"
                      id="otp"
                      type="text"
                      inputMode="numeric"
                      maxLength={6}
                      value={otp}
                      onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                      placeholder="123456"
                      required
                    />
                  </div>
                  {error && <p className="form-error" role="alert">{error}</p>}
                  {info && <p className="form-info" role="status">{info}</p>}
                  <button className="page-button primary" type="submit" disabled={pending || otp.length !== 6}>
                    {pending ? 'Memverifikasi...' : 'Verifikasi dan lanjut'}
                  </button>
                  <button className="page-button ghost" type="button" onClick={handleResend} disabled={pending}>
                    Kirim ulang kode
                  </button>
                </form>
              </>
            )}
            <div className="auth-divider">
              <span>sudah punya akun?</span>
            </div>
            <p className="auth-switch">
              Masuk ke akun Anda <Link href="/login">di sini</Link>.
            </p>
          </div>
        </section>
      </main>
    </div>
  )
}