/**
 * Cliente de conexión para Google Apps Script (Google Sheets Backend)
 */

export const DEFAULT_GAS_URL =
  'https://script.google.com/macros/s/AKfycbzBL772Xf91acslgh_frW1fzYB1pw1srH9NdiAKehPYpT1vqHKkfkjg9IMsMpHg5QA/exec'

export const STORAGE_KEY_GAS_URL = 'edhen_erp_gas_url'

export function getGasUrl(): string {
  if (typeof window === 'undefined') return DEFAULT_GAS_URL
  const custom = localStorage.getItem(STORAGE_KEY_GAS_URL)
  if (custom && custom.trim()) return custom.trim()
  return (import.meta.env.VITE_API_URL || DEFAULT_GAS_URL).trim()
}

export function setGasUrl(url: string) {
  if (typeof window === 'undefined') return
  localStorage.setItem(STORAGE_KEY_GAS_URL, url.trim())
}

export function resetGasUrl() {
  if (typeof window === 'undefined') return
  localStorage.removeItem(STORAGE_KEY_GAS_URL)
}

export interface ConnectionTestResult {
  ok: boolean
  statusText?: string
  latencyMs: number
  dataCount?: {
    articulos: number
    cortes: number
    encimadas: number
    compras: number
    talleres: number
    pagos: number
  }
  error?: string
}

export async function testGasConnection(url?: string): Promise<ConnectionTestResult> {
  const target = (url || getGasUrl()).trim()
  if (!target) {
    return { ok: false, latencyMs: 0, error: 'URL no configurada' }
  }

  const start = performance.now()
  try {
    const res = await fetch(`${target}?action=bootstrap`, {
      method: 'GET',
      mode: 'cors',
      cache: 'no-cache',
    })

    const latencyMs = Math.round(performance.now() - start)

    if (!res.ok) {
      return {
        ok: false,
        latencyMs,
        error: `HTTP ${res.status}: ${res.statusText}`,
      }
    }

    const json = await res.json()
    if (!json.success || !json.data) {
      return {
        ok: false,
        latencyMs,
        error: json.error || 'Respuesta inválida de Google Apps Script',
      }
    }

    const d = json.data
    return {
      ok: true,
      latencyMs,
      statusText: 'Conexión activa con Google Sheets',
      dataCount: {
        articulos: Array.isArray(d.articulos) ? d.articulos.length : 0,
        cortes: Array.isArray(d.cortes) ? d.cortes.length : 0,
        encimadas: Array.isArray(d.encimadas) ? d.encimadas.length : 0,
        compras: Array.isArray(d.compras) ? d.compras.length : 0,
        talleres: Array.isArray(d.talleres) ? d.talleres.length : 0,
        pagos: Array.isArray(d.pagos) ? d.pagos.length : 0,
      },
    }
  } catch (err: any) {
    const latencyMs = Math.round(performance.now() - start)
    return {
      ok: false,
      latencyMs,
      error:
        err.message ||
        'No se pudo conectar. Verificá que la implementación esté con acceso "Cualquiera".',
    }
  }
}

export async function fetchGasBootstrap() {
  const url = getGasUrl()
  if (!url) return null

  try {
    const res = await fetch(`${url}?action=bootstrap&_t=${Date.now()}`, {
      method: 'GET',
      mode: 'cors',
      cache: 'no-cache',
    })
    if (!res.ok) return null
    const json = await res.json()
    return json.success && json.data ? json.data : null
  } catch (err) {
    console.error('Error fetching bootstrap from Google Sheets:', err)
    return null
  }
}

/**
 * Envía datos a Google Apps Script evitando el preflight CORS de OPTIONS
 * usando Content-Type: text/plain;charset=utf-8
 */
export async function postGasAction(action: string, payload: any): Promise<boolean> {
  const url = getGasUrl()
  if (!url) return false

  try {
    const res = await fetch(url, {
      method: 'POST',
      mode: 'cors',
      headers: {
        'Content-Type': 'text/plain;charset=utf-8',
      },
      body: JSON.stringify({ action, payload }),
    })
    if (!res.ok) return false
    const json = await res.json()
    return !!json.success
  } catch (err) {
    console.error('Error enviando a Google Sheets:', err)
    return false
  }
}

export type EntidadLote =
  | 'articulo'
  | 'encimada'
  | 'corte'
  | 'compra'
  | 'pago'
  | 'taller'
  | 'proveedor'

/**
 * Guarda varios registros de la misma entidad en un solo request.
 * Devuelve false si la versión deployada de Apps Script no lo soporta,
 * para que el llamador pueda reintentar uno por uno.
 */
export async function postGasBatch(
  entidad: EntidadLote,
  registros: unknown[],
): Promise<boolean> {
  if (registros.length === 0) return true
  return postGasAction('guardarVarios', { entidad, registros })
}

