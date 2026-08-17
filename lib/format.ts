export function formatIDR(amount: number, opts: { compact?: boolean } = {}): string {
  const abs = Math.abs(amount)
  if (opts.compact && abs >= 1_000_000) {
    const jt = abs / 1_000_000
    return `Rp${jt.toLocaleString('id-ID', { maximumFractionDigits: 2 })} jt`
  }
  return `Rp${abs.toLocaleString('id-ID')}`
}

export function formatIDRFull(amount: number): string {
  const sign = amount < 0 ? '-' : ''
  return `${sign}Rp${Math.abs(amount).toLocaleString('id-ID')}`
}

export function parseIDRInput(value: string): number | null {
  const cleaned = value.replace(/[^\d]/g, '')
  if (!cleaned) return null
  const n = parseInt(cleaned, 10)
  return Number.isFinite(n) && n > 0 ? n : null
}

export function formatDateTime(iso: string | null | undefined, timezone: string): string {
  if (!iso) return '-'
  return new Intl.DateTimeFormat('id-ID', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    timeZone: timezone,
  }).format(new Date(iso))
}

export function formatDate(iso: string | null | undefined, timezone: string): string {
  if (!iso) return '-'
  return new Intl.DateTimeFormat('id-ID', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    timeZone: timezone,
  }).format(new Date(iso))
}

export function formatDateShort(iso: string | null | undefined, timezone: string): string {
  if (!iso) return '-'
  return new Intl.DateTimeFormat('id-ID', {
    day: 'numeric',
    month: 'short',
    timeZone: timezone,
  }).format(new Date(iso))
}

export function todayInTimezone(timezone: string): Date {
  return new Date(new Date().toLocaleString('en-US', { timeZone: timezone }))
}

export function monthLabel(date: Date, timezone: string): string {
  return new Intl.DateTimeFormat('id-ID', { month: 'long', year: 'numeric', timeZone: timezone }).format(date)
}

export function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean)
  if (parts.length === 0) return 'FT'
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
}

export const initialsOf = initials

export type PeriodKey = 'this_month' | 'last_month' | 'last_30_days' | 'this_year' | 'custom'

export function periodRange(key: PeriodKey, timezone: string, custom?: { from: string; to: string }): { from: Date; to: Date } {
  const now = new Date()
  const parts = new Intl.DateTimeFormat('en-CA', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    timeZone: timezone,
  }).formatToParts(now)
  const get = (t: string) => parts.find((p) => p.type === t)?.value ?? '1'
  const year = Number(get('year'))
  const month = Number(get('month'))
  const day = Number(get('day'))

  const startOfMonth = (y: number, m: number) => new Date(Date.UTC(y, m - 1, 1))
  const endOfMonth = (y: number, m: number) => new Date(Date.UTC(y, m, 0, 23, 59, 59, 999))

  switch (key) {
    case 'this_month':
      return { from: startOfMonth(year, month), to: endOfMonth(year, month) }
    case 'last_month': {
      const lm = month === 1 ? 12 : month - 1
      const ly = month === 1 ? year - 1 : year
      return { from: startOfMonth(ly, lm), to: endOfMonth(ly, lm) }
    }
    case 'last_30_days': {
      const from = new Date(Date.UTC(year, month - 1, day - 30))
      return { from, to: new Date(Date.UTC(year, month - 1, day, 23, 59, 59, 999)) }
    }
    case 'this_year':
      return { from: startOfMonth(year, 1), to: new Date(Date.UTC(year, 12, 31, 23, 59, 59, 999)) }
    case 'custom': {
      if (!custom?.from || !custom.to) return { from: startOfMonth(year, month), to: endOfMonth(year, month) }
      return {
        from: new Date(`${custom.from}T00:00:00.000Z`),
        to: new Date(`${custom.to}T23:59:59.999Z`),
      }
    }
  }
}

export function monthBounds(year: number, month: number, timezone: string): { from: Date; to: Date } {
  void timezone
  return {
    from: new Date(Date.UTC(year, month - 1, 1)),
    to: new Date(Date.UTC(year, month, 0, 23, 59, 59, 999)),
  }
}

export function toLocalDateInput(iso: string | null | undefined, timezone: string): string {
  if (!iso) return ''
  return new Intl.DateTimeFormat('en-CA', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    timeZone: timezone,
  }).format(new Date(iso))
}