'use client'

import Link from 'next/link'
import { useEffect, useRef, useState } from 'react'
import { CaretDown, GearSix } from '@phosphor-icons/react'
import LogoutButton from '@/components/logout-button'

export default function ProfileMenu({
  displayName,
  initial,
}: {
  displayName: string
  initial: string
}) {
  const [open, setOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)
  const triggerRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    if (!open) return

    const handlePointerDown = (event: PointerEvent) => {
      if (event.target instanceof Node && !menuRef.current?.contains(event.target)) {
        setOpen(false)
      }
    }
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setOpen(false)
        triggerRef.current?.focus()
      }
    }

    document.addEventListener('pointerdown', handlePointerDown)
    document.addEventListener('keydown', handleKeyDown)
    return () => {
      document.removeEventListener('pointerdown', handlePointerDown)
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [open])

  return (
    <div className={`profile-menu${open ? ' is-open' : ''}`} ref={menuRef}>
      <button
        ref={triggerRef}
        type="button"
        className="profile-button"
        aria-label="Buka menu akun"
        aria-expanded={open}
        aria-controls="profile-dropdown"
        onClick={() => setOpen((current) => !current)}
      >
        <span className="avatar">{initial}</span>
        <span className="profile-name">{displayName}</span>
        <CaretDown className="chevron" size={16} weight="regular" aria-hidden="true" />
      </button>

      {open ? (
        <div id="profile-dropdown" className="profile-dropdown" aria-label="Menu akun">
          <Link className="profile-dropdown-link" href="/app/settings/profile" onClick={() => setOpen(false)}>
            <GearSix size={16} weight="regular" aria-hidden="true" />
            Profil &amp; pengaturan
          </Link>
          <div className="profile-dropdown-divider" aria-hidden="true" />
          <LogoutButton className="profile-menu-logout" />
        </div>
      ) : null}
    </div>
  )
}
