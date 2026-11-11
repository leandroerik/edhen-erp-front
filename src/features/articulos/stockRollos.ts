import { mockStock, stockDesdeCompras } from '../../data/mock'
import type { UsoLoteStock } from '../../data/mock'
import type { Compra, UnidadTela } from '../../types'

export interface OpcionRollo {
  key: string
  stockKey: string
  loteId: string
  compraCodigo: string
  compraFecha: string
  proveedorNombre: string
  telaId: string
  telaNombre: string
  colorId: string
  colorNombre: string
  unidad: UnidadTela
  precioUnitario: number
  rollosDisponibles: number
  cantidadDisponible: number
  /** Rollos y cantidad totales del lote (para el promedio real por rollo). */
  rollosLote: number
  cantidadLote: number
}

export interface CompraRollos {
  codigo: string
  fecha: string
  proveedorNombre: string
  opciones: OpcionRollo[]
}

/** Precio vigente de un lote según las compras cargadas. */
export interface PrecioVigente {
  precioUnitario: number
  stockKey: string
  loteId: string
  compraCodigo: string
  compraFecha: string
  proveedorNombre: string
  telaNombre: string
  colorNombre: string
  unidad: UnidadTela
}

/** Referencia que guardan los artículos/encimadas sobre el lote que usaron. */
export interface TelaConReferencia {
  stockKey?: string
  loteId?: string
  compraCodigo?: string
  telaNombre: string
  colorNombre: string
}

const normalizarTexto = (valor?: string) => (valor || '').trim().toLowerCase()

function precioDesdeOpcion(opcion: OpcionRollo): PrecioVigente {
  return {
    precioUnitario: Number(opcion.precioUnitario) || 0,
    stockKey: opcion.stockKey,
    loteId: opcion.loteId,
    compraCodigo: opcion.compraCodigo,
    compraFecha: opcion.compraFecha,
    proveedorNombre: opcion.proveedorNombre,
    telaNombre: opcion.telaNombre,
    colorNombre: opcion.colorNombre,
    unidad: opcion.unidad,
  }
}

/**
 * Devuelve la opción de stock (lote) que corresponde a una tela usada por un
 * artículo o una encimada.
 *
 * Primero busca la referencia exacta guardada (`stockKey`, o
 * `compraCodigo` + `loteId`). Si el registro es viejo y no tiene referencia,
 * cae a la compra más reciente de la misma tela y color.
 */
export function buscarOpcionVigente(
  tela: TelaConReferencia,
  opciones: OpcionRollo[],
): OpcionRollo | undefined {
  if (tela.compraCodigo === 'CUSTOM') return undefined

  // 1) Referencia exacta: mismo lote (stockKey = compra-lote-tela-color).
  if (tela.stockKey) {
    const exacta = opciones.find((op) => op.stockKey === tela.stockKey)
    if (exacta) return exacta
  }

  // 2) Misma compra y lote (stockKeys viejos sin tela/color).
  if (tela.compraCodigo && tela.loteId) {
    const porLote = opciones.find(
      (op) => op.compraCodigo === tela.compraCodigo && op.loteId === tela.loteId,
    )
    if (porLote) return porLote
  }

  // 3) Misma compra y color (registros sin loteId).
  if (tela.compraCodigo) {
    const color = normalizarTexto(tela.colorNombre)
    const porCompra = opciones.find(
      (op) =>
        op.compraCodigo === tela.compraCodigo &&
        normalizarTexto(op.colorNombre) === color,
    )
    if (porCompra) return porCompra
  }

  // 4) Sin referencia: la compra más reciente de esa tela y color.
  const telaNombre = normalizarTexto(tela.telaNombre)
  const colorNombre = normalizarTexto(tela.colorNombre)
  let masReciente: OpcionRollo | undefined
  for (const opcion of opciones) {
    if (normalizarTexto(opcion.telaNombre) !== telaNombre) continue
    if (normalizarTexto(opcion.colorNombre) !== colorNombre) continue
    if (
      !masReciente ||
      String(opcion.compraFecha) > String(masReciente.compraFecha)
    ) {
      masReciente = opcion
    }
  }
  return masReciente
}

/** Promedio real de metros/kilos por rollo según el lote completo. */
export function promedioPorRollo(opcion: OpcionRollo): number {
  if (opcion.rollosLote > 0) return opcion.cantidadLote / opcion.rollosLote
  if (opcion.rollosDisponibles > 0) {
    return opcion.cantidadDisponible / opcion.rollosDisponibles
  }
  return 0
}

/** Precio actual del lote que usó un artículo o una encimada. */
export function buscarPrecioVigente(
  tela: TelaConReferencia,
  opciones: OpcionRollo[],
): PrecioVigente | undefined {
  const opcion = buscarOpcionVigente(tela, opciones)
  return opcion && (Number(opcion.precioUnitario) || 0) > 0
    ? precioDesdeOpcion(opcion)
    : undefined
}

export function comprasDesdeStock(
  comprasPersonalizadas?: Compra[],
  usos?: UsoLoteStock[],
): CompraRollos[] {
  const stockFuente = comprasPersonalizadas && comprasPersonalizadas.length > 0
    ? stockDesdeCompras(comprasPersonalizadas, usos)
    : mockStock
  const compras = new Map<string, CompraRollos>()

  for (const stock of stockFuente) {
    for (const lote of stock.lotesDetalle) {
      const key = `${lote.compraCodigo}-${lote.loteId}-${stock.telaId}-${stock.colorId}`
      const opcion: OpcionRollo = {
        key,
        stockKey: key,
        loteId: lote.loteId,
        compraCodigo: lote.compraCodigo,
        compraFecha: lote.fechaCompra,
        proveedorNombre: lote.proveedorNombre,
        telaId: stock.telaId,
        telaNombre: stock.telaNombre,
        colorId: stock.colorId,
        colorNombre: stock.colorNombre,
        unidad: stock.unidad,
        precioUnitario: Number(lote.precioUnitario ?? stock.precioUnitario) || 0,
        rollosDisponibles: Math.max(0, lote.rollos - (lote.usadoRollos || 0)),
        cantidadDisponible: Math.max(0, lote.cantidad - (lote.usadoCantidad || 0)),
        rollosLote: Number(lote.rollos) || 0,
        cantidadLote: Number(lote.cantidad) || 0,
      }

      const compra = compras.get(lote.compraCodigo)
      if (compra) compra.opciones.push(opcion)
      else
        compras.set(lote.compraCodigo, {
          codigo: lote.compraCodigo,
          fecha: lote.fechaCompra,
          proveedorNombre: lote.proveedorNombre,
          opciones: [opcion],
        })
    }
  }

  const lista = Array.from(compras.values())
  lista.sort((a, b) => (b.fecha || '').localeCompare(a.fecha || ''))
  return lista
}

export const COMPRAS_ROLLOS = comprasDesdeStock()
