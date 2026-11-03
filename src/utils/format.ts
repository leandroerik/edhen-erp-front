export function formatARS(value: number): string {
  return new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: 'ARS',
    maximumFractionDigits: 2,
  }).format(value || 0)
}

export function formatDate(value: string | Date): string {
  const d =
    typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value)
      ? new Date(`${value}T00:00:00`)
      : typeof value === 'string'
        ? new Date(value)
        : value
  if (Number.isNaN(d.getTime())) return typeof value === 'string' ? value : ''
  return d.toLocaleDateString('es-AR') // dd/mm/aaaa
}

export function toISODate(d: Date): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

export function parseDDMMYYYY(s: string): Date | null {
  const m = s.match(/^(\d{2})\/(\d{2})\/(\d{4})$/)
  if (!m) return null
  const dd = Number(m[1]), mm = Number(m[2]), yyyy = Number(m[3])
  const d = new Date(yyyy, mm - 1, dd)
  if (d.getFullYear() !== yyyy || d.getMonth() !== mm - 1 || d.getDate() !== dd) return null
  return d
}

export function uid(prefix = 'id'): string {
  return `${prefix}-${Math.random().toString(36).slice(2, 9)}`
}

export function normalizeText(s: string): string {
  return (s || '').trim().toLowerCase()
}

export function sameText(a?: string, b?: string): boolean {
  if (!a || !b) return false
  return normalizeText(a) === normalizeText(b)
}
