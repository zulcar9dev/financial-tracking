'use client'

import { useSyncExternalStore } from 'react'
import { useTheme } from 'next-themes'
import { Moon, Sun } from '@phosphor-icons/react'

const emptySubscribe = () => () => {}
const clientSnapshot = () => true
const serverSnapshot = () => false

export default function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme()
  const mounted = useSyncExternalStore(emptySubscribe, clientSnapshot, serverSnapshot)

  const isDark = resolvedTheme === 'dark'

  return (
    <button
      type="button"
      className="icon-button theme-toggle"
      aria-label={mounted ? (isDark ? 'Aktifkan mode terang' : 'Aktifkan mode gelap') : 'Ganti tema'}
      onClick={() => setTheme(isDark ? 'light' : 'dark')}
    >
      {mounted ? (
        isDark ? <Sun size={20} weight="regular" aria-hidden="true" /> : <Moon size={20} weight="regular" aria-hidden="true" />
      ) : (
        <span className="theme-toggle-placeholder" aria-hidden="true" />
      )}
    </button>
  )
}
