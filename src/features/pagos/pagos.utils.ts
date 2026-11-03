import type { Corte, PagoTaller, TipoPagoTaller } from '../../types'

export type EstadoPagoCorte = 'PENDIENTE' | 'PARCIAL' | 'PAGADO' | 'A_FAVOR'

export interface ResumenPagoCorte {
  total: number
  pagado: number
  saldo: number
  estado: EstadoPagoCorte
  pagos: PagoTaller[]
}

export interface ResumenPagoTaller {
  tallerId: string
  tallerNombre: string
  cortes: number
  total: number
  pagado: number
  saldo: number
}

export const ESTADO_PAGO_LABEL: Record<EstadoPagoCorte, string> = {
  PENDIENTE: 'Pendiente',
  PARCIAL: 'Parcial',
  PAGADO: 'Pagado',
  A_FAVOR: 'A favor',
}

export const ESTADO_PAGO_STYLES: Record<EstadoPagoCorte, string> = {
  PENDIENTE: 'border-amber-300 bg-amber-100 text-amber-800',
  PARCIAL: 'border-sky-300 bg-sky-100 text-sky-800',
  PAGADO: 'border-emerald-300 bg-emerald-100 text-emerald-800',
  A_FAVOR: 'border-violet-300 bg-violet-100 text-violet-800',
}

export const TIPO_PAGO_LABEL: Record<TipoPagoTaller, string> = {
  ADELANTO: 'Adelanto',
  PARCIAL: 'Parcial',
  FINAL: 'Final',
}

export const TIPO_PAGO_STYLES: Record<TipoPagoTaller, string> = {
  ADELANTO: 'border-amber-300 bg-amber-50 text-amber-800',
  PARCIAL: 'border-sky-300 bg-sky-50 text-sky-800',
  FINAL: 'border-emerald-300 bg-emerald-50 text-emerald-800',
}

export function totalManoObraCorte(corte: Corte): number {
  return (Number(corte.cantidadPrendas) || 0) * (Number(corte.precioPorPrenda) || 0)
}

export function pagosDeCorte(pagos: PagoTaller[], corteId: string): PagoTaller[] {
  return pagos.filter((pago) => pago.corteId === corteId)
}

export function resumenPagoCorte(corte: Corte, pagos: PagoTaller[]): ResumenPagoCorte {
  const total = totalManoObraCorte(corte)
  const pagosCorte = pagosDeCorte(pagos, corte.id)
  const pagado = pagosCorte.reduce((acumulado, pago) => acumulado + (Number(pago.monto) || 0), 0)
  const saldo = total - pagado

  let estado: EstadoPagoCorte
  if (pagado <= 0) {
    estado = 'PENDIENTE'
  } else if (Math.abs(saldo) < 0.005) {
    estado = 'PAGADO'
  } else if (saldo > 0) {
    estado = 'PARCIAL'
  } else {
    estado = 'A_FAVOR'
  }

  return { total, pagado, saldo, estado, pagos: pagosCorte }
}

export function resumenPagosPorTaller(
  cortes: Corte[],
  pagos: PagoTaller[],
): ResumenPagoTaller[] {
  const porTaller = new Map<string, ResumenPagoTaller>()

  for (const corte of cortes) {
    const resumen = resumenPagoCorte(corte, pagos)
    const actual = porTaller.get(corte.tallerId) ?? {
      tallerId: corte.tallerId,
      tallerNombre: corte.tallerNombre,
      cortes: 0,
      total: 0,
      pagado: 0,
      saldo: 0,
    }

    actual.cortes += 1
    actual.total += resumen.total
    actual.pagado += resumen.pagado
    actual.saldo += resumen.saldo
    porTaller.set(corte.tallerId, actual)
  }

  return Array.from(porTaller.values()).sort((a, b) =>
    a.tallerNombre.localeCompare(b.tallerNombre),
  )
}

export function tipoPagoSugerido(pagosCorte: PagoTaller[]): TipoPagoTaller {
  return pagosCorte.length === 0 ? 'ADELANTO' : 'PARCIAL'
}
