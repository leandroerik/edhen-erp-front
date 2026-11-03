import type { UnidadTela } from '../types'

export type NivelStock = 'AGOTADO' | 'CRITICO' | 'BAJO' | 'OK'

export interface StockInfo {
  nivel: NivelStock
  label: string
  comprado: number
  usado: number
  disponible: number
  consumidoPct: number
  disponiblePct: number
  badgeClass: string
  barClass: string
}

export const NIVEL_STOCK_LABEL: Record<NivelStock, string> = {
  AGOTADO: 'Agotado',
  CRITICO: 'Crítico',
  BAJO: 'Bajo',
  OK: 'Disponible',
}

export const NIVEL_STOCK_BADGE: Record<NivelStock, string> = {
  AGOTADO: 'border-red-300 bg-red-50 text-red-700',
  CRITICO: 'border-orange-300 bg-orange-50 text-orange-700',
  BAJO: 'border-amber-300 bg-amber-50 text-amber-800',
  OK: 'border-emerald-300 bg-emerald-50 text-emerald-700',
}

export const NIVEL_STOCK_BAR: Record<NivelStock, string> = {
  AGOTADO: 'bg-red-500',
  CRITICO: 'bg-orange-500',
  BAJO: 'bg-amber-500',
  OK: 'bg-emerald-500',
}

export function getStockInfo(comprado: number, usado: number): StockInfo {
  const compradoSeguro = Math.max(0, Number(comprado) || 0)
  const usadoSeguro = Math.max(
    0,
    Math.min(compradoSeguro, Number(usado) || 0),
  )
  const disponible = Math.max(0, compradoSeguro - usadoSeguro)
  const disponiblePct = compradoSeguro > 0 ? disponible / compradoSeguro : 0
  const consumidoPct = compradoSeguro > 0 ? usadoSeguro / compradoSeguro : 0

  const nivel: NivelStock =
    disponible <= 0.005
      ? 'AGOTADO'
      : disponiblePct < 0.15
        ? 'CRITICO'
        : disponiblePct < 0.35
          ? 'BAJO'
          : 'OK'

  return {
    nivel,
    label: NIVEL_STOCK_LABEL[nivel],
    comprado: compradoSeguro,
    usado: usadoSeguro,
    disponible,
    consumidoPct,
    disponiblePct,
    badgeClass: NIVEL_STOCK_BADGE[nivel],
    barClass: NIVEL_STOCK_BAR[nivel],
  }
}

export function formatCantidad(cantidad: number, unidad: UnidadTela): string {
  return `${cantidad.toFixed(1)} ${unidad === 'METRO' ? 'm' : 'kg'}`
}
