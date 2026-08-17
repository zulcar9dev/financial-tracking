import { redirect } from 'next/navigation'
import AppShell from '@/components/app-shell'
import { getCurrentUser } from '@/lib/insforge/server'
import { getProfile, getUnreadNotificationCount } from '@/lib/db'

export const dynamic = 'force-dynamic'

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser()
  if (!user) redirect('/login')

  const [profile, unreadCount] = await Promise.all([
    getProfile(user.id),
    getUnreadNotificationCount(user.id),
  ])

  return (
    <AppShell profile={profile} unreadCount={unreadCount}>
      {children}
    </AppShell>
  )
}