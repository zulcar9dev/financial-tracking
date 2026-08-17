'use server'

import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { createAuthActions } from '@insforge/sdk/ssr'
import { createInsForgeServerClient } from '@/lib/insforge/server'

export type AuthActionResult = {
  error: string | null
}

export async function signUpAction(formData: FormData): Promise<AuthActionResult> {
  const name = String(formData.get('name') ?? '').trim()
  const email = String(formData.get('email') ?? '').trim()
  const password = String(formData.get('password') ?? '')
  const agreed = formData.get('agreed') === 'on'

  if (!name || !email || !password) return { error: 'Nama, email, dan password wajib diisi.' }
  if (password.length < 6) return { error: 'Password minimal 6 karakter.' }
  if (!agreed) return { error: 'Anda harus menyetujui Ketentuan dan Kebijakan privasi.' }

  const auth = createAuthActions({ cookies: await cookies() })
  const { data, error } = await auth.signUp({ email, password, name })

  if (error) return { error: error.message ?? 'Gagal membuat akun.' }

  if (data?.requireEmailVerification) {
    return { error: null }
  }
  redirect('/onboarding')
}

export async function verifyEmailAction(input: { email: string; otp: string }): Promise<AuthActionResult> {
  const auth = createAuthActions({ cookies: await cookies() })
  const { error } = await auth.verifyEmail({ email: input.email, otp: input.otp })
  if (error) return { error: error.message ?? 'Kode tidak valid atau sudah kedaluwarsa.' }
  return { error: null }
}

export async function resendVerificationAction(input: { email: string }): Promise<AuthActionResult> {
  const insforge = await createInsForgeServerClient()
  const { error } = await insforge.auth.resendVerificationEmail({
    email: input.email,
    redirectTo: `${process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'}/register`,
  })
  if (error) return { error: error.message ?? 'Gagal mengirim ulang kode.' }
  return { error: null }
}

export async function signInAction(formData: FormData): Promise<AuthActionResult> {
  const email = String(formData.get('email') ?? '').trim()
  const password = String(formData.get('password') ?? '')

  if (!email || !password) return { error: 'Email dan password wajib diisi.' }

  const auth = createAuthActions({ cookies: await cookies() })
  const { error } = await auth.signInWithPassword({ email, password })

  if (error) {
    if (error.statusCode === 403) {
      return { error: 'Email belum diverifikasi. Periksa kode verifikasi di email Anda.' }
    }
    return { error: error.message ?? 'Email atau password salah.' }
  }

  return { error: null }
}

export async function signOutAction() {
  const auth = createAuthActions({ cookies: await cookies() })
  await auth.signOut()
  redirect('/')
}

export async function sendResetPasswordEmailAction(formData: FormData): Promise<AuthActionResult> {
  const email = String(formData.get('email') ?? '').trim()
  if (!email) return { error: 'Email wajib diisi.' }

  const insforge = await createInsForgeServerClient()
  const { error } = await insforge.auth.sendResetPasswordEmail({
    email,
    redirectTo: `${process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'}/forgot-password`,
  })
  if (error) return { error: error.message ?? 'Gagal mengirim email reset.' }
  return { error: null }
}

export async function exchangeResetCodeAction(input: {
  email: string
  code: string
}): Promise<{ error: string | null; token: string | null }> {
  const insforge = await createInsForgeServerClient()
  const { data, error } = await insforge.auth.exchangeResetPasswordToken({
    email: input.email,
    code: input.code,
  })
  if (error) return { error: error.message ?? 'Kode tidak valid.', token: null }
  return { error: null, token: data?.token ?? null }
}

export async function resetPasswordAction(input: {
  token: string
  newPassword: string
}): Promise<AuthActionResult> {
  const insforge = await createInsForgeServerClient()
  const { error } = await insforge.auth.resetPassword({
    newPassword: input.newPassword,
    otp: input.token,
  })
  if (error) return { error: error.message ?? 'Gagal mengatur ulang password.' }
  return { error: null }
}