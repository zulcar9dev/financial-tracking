import Link from 'next/link'
import { redirect } from 'next/navigation'
import ProfileForm from '@/components/profile-form'
import { getCurrentUser } from '@/lib/insforge/server'
import { getProfile } from '@/lib/db'

export const dynamic = 'force-dynamic'

export default async function OnboardingPage() {
  const user = await getCurrentUser()
  if (!user) redirect('/login')

  const profile = await getProfile(user.id)

  if (profile?.display_name) {
    redirect('/app/dashboard')
  }

  return (
    <div className="auth-page">
      <div className="auth-card">
        <Link className="brand brand-centered" href="/">
          <span className="brand-mark" aria-hidden="true">ft</span>
          <span>financial<span>tracking</span></span>
        </Link>

        <div className="auth-heading">
          <p className="eyebrow">Langkah terakhir</p>
          <h1>Lengkapi profil Anda</h1>
          <p className="muted">Pilih zona waktu dan format angka agar laporan keuangan sesuai dengan kebiasaan Anda.</p>
        </div>

        <ProfileForm profile={profile} redirectTo="/app/dashboard" />
      </div>
    </div>
  )
}