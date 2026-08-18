'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import type { Icon } from '@phosphor-icons/react'
import {
  ArrowUpRight,
  Bell,
  CaretDown,
  ChartDonut,
  DotsThree,
  GearSix,
  LockKey,
  PlusCircle,
  Question,
  Receipt,
  SquaresFour,
  ArrowsClockwise,
  Tag,
  Wallet,
} from '@phosphor-icons/react'
import ProfileMenu from '@/components/profile-menu'
import { initialsOf } from '@/lib/format'
import type { Profile } from '@/lib/types'

const NAV_MAIN: { href: string; icon: Icon; label: string; kbd?: string }[] = [
  { href: '/app/dashboard', icon: SquaresFour, label: 'Dashboard' },
  { href: '/app/capture', icon: PlusCircle, label: 'Catat transaksi', kbd: 'N' },
  { href: '/app/transactions', icon: Receipt, label: 'Transaksi' },
  { href: '/app/accounts', icon: Wallet, label: 'Akun keuangan' },
  { href: '/app/categories', icon: Tag, label: 'Kategori' },
  { href: '/app/budgets', icon: ChartDonut, label: 'Anggaran' },
  { href: '/app/recurring', icon: ArrowsClockwise, label: 'Berulang' },
]

const NAV_OTHER: { href: string; icon: Icon; label: string; badge?: boolean }[] = [
  { href: '/app/notifications', icon: Bell, label: 'Notifikasi', badge: true },
  { href: '/app/settings/profile', icon: GearSix, label: 'Pengaturan' },
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
          <CaretDown className="finance-icon" size={16} weight="regular" aria-hidden="true" />
        </div>

        <nav className="nav-list">
          <p className="nav-label">Ruang kerja</p>
          {NAV_MAIN.map((item) => (
            <Link key={item.href} className={`nav-item${isActive(item.href) ? ' active' : ''}`} href={item.href}>
              <span className="nav-icon"><item.icon size={17} weight="regular" aria-hidden="true" /></span>
              {item.label}
              {item.kbd ? <kbd>{item.kbd}</kbd> : null}
            </Link>
          ))}

          <p className="nav-label nav-label-spaced">Lainnya</p>
          {NAV_OTHER.map((item) => (
            <Link key={item.href} className={`nav-item${isActive(item.href) ? ' active' : ''}`} href={item.href}>
              <span className="nav-icon"><item.icon size={17} weight="regular" aria-hidden="true" /></span>
              {item.label}
              {item.badge && unreadCount > 0 ? <span className="count-badge">{unreadCount}</span> : null}
            </Link>
          ))}
        </nav>

        <div className="sidebar-footer">
          <div className="privacy-note"><LockKey className="lock-icon" size={18} weight="regular" aria-hidden="true" /><span><strong>Data Anda tetap privat</strong><small>Hanya Anda yang dapat mengaksesnya.</small></span></div>
          <Link href="/app/notifications" className="help-link"><Question size={16} weight="regular" aria-hidden="true" />Pusat bantuan <ArrowUpRight size={14} weight="regular" aria-hidden="true" /></Link>
        </div>
      </aside>

      <main className="main-content">
        <header className="topbar">
          <div className="breadcrumb">
            <button className="mobile-menu" aria-label="Buka menu"><DotsThree size={20} weight="bold" aria-hidden="true" /></button>
            <span className="muted">Ruang pribadi</span><span className="slash">/</span><strong>{title}</strong>
          </div>
          <div className="topbar-actions">
            <Link className="icon-button notification-button" href="/app/notifications" aria-label="Buka notifikasi">
              <Bell size={21} weight="regular" aria-hidden="true" />
              {unreadCount > 0 ? <i aria-hidden="true"></i> : null}
            </Link>
            <ProfileMenu displayName={displayName} initial={initial} />
          </div>
        </header>

        <div className="content-wrap">{children}</div>
      </main>

      <nav className="mobile-nav" aria-label="Navigasi mobile">
        <Link aria-current={isActive('/app/dashboard') ? 'page' : undefined} className={isActive('/app/dashboard') ? 'active' : ''} href="/app/dashboard"><SquaresFour size={18} weight="regular" aria-hidden="true" />Dashboard</Link>
        <Link aria-current={isActive('/app/transactions') ? 'page' : undefined} className={isActive('/app/transactions') ? 'active' : ''} href="/app/transactions"><Receipt size={18} weight="regular" aria-hidden="true" />Transaksi</Link>
        <Link aria-current={isActive('/app/capture') ? 'page' : undefined} className={isActive('/app/capture') ? 'active' : ''} href="/app/capture"><PlusCircle size={20} weight="regular" aria-hidden="true" />Catat</Link>
        <Link aria-current={isActive('/app/budgets') ? 'page' : undefined} className={isActive('/app/budgets') ? 'active' : ''} href="/app/budgets"><ChartDonut size={18} weight="regular" aria-hidden="true" />Anggaran</Link>
        <Link aria-current={isActive('/app/settings/profile') ? 'page' : undefined} className={isActive('/app/settings/profile') ? 'active' : ''} href="/app/settings/profile"><DotsThree size={20} weight="bold" aria-hidden="true" />Lainnya</Link>
      </nav>
    </div>
  )
}
