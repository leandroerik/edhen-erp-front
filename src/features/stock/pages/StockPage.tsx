import { useState, useMemo } from 'react'
import { Money } from '../../../shared/components/Money'
import { Pagination } from '../../../shared/components/Pagination'
import { StockIndicator } from '../../../shared/components/StockIndicator'
import { formatDate } from '../../../utils/format'
import {
  formatCantidad,
  getStockInfo,
  NIVEL_STOCK_BADGE,
  NIVEL_STOCK_LABEL,
  type NivelStock,
} from '../../../utils/stock'
import { stockDesdeCompras, usosStockDesdeDatos } from '../../../data/mock'
import { useErpStore } from '../../../data/erpStore'

const th = 'px-4 py-2.5 text-xs font-semibold uppercase tracking-wide text-stone-500'
const thRight = `${th} text-right`
const td = 'px-4 py-2.5 text-sm text-stone-900'
const tdRight = `${td} text-right tabular-nums`

const FILAS_POR_PAGINA = 10

export function StockPage() {
  const totalInvertido = 936300 // mock
  const dolares = 936300 / 1200 // cotización editable mock
  const stockValorizado = (41.5 - 14.4) * 13400 + 28.0 * 13400
  const cortesEnTaller = 1
  const cortesAtrasados = 0
  const totalAPagar = 54000 - 20000

  const [busqueda, setBusqueda] = useState('')
  const [soloBajoStock, setSoloBajoStock] = useState(false)
  const [paginaStock, setPaginaStock] = useState(1)
  const [filasStock, setFilasStock] = useState(FILAS_POR_PAGINA)
  const [paginaLotes, setPaginaLotes] = useState(1)
  const [filasLotes, setFilasLotes] = useState(FILAS_POR_PAGINA)

  const texto = busqueda.trim().toLowerCase()

  const { compras, encimadas, articulos } = useErpStore()
  const usosStock = useMemo(
    () => usosStockDesdeDatos(encimadas, articulos),
    [encimadas, articulos],
  )
  const stockFuente = useMemo(
    () => stockDesdeCompras(compras, usosStock),
    [compras, usosStock],
  )

  const stockConNivel = useMemo(() => {
    return stockFuente.map((stock) => ({
      ...stock,
      info: getStockInfo(stock.compradoCantidad, stock.usadoCantidad),
    }))
  }, [stockFuente])

  const stockFiltrado = stockConNivel
    .filter((stock) => {
      if (soloBajoStock && stock.info.nivel === 'OK') return false
      if (!texto) return true
      return `${stock.telaNombre} ${stock.colorNombre}`
        .toLowerCase()
        .includes(texto)
    })
    .sort((a, b) => {
      const diff = a.info.disponiblePct - b.info.disponiblePct
      if (diff !== 0) return diff
      return `${a.telaNombre} ${a.colorNombre}`.localeCompare(
        `${b.telaNombre} ${b.colorNombre}`,
      )
    })

  const totalPaginasStock = Math.max(
    1,
    Math.ceil(stockFiltrado.length / filasStock),
  )
  const paginaStockActual = Math.min(Math.max(1, paginaStock), totalPaginasStock)
  const indiceStock = (paginaStockActual - 1) * filasStock
  const stockPaginado = stockFiltrado.slice(
    indiceStock,
    indiceStock + filasStock,
  )

  const lotes = useMemo(() => {
    return stockFuente.flatMap((stock) =>
      stock.lotesDetalle.map((lote) => ({
        ...lote,
        unidad: stock.unidad,
        telaNombre: stock.telaNombre,
        colorNombre: stock.colorNombre,
        info: getStockInfo(lote.cantidad, lote.usadoCantidad),
      })),
    )
  }, [stockFuente])

  const lotesFiltrados = lotes.filter((lote) => {
    if (soloBajoStock && lote.info.nivel === 'OK') return false
    if (!texto) return true
    return `${lote.compraCodigo} ${lote.proveedorNombre} ${lote.telaNombre} ${lote.colorNombre}`
      .toLowerCase()
      .includes(texto)
  })

  const totalPaginasLotes = Math.max(
    1,
    Math.ceil(lotesFiltrados.length / filasLotes),
  )
  const paginaLotesActual = Math.min(Math.max(1, paginaLotes), totalPaginasLotes)
  const indiceLotes = (paginaLotesActual - 1) * filasLotes
  const lotesPaginados = lotesFiltrados.slice(
    indiceLotes,
    indiceLotes + filasLotes,
  )

  const resumenNiveles = stockConNivel.reduce<Record<NivelStock, number>>(
    (acumulado, stock) => {
      acumulado[stock.info.nivel] += 1
      return acumulado
    },
    { AGOTADO: 0, CRITICO: 0, BAJO: 0, OK: 0 },
  )

  const handleBusqueda = (value: string) => {
    setBusqueda(value)
    setPaginaStock(1)
    setPaginaLotes(1)
  }

  const handleSoloBajoStock = (value: boolean) => {
    setSoloBajoStock(value)
    setPaginaStock(1)
    setPaginaLotes(1)
  }

  return (
    <div>
      <h1 className="text-2xl font-semibold text-stone-900">Stock</h1>

      <div className="mt-4 grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-6">
        <div className="rounded-lg border border-t-2 border-stone-200 border-t-amber-600/70 bg-white p-4">
          <div className="text-xs text-stone-500">Total invertido</div>
          <div className="mt-1 text-lg font-semibold text-stone-900"><Money value={totalInvertido} /></div>
          <div className="mt-0.5 text-xs text-stone-400">USD ~ ${dolares.toFixed(2)}</div>
        </div>
        <div className="rounded-lg border border-t-2 border-stone-200 border-t-amber-600/70 bg-white p-4">
          <div className="text-xs text-stone-500">Stock valorizado</div>
          <div className="mt-1 text-lg font-semibold text-stone-900"><Money value={stockValorizado} /></div>
        </div>
        <div className="rounded-lg border border-t-2 border-stone-200 border-t-amber-600/70 bg-white p-4">
          <div className="text-xs text-stone-500">Cortes en taller</div>
          <div className="mt-1 text-lg font-semibold text-stone-900">{cortesEnTaller}</div>
        </div>
        <div className="rounded-lg border border-t-2 border-stone-200 border-t-amber-600/70 bg-white p-4">
          <div className="text-xs text-stone-500">Cortes atrasados</div>
          <div className="mt-1 text-lg font-semibold text-stone-900">{cortesAtrasados}</div>
        </div>
        <div className="rounded-lg border border-t-2 border-stone-200 border-t-amber-600/70 bg-white p-4">
          <div className="text-xs text-stone-500">Total a pagar</div>
          <div className="mt-1 text-lg font-semibold text-stone-900"><Money value={totalAPagar} /></div>
        </div>
        <div className="rounded-lg border border-t-2 border-stone-200 border-t-amber-600/70 bg-white p-4">
          <label className="text-xs text-stone-500">Cotización USD</label>
          <input
            defaultValue="1200"
            className="mt-1 h-8 w-full rounded-md border border-stone-300 px-2 text-sm focus:border-amber-600 focus:outline-none"
          />
        </div>
      </div>

      <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-sm font-semibold text-stone-900">Stock por tela y color</h2>
          <p className="mt-0.5 text-xs text-stone-500">
            Ordenado por nivel disponible: primero las telas que están por agotarse.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <input
            className="h-9 w-full rounded-md border border-stone-300 bg-white px-3 text-sm focus:border-amber-600 focus:outline-none sm:w-64"
            placeholder="Buscar tela, color, compra o proveedor..."
            value={busqueda}
            onChange={(e) => handleBusqueda(e.target.value)}
          />
          <label className="inline-flex h-9 items-center gap-2 rounded-md border border-stone-300 bg-white px-3 text-xs font-medium text-stone-700">
            <input
              type="checkbox"
              checked={soloBajoStock}
              onChange={(e) => handleSoloBajoStock(e.target.checked)}
              className="accent-amber-600"
            />
            Solo bajo stock
          </label>
        </div>
      </div>

      <div className="mt-2 flex flex-wrap items-center gap-2 rounded-lg border border-stone-200 bg-white px-3 py-2 text-xs">
        <span className="font-medium text-stone-700">Estado del stock:</span>
        {(Object.keys(NIVEL_STOCK_LABEL) as NivelStock[]).map((nivel) => (
          <span
            key={nivel}
            className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 font-medium ${NIVEL_STOCK_BADGE[nivel]}`}
          >
            {NIVEL_STOCK_LABEL[nivel]}
            <strong className="tabular-nums">{resumenNiveles[nivel]}</strong>
          </span>
        ))}
        <span className="text-stone-400">
          (rojo = agotado/crítico, ámbar = bajo, verde = disponible)
        </span>
      </div>

      <div className="mt-2 overflow-x-auto rounded-lg border border-stone-200 bg-white">
        <table className="w-full divide-y divide-stone-200">
          <thead className="bg-stone-100">
            <tr>
              <th className={`${th} text-left`}>Tela</th>
              <th className={`${th} text-left`}>Color</th>
              <th className={thRight}>Comprado</th>
              <th className={thRight}>Usado</th>
              <th className={`${th} text-left`}>Disponible / nivel</th>
              <th className={thRight}>Rollos disp.</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-stone-100">
            {stockPaginado.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-12 text-center text-sm text-stone-400">
                  No hay telas para los filtros seleccionados.
                </td>
              </tr>
            ) : (
              stockPaginado.map((stock) => (
                <tr key={`${stock.telaId}-${stock.colorId}`} className="hover:bg-stone-50">
                  <td className={`${td} font-medium`}>{stock.telaNombre}</td>
                  <td className={`${td} text-stone-600`}>{stock.colorNombre}</td>
                  <td className={tdRight}>
                    {formatCantidad(stock.compradoCantidad, stock.unidad)}
                  </td>
                  <td className={tdRight}>
                    {formatCantidad(stock.usadoCantidad, stock.unidad)}
                  </td>
                  <td className={td}>
                    <StockIndicator
                      comprado={stock.compradoCantidad}
                      usado={stock.usadoCantidad}
                      unidad={stock.unidad}
                      detalle={false}
                    />
                  </td>
                  <td className={tdRight}>{stock.disponibleRollos}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className="mt-2">
        <Pagination
          page={paginaStockActual}
          pageSize={filasStock}
          totalItems={stockFiltrado.length}
          onPageChange={setPaginaStock}
          onPageSizeChange={(size) => {
            setFilasStock(size)
            setPaginaStock(1)
          }}
          itemLabel="telas/colores"
        />
      </div>

      <div className="mt-6">
        <h2 className="text-sm font-semibold text-stone-900">Detalle por lote</h2>
        <p className="mt-0.5 text-xs text-stone-500">
          Consumo acumulado de cada lote. El filtro de bajo stock también aplica acá.
        </p>
      </div>

      <div className="mt-2 overflow-x-auto rounded-lg border border-stone-200 bg-white">
        <table className="w-full divide-y divide-stone-200">
          <thead className="bg-stone-100">
            <tr>
              <th className={`${th} text-left`}>Compra</th>
              <th className={`${th} text-left`}>Fecha</th>
              <th className={`${th} text-left`}>Proveedor</th>
              <th className={`${th} text-left`}>Tela / color</th>
              <th className={thRight}>Rollos</th>
              <th className={thRight}>Cantidad</th>
              <th className={`${th} text-left`}>Consumo / nivel</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-stone-100">
            {lotesPaginados.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-4 py-10 text-center text-sm text-stone-400">
                  No hay lotes para los filtros seleccionados.
                </td>
              </tr>
            ) : (
              lotesPaginados.map((lote) => (
                <tr
                  key={`${lote.loteId}-${lote.compraCodigo}`}
                  className="hover:bg-stone-50"
                >
                  <td className={`${td} font-medium`}>{lote.compraCodigo}</td>
                  <td className={`${td} text-stone-600`}>{formatDate(lote.fechaCompra)}</td>
                  <td className={`${td} text-stone-600`}>{lote.proveedorNombre}</td>
                  <td className={td}>
                    <div className="font-medium">{lote.telaNombre}</div>
                    <div className="text-xs text-stone-500">{lote.colorNombre}</div>
                  </td>
                  <td className={tdRight}>{lote.rollos}</td>
                  <td className={tdRight}>
                    {formatCantidad(lote.cantidad, lote.unidad)}
                  </td>
                  <td className={td}>
                    <StockIndicator
                      comprado={lote.cantidad}
                      usado={lote.usadoCantidad}
                      unidad={lote.unidad}
                    />
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className="mt-2">
        <Pagination
          page={paginaLotesActual}
          pageSize={filasLotes}
          totalItems={lotesFiltrados.length}
          onPageChange={setPaginaLotes}
          onPageSizeChange={(size) => {
            setFilasLotes(size)
            setPaginaLotes(1)
          }}
          itemLabel="lotes"
        />
      </div>
    </div>
  )
}
