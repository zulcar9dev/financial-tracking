'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import LogoutButton from '@/components/logout-button'
import { initialsOf } from '@/lib/format'
import type { Profile } from '@/lib/types'

const NAV_MAIN = [
  { href: '/app/dashboard', icon: '◩', label: 'Dashboard' },
  { href: '/app/capture', icon: '＋', label: 'Catat transaksi', kbd: 'N' },
  { href: '/app/transactions', icon: '≡', label: 'Transaksi' },
  { href: '/app/accounts', icon: '▣', label: 'Akun keuangan' },
  { href: '/app/budgets', icon: '◒', label: 'Anggaran' },
  { href: '/app/recurring', icon: '↻', label: 'Berulang' },
]

const NAV_OTHER = [
  { href: '/app/notifications', icon: '◌', label: 'Notifikasi', badge: true },
  { href: '/app/settings/profile', icon: '⚙', label: 'Pengaturan' },
]

const TITLES: Record<string, string> = {
  dashboard: 'Dashboard',
  capture: 'Catat transaksi',
  transactions: 'Transaksi',
  accounts: 'Akun keuangan',
  categories: 'Kategori',
  budgets: 'Anggaran',
  recurring: 'Berulang',
  notifications: 'Notifikasi',
  settings: 'Pengaturan',
}

export default function AppShell({
  profile,
  unreadCount,
  children,
}: {
  profile: Profile | null
  unreadCount: number
  children: React.ReactNode
}) {
  const pathname = usePathname()
  const displayName = profile?.display_name ?? 'Pengguna'
  const initial = initialsOf(displayName)

  const firstSegment = pathname.replace(/^\//, '').split('/')[1] ?? 'dashboard'
  const title = TITLES[firstSegment] ?? 'Aplikasi'

  const isActive = (href: string) => {
    if (href === '/app/dashboard') return pathname === '/app/dashboard' || pathname.startsWith('/app/dashboard')
    if (href === '/app/capture') return pathname === '/app/capture'
    if (href === '/app/transactions') return pathname.startsWith('/app/transactions')
    if (href === '/app/settings/profile') return pathname.startsWith('/app/settings')
    return pathname.startsWith(href)
  }

  return (
    <div className="app-shell">
      <aside className="sidebar" aria-label="Navigasi utama">
        <Link className="brand" href="/app/dashboard" aria-label="Financial Tracking AI dashboard">
          <span className="brand-mark" aria-hidden="true">ft</span>
          <span>financial<span>tracking</span></span>
        </Link>

        <div className="workspace-switcher">
          <span className="avatar avatar-small">{initial}</span>
          <span className="workspace-copy"><strong>Ruang pribadi</strong><small>akun personal</small></span>
          <span className="chevron" aria-hidden="true">⌄</span>
        </div>

        <nav className="nav-list">
          <p className="nav-label">Ruang kerja</p>
          {NAV_MAIN.map((item) => (
            <Link key={item.href} className={`nav-item${isActive(item.href) ? ' active' : ''}`} href={item.href}>
              <span className="nav-icon">{item.icon}</span>
              {item.label}
              {item.kbd ? <kbd>{item.kbd}</kbd> : null}
            </Link>
          ))}

          <p className="nav-label nav-label-spaced">Lainnya</p>
          {NAV_OTHER.map((item) => (
            <Link key={item.href} className={`nav-item${isActive(item.href) ? ' active' : ''}`} href={item.href}>
              <span className="nav-icon">{item.icon}</span>
              {item.label}
              {item.badge && unreadCount > 0 ? <span className="count-badge">{unreadCount}</span> : null}
            </Link>
          ))}
        </nav>

        <div className="sidebar-footer">
          <LogoutButton className="logout-button" />
          <div className="privacy-note"><span className="lock-icon">⌑</span><span><strong>Data Anda tetap privat</strong><small>Hanya Anda yang dapat mengaksesnya.</small></span></div>
          <Link href="/app/notifications" className="help-link"><span>?</span>Pusat bantuan <span>↗</span></Link>
        </div>
      </aside>

      <main className="main-content">
        <header className="topbar">
          <div className="breadcrumb">
            <button className="mobile-menu" aria-label="Buka menu">☰</button>
            <span className="muted">Ruang pribadi</span><span className="slash">/</span><strong>{title}</strong>
          </div>
          <div className="topbar-actions">
            <Link className="icon-button notification-button" href="/app/notifications" aria-label="Buka notifikasi">
              <span>◌</span>
              {unreadCount > 0 ? <i aria-hidden="true"></i> : null}
            </Link>
            <Link className="profile-button" href="/app/settings/profile">
              <span className="avatar">{initial}</span>
              <span className="profile-name">{displayName}</span>
              <span className="chevron">⌄</span>
            </Link>
          </div>
        </header>

        <div className="content-wrap">{children}</div>
      </main>

      <nav className="mobile-nav" aria-label="Navigasi mobile">
        <Link className={isActive('/app/dashboard') ? 'active' : ''} href="/app/dashboard"><span>◩</span>Dashboard</Link>
        <Link className={isActive('/app/transactions') ? 'active' : ''} href="/app/transactions"><span>≡</span>Transaksi</Link>
        <Link className={isActive('/app/capture') ? 'active' : ''} href="/app/capture"><span>＋</span>Catat</Link>
        <Link className={isActive('/app/budgets') ? 'active' : ''} href="/app/budgets"><span>◒</span>Anggaran</Link>
        <Link className={isActive('/app/settings/profile') ? 'active' : ''} href="/app/settings/profile"><span>•••</span>Lainnya</Link>
      </nav>
    </div>
  )
}