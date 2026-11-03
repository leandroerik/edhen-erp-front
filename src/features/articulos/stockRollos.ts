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
}

export interface CompraRollos {
  codigo: string
  fecha: string
  proveedorNombre: string
  opciones: OpcionRollo[]
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
