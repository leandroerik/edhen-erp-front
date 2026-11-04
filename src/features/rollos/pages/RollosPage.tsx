import { useState, useMemo } from 'react'
import { Button } from '../../../shared/components/Button'
import { Money } from '../../../shared/components/Money'
import { StockIndicator } from '../../../shared/components/StockIndicator'
import { formatDate } from '../../../utils/format'
import { siguienteCodigo } from '../../../utils/codigos'
import { stockDesdeCompras, usosStockDesdeDatos } from '../../../data/mock'
import { useErpStore } from '../../../data/erpStore'
import type { Compra, UnidadTela } from '../../../types'
import { NuevaCompraModal } from '../components/NuevaCompraModal'
import { CompraDetalleModal } from '../components/CompraDetalleModal'

const th = 'px-3 py-2.5 text-xs font-semibold uppercase tracking-wide text-stone-500'
const td = 'px-3 py-2.5 text-sm text-stone-900'

type SortField = 'fecha' | 'codigo' | 'total'
type SortOrder = 'desc' | 'asc'

function proveedorIdDesdeNombre(nombre: string) {
  return `prov-${nombre.trim().toLowerCase().replace(/\s+/g, '-')}`
}

export function RollosPage() {
  const { compras, encimadas, articulos, proveedores, addCompra, addProveedor } = useErpStore()
  const [open, setOpen] = useState(false)
  const [viewing, setViewing] = useState<Compra | null>(null)
  const [busqueda, setBusqueda] = useState('')
  const [sortField, setSortField] = useState<SortField>('fecha')
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc')
  const [pagina, setPagina] = useState(1)
  const [filasPorPagina, setFilasPorPagina] = useState(10)

  const usosStock = useMemo(
    () => usosStockDesdeDatos(encimadas, articulos),
    [encimadas, articulos],
  )

  const consumoPorCompra = useMemo(() => {
    const map = new Map<string, { comprado: number; usado: number; unidad: UnidadTela }>()
    const stockActual = stockDesdeCompras(compras, usosStock)
    for (const stock of stockActual) {
      for (const lote of stock.lotesDetalle) {
        const actual = map.get(lote.compraCodigo)
        if (actual) {
          actual.comprado += lote.cantidad
          actual.usado += lote.usadoCantidad
        } else {
          map.set(lote.compraCodigo, {
            comprado: lote.cantidad,
            usado: lote.usadoCantidad,
            unidad: stock.unidad,
          })
        }
      }
    }
    return map
  }, [compras, usosStock])

  const handleSort = (field: SortField) => {
    setPagina(1)
    if (sortField === field) {
      setSortOrder((prev) => (prev === 'desc' ? 'asc' : 'desc'))
    } else {
      setSortField(field)
      setSortOrder('desc')
    }
  }

  const comprasFiltradas = compras
    .filter((c) => {
      const q = busqueda.toLowerCase().trim()
      if (!q) return true
      return (
        (c.codigo || '').toLowerCase().includes(q) ||
        (c.telaNombre || '').toLowerCase().includes(q) ||
        (c.proveedorNombre || '').toLowerCase().includes(q) ||
        (c.notaRemito || '').toLowerCase().includes(q)
      )
    })
    .sort((a, b) => {
      let cmp = 0
      if (sortField === 'fecha') {
        const fA = a.fecha || ''
        const fB = b.fecha || ''
        cmp = fA.localeCompare(fB)
        if (cmp === 0) {
          cmp = (a.codigo || '').localeCompare(b.codigo || '', undefined, { numeric: true })
        }
      } else if (sortField === 'codigo') {
        cmp = (a.codigo || '').localeCompare(b.codigo || '', undefined, { numeric: true })
      } else if (sortField === 'total') {
        cmp = (Number(a.total) || 0) - (Number(b.total) || 0)
      }
      return sortOrder === 'desc' ? -cmp : cmp
    })

  // Paginación
  const totalItems = comprasFiltradas.length
  const totalPaginas = Math.max(1, Math.ceil(totalItems / filasPorPagina))
  const paginaActual = Math.min(Math.max(1, pagina), totalPaginas)
  const indiceInicio = (paginaActual - 1) * filasPorPagina
  const comprasPaginadas = comprasFiltradas.slice(indiceInicio, indiceInicio + filasPorPagina)

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl sm:text-2xl font-semibold text-stone-900">Textil / Rollos</h1>
          <p className="mt-0.5 text-xs sm:text-sm text-stone-500">
            Registro de compras de tela, rollos recibidos y stock por color.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <input
            className="h-9 w-full sm:w-48 rounded-md border border-stone-300 bg-white px-3 text-sm focus:border-amber-600 focus:outline-none"
            placeholder="Buscar compra o tela..."
            value={busqueda}
            onChange={(e) => {
              setBusqueda(e.target.value)
              setPagina(1)
            }}
          />
          <button
            type="button"
            onClick={() => {
              setSortOrder((prev) => (prev === 'desc' ? 'asc' : 'desc'))
              setPagina(1)
            }}
            className="inline-flex h-9 items-center gap-1.5 rounded-md border border-stone-300 bg-white px-3 text-xs font-medium text-stone-700 hover:bg-stone-50 transition-colors"
            title="Alternar orden ascendente / descendente"
          >
            <span>{sortOrder === 'desc' ? 'Descendente' : 'Ascendente'}</span>
            <span className="text-amber-800 font-bold">{sortOrder === 'desc' ? '↓' : '↑'}</span>
          </button>
          <Button onClick={() => setOpen(true)}>+ Nueva compra</Button>
        </div>
      </div>

      {/* Vista Mobile: Tarjetas compactas */}
      <div className="space-y-3 sm:hidden">
        {comprasPaginadas.length === 0 ? (
          <div className="rounded-lg border border-stone-200 bg-white p-6 text-center text-sm text-stone-400">
            {busqueda
              ? 'No se encontraron compras con esa búsqueda.'
              : 'No hay compras registradas.'}
          </div>
        ) : (
          comprasPaginadas.map((c) => {
            const totalRollos = (c.lotes || []).reduce(
              (a: number, l: any) => a + (Number(l.rollos) || 0),
              0,
            )
            const totalCantidad = (c.lotes || []).reduce(
              (a: number, l: any) => a + (Number(l.cantidad) || 0),
              0,
            )
            const coloresTexto = (c.lotes || [])
              .map((l: any) => `${l.colorNombre} (${l.rollos})`)
              .join(', ')
            const unidad = c.unidadCompra === 'METRO' ? 'm' : 'kg'
            const consumo = consumoPorCompra.get(c.codigo)

            return (
              <div
                key={c.id}
                onClick={() => setViewing(c)}
                className="cursor-pointer rounded-lg border border-stone-200 bg-white p-3.5 shadow-sm active:bg-stone-50 transition-colors space-y-2.5"
              >
                <div className="flex items-start justify-between gap-2 border-b border-stone-100 pb-2">
                  <span className="text-sm font-semibold text-stone-900">
                    {c.proveedorNombre}
                  </span>
                  <span className="shrink-0 font-mono text-[11px] text-stone-400">
                    {c.codigo} · {formatDate(c.fecha)}
                  </span>
                </div>

                <div>
                  <h3 className="text-sm font-semibold text-stone-900">
                    {c.telaNombre} <span className="text-xs text-stone-400 font-normal">({unidad})</span>
                  </h3>
                  <div className="text-xs text-stone-500 mt-0.5 truncate">
                    Colores: {coloresTexto || '-'}
                  </div>
                </div>

                <div className="flex items-center justify-between rounded bg-stone-50 px-2.5 py-1.5 text-xs">
                  <span className="text-stone-600">
                    <strong>{totalRollos}</strong> rollos ({totalCantidad.toFixed(1)} {unidad})
                  </span>
                  <span className="font-bold text-stone-900 text-sm">
                    <Money value={c.total} />
                  </span>
                </div>

                <div className="rounded border border-stone-200 bg-white px-2.5 py-2">
                  <StockIndicator
                    comprado={consumo?.comprado ?? totalCantidad}
                    usado={consumo?.usado ?? 0}
                    unidad={consumo?.unidad ?? c.unidadCompra}
                  />
                </div>
              </div>
            )
          })
        )}
      </div>

      {/* Vista Escritorio: Tabla con paginación */}
      <div className="hidden sm:block overflow-x-auto rounded-lg border border-stone-200 bg-white shadow-sm">
        <table className="w-full table-fixed min-w-[760px] divide-y divide-stone-200">
          <thead className="bg-stone-50">
            <tr>
              <th
                onClick={() => handleSort('fecha')}
                className={`${th} w-[12%] cursor-pointer text-left hover:bg-stone-100 select-none`}
              >
                Compra {sortField === 'fecha' ? (sortOrder === 'desc' ? '↓' : '↑') : ''}
              </th>
              <th className={`${th} w-[17%] text-left`}>Proveedor</th>
              <th className={`${th} w-[22%] text-left`}>Tela / colores</th>
              <th className={`${th} w-[13%] text-left`}>Rollos / cantidad</th>
              <th className={`${th} w-[18%] text-left`}>Consumo</th>
              <th
                onClick={() => handleSort('total')}
                className={`${th} w-[18%] cursor-pointer text-right hover:bg-stone-100 select-none`}
              >
                Total {sortField === 'total' ? (sortOrder === 'desc' ? '↓' : '↑') : ''}
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-stone-100">
            {comprasPaginadas.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-12 text-center text-sm text-stone-400">
                  {busqueda
                    ? 'No se encontraron compras con esa búsqueda.'
                    : 'No hay compras registradas.'}
                </td>
              </tr>
            ) : (
              comprasPaginadas.map((c) => {
                const totalRollos = (c.lotes || []).reduce(
                  (a: number, l: any) => a + (Number(l.rollos) || 0),
                  0,
                )
                const totalCantidad = (c.lotes || []).reduce(
                  (a: number, l: any) => a + (Number(l.cantidad) || 0),
                  0,
                )
                const coloresTexto = (c.lotes || [])
                  .map((l: any) => `${l.colorNombre} (${l.rollos})`)
                  .join(', ')
                const unidad = c.unidadCompra === 'METRO' ? 'm' : 'kg'
                const consumo = consumoPorCompra.get(c.codigo)

                return (
                  <tr
                    key={c.id}
                    onClick={() => setViewing(c)}
                    className="group cursor-pointer hover:bg-stone-50/80 transition-colors"
                  >
                    <td className={`${td} whitespace-nowrap`}>
                      <div className="font-mono text-xs font-semibold text-amber-800">
                        {c.codigo}
                      </div>
                      <div className="text-[11px] text-stone-400">{formatDate(c.fecha)}</div>
                    </td>
                    <td className={td} title={c.proveedorNombre}>
                      <div className="truncate font-medium text-stone-800">
                        {c.proveedorNombre}
                      </div>
                    </td>
                    <td className={td}>
                      <div className="truncate font-semibold text-stone-900 group-hover:text-amber-800">
                        {c.telaNombre}{' '}
                        <span className="text-xs font-normal text-stone-400">({unidad})</span>
                      </div>
                      <div
                        className="truncate text-[11px] text-stone-500"
                        title={coloresTexto || undefined}
                      >
                        {coloresTexto || 'Sin colores'}
                      </div>
                    </td>
                    <td className={`${td} text-xs text-stone-600`}>
                      <div className="font-medium text-stone-800">{totalRollos} rollos</div>
                      <div>{totalCantidad.toFixed(1)} {unidad}</div>
                    </td>
                    <td className="px-3 py-2">
                      <StockIndicator
                        comprado={consumo?.comprado ?? totalCantidad}
                        usado={consumo?.usado ?? 0}
                        unidad={consumo?.unidad ?? c.unidadCompra}
                        detalle={false}
                      />
                    </td>
                    <td className={`${td} whitespace-nowrap text-right`}>
                      <span className="text-sm font-bold text-stone-900">
                        <Money value={c.total} />
                      </span>
                    </td>
                  </tr>
                )
              })
            )}
          </tbody>
        </table>
        <div className="border-t border-stone-100 px-3 py-2.5 text-xs text-stone-400">
          Tocá una fila para ver el remito, lotes y subtotales por color.
        </div>
      </div>

      {/* Barra de paginación */}
      {totalItems > 0 && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 rounded-lg border border-stone-200 bg-white px-4 py-2.5 text-xs text-stone-600">
          <div className="flex items-center gap-3">
            <span>
              Mostrando <strong className="text-stone-900">{indiceInicio + 1}</strong> a{' '}
              <strong className="text-stone-900">
                {Math.min(indiceInicio + filasPorPagina, totalItems)}
              </strong>{' '}
              de <strong className="text-stone-900">{totalItems}</strong> compras
            </span>
            <div className="hidden sm:flex items-center gap-1.5 border-l border-stone-200 pl-3">
              <span className="text-stone-400">Por página:</span>
              {[10, 20, 50].map((num) => (
                <button
                  key={num}
                  type="button"
                  onClick={() => {
                    setFilasPorPagina(num)
                    setPagina(1)
                  }}
                  className={`rounded px-1.5 py-0.5 text-xs font-medium transition-colors ${
                    filasPorPagina === num
                      ? 'bg-stone-900 text-white'
                      : 'text-stone-600 hover:bg-stone-100'
                  }`}
                >
                  {num}
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              type="button"
              disabled={paginaActual <= 1}
              onClick={() => setPagina((prev) => Math.max(1, prev - 1))}
              className="inline-flex h-8 items-center justify-center rounded border border-stone-200 bg-white px-2.5 text-xs font-medium text-stone-700 hover:bg-stone-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              ← Anterior
            </button>

            <span className="px-2 text-xs font-semibold text-stone-800">
              {paginaActual} / {totalPaginas}
            </span>

            <button
              type="button"
              disabled={paginaActual >= totalPaginas}
              onClick={() => setPagina((prev) => Math.min(totalPaginas, prev + 1))}
              className="inline-flex h-8 items-center justify-center rounded border border-stone-200 bg-white px-2.5 text-xs font-medium text-stone-700 hover:bg-stone-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              Siguiente →
            </button>
          </div>
        </div>
      )}
      {/* Modal de Detalle */}
      {viewing && (
        <CompraDetalleModal
          compra={viewing}
          onClose={() => setViewing(null)}
        />
      )}

      {/* Modal de Alta de Compra */}
      {open && (
        <NuevaCompraModal
          open={open}
          onClose={() => setOpen(false)}
          onSave={(d) => {
            const codigo = siguienteCodigo(
              'COMP',
              compras.map((c) => c.codigo),
            )
            const lotes = (d.lotes || []).map((l: any, idx: number) => ({
              id: l.id || `lote-${Date.now()}-${idx}`,
              colorId: l.colorId || `col-${(l.colorNombre || '').toLowerCase().replace(/\s+/g, '-')}`,
              colorNombre: l.colorNombre,
              rollos: Number(l.rollos) || 0,
              cantidad: Number(l.cantidad) || 0,
              subtotal: Number(l.subtotal) || 0,
            }))
            const proveedorNombre = (d.proveedor || '').trim() || 'Proveedor'
            const proveedorExistente = proveedores.find(
              (p) => p.nombre.trim().toLowerCase() === proveedorNombre.toLowerCase(),
            )
            const proveedorId =
              proveedorExistente?.id ?? proveedorIdDesdeNombre(proveedorNombre)
            if ((d.proveedor || '').trim()) {
              addProveedor({ id: proveedorId, nombre: proveedorNombre })
            }

            const nueva = {
              id: `comp-${Date.now()}`,
              codigo,
              fecha: d.fecha,
              proveedorId,
              proveedorNombre,
              telaId: `tel-${(d.tela || '').toLowerCase().replace(/\s+/g, '-')}`,
              telaNombre: d.tela,
              unidadCompra: d.unidad,
              precioUnitario: Number(d.precioUnitario) || 0,
              lotes,
              flete: Number(d.flete) || 0,
              notaRemito: d.notaRemito,
              total: Number(d.total) || 0,
              usada: false,
            }
            addCompra(nueva)
          }}
        />
      )}
    </div>
  )
}
