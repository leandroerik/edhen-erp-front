export function formatARS(value: number): string {
  return new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: 'ARS',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value || 0)
}

/**
 * Normaliza cualquier fecha a `YYYY-MM-DD` sin aplicar zona horaria.
 * - `2025-10-05` -> `2025-10-05`
 * - `2025-10-05T03:00:00.000Z` (lo que devuelve Sheets) -> `2025-10-05`
 * - `05/10/2025` -> `2025-10-05`
 */
export function fechaISO(value: string | Date | null | undefined): string {
  if (!value) return ''
  if (value instanceof Date) {
    return Number.isNaN(value.getTime()) ? '' : toISODate(value)
  }

  const s = String(value).trim()
  if (!s) return ''

  const iso = /^(\d{4})-(\d{2})-(\d{2})/.exec(s)
  if (iso) return `${iso[1]}-${iso[2]}-${iso[3]}`

  const dmy = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/.exec(s)
  if (dmy) {
    const dia = dmy[1].padStart(2, '0')
    const mes = dmy[2].padStart(2, '0')
    return `${dmy[3]}-${mes}-${dia}`
  }

  return s
}

/** Fecha de hoy como `YYYY-MM-DD` en hora local (no UTC). */
export function hoyISO(): string {
  return toISODate(new Date())
}

export function formatDate(value: string | Date): string {
  if (value instanceof Date) {
    if (Number.isNaN(value.getTime())) return ''
    return value.toLocaleDateString('es-AR') // dd/mm/aaaa
  }

  const iso = fechaISO(value)
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso)
  if (m) {
    // Construimos la fecha en hora local para que no se corra un día.
    const d = new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]))
    return d.toLocaleDateString('es-AR')
  }

  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return value
  return d.toLocaleDateString('es-AR')
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
