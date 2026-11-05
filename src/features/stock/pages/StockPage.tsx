import { useState, useMemo, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Money } from '../../../shared/components/Money'
import { Pagination } from '../../../shared/components/Pagination'
import { StockIndicator } from '../../../shared/components/StockIndicator'
import {
  formatCantidad,
  formatRollos,
  getStockInfo,
  NIVEL_STOCK_BADGE,
  NIVEL_STOCK_LABEL,
  type NivelStock,
} from '../../../utils/stock'
import { stockDesdeCompras, usosStockDesdeDatos } from '../../../data/mock'
import { useErpStore } from '../../../data/erpStore'
import { resumenPagoCorte } from '../../pagos/pagos.utils'
import type { UnidadTela } from '../../../types'

const th = 'px-4 py-2.5 text-xs font-semibold uppercase tracking-wide text-stone-500'
const thRight = `${th} text-right`
const td = 'px-4 py-3 text-sm text-stone-900'
const tdRight = `${td} text-right tabular-nums`

const FILAS_POR_PAGINA = 8
const DOLAR_STORAGE_KEY = 'edhen_erp_cotizacion_dolar'

interface StockGeneralTela {
  telaId: string
  telaNombre: string
  unidad: UnidadTela
  compradoCantidad: number
  compradoRollos: number
  usadoCantidad: number
  usadoRollos: number
  disponibleCantidad: number
  disponibleRollos: number
  coloresCount: number
  coloresNombres: string[]
  valorizadoPesos: number
  info: ReturnType<typeof getStockInfo>
}

// Generador de curvas Bezier suaves (smooth cardinal spline)
function generarCurvaSuave(puntos: Array<{ x: number; y: number }>): string {
  if (puntos.length === 0) return ''
  if (puntos.length === 1) return `M ${puntos[0].x} ${puntos[0].y}`
  if (puntos.length === 2) {
    return `M ${puntos[0].x} ${puntos[0].y} L ${puntos[1].x} ${puntos[1].y}`
  }

  let d = `M ${puntos[0].x} ${puntos[0].y}`
  for (let i = 0; i < puntos.length - 1; i++) {
    const p0 = puntos[i === 0 ? 0 : i - 1]
    const p1 = puntos[i]
    const p2 = puntos[i + 1]
    const p3 = puntos[i + 2] || p2

    const tension = 0.2
    const cp1x = p1.x + (p2.x - p0.x) * tension
    const cp1y = p1.y + (p2.y - p0.y) * tension
    const cp2x = p2.x - (p3.x - p1.x) * tension
    const cp2y = p2.y - (p3.y - p1.y) * tension

    d += ` C ${cp1x.toFixed(1)} ${cp1y.toFixed(1)}, ${cp2x.toFixed(1)} ${cp2y.toFixed(1)}, ${p2.x.toFixed(1)} ${p2.y.toFixed(1)}`
  }
  return d
}

export function StockPage() {
  const { compras, encimadas, articulos, cortes, pagos } = useErpStore()

  // Cotización USD persistida en localStorage
  const [cotizacionDolar, setCotizacionDolar] = useState<number>(() => {
    try {
      const guardado = localStorage.getItem(DOLAR_STORAGE_KEY)
      if (guardado) {
        const val = parseFloat(guardado)
        if (!isNaN(val) && val > 0) return val
      }
    } catch {
      // fallback
    }
    return 1200
  })

  const [inputDolar, setInputDolar] = useState(cotizacionDolar.toString())

  useEffect(() => {
    try {
      localStorage.setItem(DOLAR_STORAGE_KEY, cotizacionDolar.toString())
    } catch (e) {
      console.error('Error guardando cotización dólar', e)
    }
  }, [cotizacionDolar])

  const handleDolarChange = (valStr: string) => {
    setInputDolar(valStr)
    const val = parseFloat(valStr)
    if (!isNaN(val) && val > 0) {
      setCotizacionDolar(val)
    }
  }

  // Stock detallado y agregado
  const usosStock = useMemo(
    () => usosStockDesdeDatos(encimadas, articulos),
    [encimadas, articulos],
  )

  const stockFuente = useMemo(
    () => stockDesdeCompras(compras, usosStock),
    [compras, usosStock],
  )

  // Stock General agrupado por TELA (sin separar por color)
  const stockPorTela = useMemo<StockGeneralTela[]>(() => {
    const mapa = new Map<string, {
      telaId: string
      telaNombre: string
      unidad: UnidadTela
      compradoCantidad: number
      compradoRollos: number
      usadoCantidad: number
      usadoRollos: number
      colores: Set<string>
      valorizadoPesos: number
    }>()

    for (const item of stockFuente) {
      const actual = mapa.get(item.telaId) || {
        telaId: item.telaId,
        telaNombre: item.telaNombre,
        unidad: item.unidad,
        compradoCantidad: 0,
        compradoRollos: 0,
        usadoCantidad: 0,
        usadoRollos: 0,
        colores: new Set<string>(),
        valorizadoPesos: 0,
      }

      actual.compradoCantidad += item.compradoCantidad
      actual.compradoRollos += item.compradoRollos
      actual.usadoCantidad += item.usadoCantidad
      actual.usadoRollos += item.usadoRollos
      if (item.colorNombre) actual.colores.add(item.colorNombre)

      for (const lote of item.lotesDetalle) {
        const cantLoteRestante = Math.max(0, lote.cantidad - (lote.usadoCantidad || 0))
        actual.valorizadoPesos += cantLoteRestante * (lote.precioUnitario || item.precioUnitario || 0)
      }

      mapa.set(item.telaId, actual)
    }

    return Array.from(mapa.values()).map((t) => {
      const dispCant = Math.max(0, t.compradoCantidad - t.usadoCantidad)
      const dispRollos = Math.max(0, t.compradoRollos - t.usadoRollos)
      return {
        telaId: t.telaId,
        telaNombre: t.telaNombre,
        unidad: t.unidad,
        compradoCantidad: t.compradoCantidad,
        compradoRollos: t.compradoRollos,
        usadoCantidad: t.usadoCantidad,
        usadoRollos: t.usadoRollos,
        disponibleCantidad: dispCant,
        disponibleRollos: dispRollos,
        coloresCount: t.colores.size,
        coloresNombres: Array.from(t.colores),
        valorizadoPesos: t.valorizadoPesos,
        info: getStockInfo(t.compradoCantidad, t.usadoCantidad),
      }
    })
  }, [stockFuente])

  // KPIs reales
  const totalInvertidoCompras = useMemo(
    () => compras.reduce((acc, c) => acc + (Number(c.total) || 0), 0),
    [compras],
  )

  const stockValorizadoTotal = useMemo(
    () => stockPorTela.reduce((acc, t) => acc + t.valorizadoPesos, 0),
    [stockPorTela],
  )

  const cortesEnTaller = useMemo(
    () => cortes.filter((c) => c.estado === 'EN_TALLER').length,
    [cortes],
  )

  const cortesAtrasados = useMemo(
    () => cortes.filter((c) => c.atrasado || (c.estado === 'EN_TALLER' && c.fechaEntregaPrometida && new Date(c.fechaEntregaPrometida) < new Date())).length,
    [cortes],
  )

  const totalAPagarTalleres = useMemo(() => {
    return cortes.reduce((acc, corte) => {
      const res = resumenPagoCorte(corte, pagos)
      return acc + (res.saldo > 0 ? res.saldo : 0)
    }, 0)
  }, [cortes, pagos])

  // Filtros tabla de stock por tela
  const [busqueda, setBusqueda] = useState('')
  const [soloBajoStock, setSoloBajoStock] = useState(false)
  const [paginaStock, setPaginaStock] = useState(1)
  const [filasStock, setFilasStock] = useState(FILAS_POR_PAGINA)

  const texto = busqueda.trim().toLowerCase()

  const stockFiltrado = useMemo(() => {
    return stockPorTela
      .filter((s) => {
        if (soloBajoStock && s.info.nivel === 'OK') return false
        if (!texto) return true
        return s.telaNombre.toLowerCase().includes(texto) ||
          s.coloresNombres.some((c) => c.toLowerCase().includes(texto))
      })
      .sort((a, b) => {
        const diff = a.info.disponiblePct - b.info.disponiblePct
        if (diff !== 0) return diff
        return a.telaNombre.localeCompare(b.telaNombre)
      })
  }, [stockPorTela, soloBajoStock, texto])

  const totalPaginasStock = Math.max(1, Math.ceil(stockFiltrado.length / filasStock))
  const paginaStockActual = Math.min(Math.max(1, paginaStock), totalPaginasStock)
  const indiceStock = (paginaStockActual - 1) * filasStock
  const stockPaginado = stockFiltrado.slice(indiceStock, indiceStock + filasStock)

  const resumenNiveles = useMemo(() => {
    return stockPorTela.reduce<Record<NivelStock, number>>(
      (acc, s) => {
        acc[s.info.nivel] += 1
        return acc
      },
      { AGOTADO: 0, CRITICO: 0, BAJO: 0, OK: 0 },
    )
  }, [stockPorTela])

  // -------------------------------------------------------------
  // ANÁLISIS POR TELA: VENTA, GANANCIA Y COSTO (Curvas suaves)
  // -------------------------------------------------------------
  const telasAnalisis = useMemo(() => {
    const mapa = new Map<string, { telaNombre: string; costo: number; venta: number; ganancia: number }>()

    for (const compra of compras) {
      const actual = mapa.get(compra.telaNombre) || {
        telaNombre: compra.telaNombre,
        costo: 0,
        venta: 0,
        ganancia: 0,
      }
      actual.costo += Number(compra.total) || 0
      mapa.set(compra.telaNombre, actual)
    }

    for (const art of articulos) {
      const prendas = Number(art.cantidadPrendas) || 0
      const ventaArt = (Number(art.precioVenta) || 0) * prendas
      const gananciaArt = Number(art.gananciaTotal) || (Number(art.gananciaUnitaria || 0) * prendas)

      for (const t of art.telas || []) {
        const actual = mapa.get(t.telaNombre) || {
          telaNombre: t.telaNombre,
          costo: 0,
          venta: 0,
          ganancia: 0,
        }
        const fraccion = 1 / Math.max(1, art.telas.length)
        actual.venta += ventaArt * fraccion
        actual.ganancia += gananciaArt * fraccion
        mapa.set(t.telaNombre, actual)
      }
    }

    return Array.from(mapa.values())
      .filter((t) => t.costo > 0 || t.venta > 0)
      .sort((a, b) => b.ganancia - a.ganancia)
  }, [compras, articulos])

  // Dimensiones del gráfico profesional
  const maxGrafico = useMemo(() => {
    let max = 1000
    for (const t of telasAnalisis) {
      max = Math.max(max, t.costo, t.venta, t.ganancia)
    }
    return max * 1.2
  }, [telasAnalisis])

  const [hoverIndex, setHoverIndex] = useState<number | null>(null)
  const [pinnedIndices, setPinnedIndices] = useState<number[]>([])

  const togglePin = (idx: number) => {
    setPinnedIndices((prev) =>
      prev.includes(idx) ? prev.filter((i) => i !== idx) : [...prev, idx]
    )
  }

  const svgWidth = 840
  const svgHeight = 280
  const padLeft = 85
  const padRight = 45
  const padTop = 30
  const padBottom = 65
  const chartW = svgWidth - padLeft - padRight
  const chartH = svgHeight - padTop - padBottom

  const puntosTelas = useMemo(() => {
    const total = telasAnalisis.length
    if (total === 0) return []

    return telasAnalisis.map((item, idx) => {
      const x = total > 1 ? padLeft + (idx / (total - 1)) * chartW : padLeft + chartW / 2
      const yCosto = padTop + chartH - (item.costo / (maxGrafico || 1)) * chartH
      const yVenta = padTop + chartH - (item.venta / (maxGrafico || 1)) * chartH
      const yGanancia = padTop + chartH - (item.ganancia / (maxGrafico || 1)) * chartH

      return {
        ...item,
        x,
        yCosto,
        yVenta,
        yGanancia,
      }
    })
  }, [telasAnalisis, maxGrafico, chartW, chartH])

  const curvaVenta = useMemo(
    () => generarCurvaSuave(puntosTelas.map((p) => ({ x: p.x, y: p.yVenta }))),
    [puntosTelas],
  )
  const curvaGanancia = useMemo(
    () => generarCurvaSuave(puntosTelas.map((p) => ({ x: p.x, y: p.yGanancia }))),
    [puntosTelas],
  )
  const curvaCosto = useMemo(
    () => generarCurvaSuave(puntosTelas.map((p) => ({ x: p.x, y: p.yCosto }))),
    [puntosTelas],
  )

  const areaGanancia = useMemo(() => {
    if (puntosTelas.length === 0) return ''
    const baseLine = padTop + chartH
    const firstX = puntosTelas[0].x
    const lastX = puntosTelas[puntosTelas.length - 1].x
    return `${curvaGanancia} L ${lastX} ${baseLine} L ${firstX} ${baseLine} Z`
  }, [curvaGanancia, puntosTelas, chartH])

  return (
    <div className="space-y-6">
      {/* Cabecera */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-semibold text-stone-900 sm:text-2xl">Resumen</h1>
          <p className="mt-0.5 text-xs text-stone-500 sm:text-sm">
            Métricas clave de taller, rendimiento por tela y valorización de inventario.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Link
            to="/cortes"
            className="inline-flex items-center justify-center gap-2 rounded-md border border-stone-300 bg-white px-4 py-2 text-sm font-medium text-stone-700 transition-colors hover:bg-stone-50"
          >
            <span>Cortes</span>
            {cortesEnTaller > 0 && (
              <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-semibold text-amber-800">
                {cortesEnTaller} en taller
              </span>
            )}
          </Link>
          <Link
            to="/pagos"
            className="inline-flex items-center justify-center gap-2 rounded-md bg-amber-700 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-amber-800"
          >
            <span>Pagos</span>
            {totalAPagarTalleres > 0 && (
              <span className="rounded-full bg-white/20 px-2 py-0.5 text-[10px] font-semibold text-white">
                Saldo <Money value={totalAPagarTalleres} />
              </span>
            )}
          </Link>
        </div>
      </div>

      {/* Tarjetas KPI */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        {/* Total Invertido */}
        <div className="rounded-xl border border-t-2 border-stone-200 border-t-amber-600/70 bg-white p-3 shadow-sm sm:p-3.5">
          <div className="text-xs font-medium text-stone-500">Total invertido</div>
          <div className="mt-1 text-lg font-semibold text-stone-900">
            <Money value={totalInvertidoCompras} />
          </div>
          <div className="mt-0.5 text-xs text-stone-500">
            USD ≈ ${(totalInvertidoCompras / (cotizacionDolar || 1)).toFixed(0)}
          </div>
        </div>

        {/* Stock valorizado */}
        <div className="rounded-xl border border-t-2 border-stone-200 border-t-emerald-600/70 bg-white p-3 shadow-sm sm:p-3.5">
          <div className="text-xs font-medium text-stone-500">Stock valorizado</div>
          <div className="mt-1 text-lg font-semibold text-stone-900">
            <Money value={stockValorizadoTotal} />
          </div>
          <div className="mt-0.5 text-xs font-medium text-emerald-700">
            USD ≈ ${(stockValorizadoTotal / (cotizacionDolar || 1)).toFixed(0)}
          </div>
        </div>

        {/* Cortes en taller */}
        <div className="rounded-xl border border-t-2 border-stone-200 border-t-stone-400/70 bg-white p-3 shadow-sm sm:p-3.5">
          <div className="text-xs font-medium text-stone-500">Cortes en taller</div>
          <div className="mt-1 flex items-baseline gap-2">
            <span className="text-lg font-semibold text-stone-900">{cortesEnTaller}</span>
            <span className="text-xs text-stone-500">activos</span>
          </div>
          <div className="mt-0.5 text-xs text-stone-500">
            <Link to="/cortes" className="text-amber-700 hover:underline">Ir a cortes →</Link>
          </div>
        </div>

        {/* Cortes atrasados */}
        <div className="rounded-xl border border-t-2 border-stone-200 border-t-rose-500/70 bg-white p-3 shadow-sm sm:p-3.5">
          <div className="text-xs font-medium text-stone-500">Cortes atrasados</div>
          <div className="mt-1 text-lg font-semibold text-rose-600">{cortesAtrasados}</div>
          <div className="mt-0.5 text-xs text-stone-500">
            {cortesAtrasados > 0 ? 'Con demora' : 'Todo al día'}
          </div>
        </div>

        {/* Total a pagar talleres */}
        <div className="rounded-xl border border-t-2 border-stone-200 border-t-amber-600/70 bg-white p-3 shadow-sm sm:p-3.5">
          <div className="text-xs font-medium text-stone-500">Saldo a pagar</div>
          <div className="mt-1 text-lg font-semibold text-stone-900">
            <Money value={totalAPagarTalleres} />
          </div>
          <div className="mt-0.5 text-xs text-stone-500">
            <Link to="/pagos" className="text-amber-700 hover:underline">Ir a pagos →</Link>
          </div>
        </div>

        {/* Cotización Dólar Persistida */}
        <div className="rounded-xl border border-t-2 border-stone-200 border-t-stone-400/70 bg-white p-3 shadow-sm sm:p-3.5">
          <label className="block text-xs font-medium text-stone-500">Cotización USD</label>
          <div className="mt-1 flex items-center gap-1.5">
            <span className="text-xs font-semibold text-stone-400">$</span>
            <input
              type="number"
              min={1}
              value={inputDolar}
              onChange={(e) => handleDolarChange(e.target.value)}
              className="h-8 w-full rounded border border-stone-300 bg-white px-2 text-sm font-semibold text-stone-900 focus:border-amber-600 focus:outline-none"
              placeholder="1200"
            />
          </div>
          <div className="mt-0.5 text-[10px] text-stone-400">Guardado automático</div>
        </div>
      </div>

      {/* Gráfico: rentabilidad por tela */}
      <div className="rounded-xl border border-stone-200 bg-white p-4 shadow-sm sm:p-5">
        <div className="flex flex-col gap-3 border-b border-stone-100 pb-3.5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-base font-semibold text-stone-900">
              Rentabilidad por tela
            </h2>
            <p className="mt-0.5 text-xs text-stone-500">
              Curvas de venta, costo y ganancia neta estimada por tipo de tela.
            </p>
          </div>

          {/* Leyenda */}
          <div className="flex flex-wrap items-center gap-4 text-xs">
            <div className="flex items-center gap-1.5">
              <span className="inline-block h-2 w-3 rounded-full bg-emerald-600" />
              <span className="font-medium text-stone-700">Ganancia</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="inline-block h-2 w-3 rounded-full bg-stone-600" />
              <span className="text-stone-500">Venta proyectada</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="inline-block h-2 w-3 rounded-full border border-dashed border-amber-600 bg-amber-50" />
              <span className="text-stone-500">Costo / Inversión</span>
            </div>
          </div>
        </div>

        {puntosTelas.length === 0 ? (
          <div className="py-16 text-center text-sm text-stone-400">
            No hay compras o artículos registrados para trazar las curvas.
          </div>
        ) : (
          <div className="mt-4">
            <div className="overflow-x-auto pb-2">
              <svg
                viewBox={`0 0 ${svgWidth} ${svgHeight}`}
                className="w-full min-w-[680px] h-auto overflow-visible select-none"
              >
                <defs>
                  {/* Degradé suave para el área bajo la ganancia */}
                  <linearGradient id="edhenAreaGanancia" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#059669" stopOpacity="0.16" />
                    <stop offset="85%" stopColor="#059669" stopOpacity="0.01" />
                  </linearGradient>
                </defs>

                {/* Ejes y líneas de fondo tenues */}
                {[0, 0.25, 0.5, 0.75, 1].map((pct) => {
                  const y = padTop + chartH - pct * chartH
                  const valor = Math.round(pct * maxGrafico)
                  return (
                    <g key={pct}>
                      <line
                        x1={padLeft}
                        y1={y}
                        x2={svgWidth - padRight}
                        y2={y}
                        stroke="#f5f5f4"
                        strokeWidth="1"
                      />
                      <text
                        x={padLeft - 12}
                        y={y + 3.5}
                        textAnchor="end"
                        className="text-[11px] fill-stone-400 font-mono"
                      >
                        ${valor >= 1000000 ? `${(valor / 1000000).toFixed(1)}M` : valor >= 1000 ? `${(valor / 1000).toFixed(0)}k` : valor}
                      </text>
                    </g>
                  )
                })}

                {/* Área sombreada de ganancia */}
                <path d={areaGanancia} fill="url(#edhenAreaGanancia)" />

                {/* Curva 1: Venta (Gris carbón / Stone 700) */}
                <path
                  d={curvaVenta}
                  fill="none"
                  stroke="#44403c"
                  strokeWidth="2"
                  strokeLinecap="round"
                />

                {/* Curva 2: Costo / Inversión (Ámbar / Trazo discontinuo fino) */}
                <path
                  d={curvaCosto}
                  fill="none"
                  stroke="#d97706"
                  strokeWidth="2"
                  strokeDasharray="5 4"
                  strokeLinecap="round"
                />

                {/* Curva 3: Ganancia (Verde Esmeralda sólido destacado) */}
                <path
                  d={curvaGanancia}
                  fill="none"
                  stroke="#059669"
                  strokeWidth="3.2"
                  strokeLinecap="round"
                />

                {/* Nodos y etiquetas de telas */}
                {puntosTelas.map((p, idx) => {
                  const isHovered = hoverIndex === idx
                  const isPinned = pinnedIndices.includes(idx)
                  const isActive = isHovered || isPinned
                  return (
                    <g
                      key={p.telaNombre}
                      className="cursor-pointer"
                      onClick={() => togglePin(idx)}
                      onMouseEnter={() => setHoverIndex(idx)}
                      onMouseLeave={() => setHoverIndex(null)}
                    >
                      {/* Zona invisible más amplia para hacer click/hover fácil en celular */}
                      <rect
                        x={p.x - 22}
                        y={padTop}
                        width={44}
                        height={chartH + 20}
                        fill="transparent"
                      />

                      {/* Línea vertical indicadora */}
                      {isActive && (
                        <line
                          x1={p.x}
                          y1={padTop}
                          x2={p.x}
                          y2={padTop + chartH}
                          stroke={isPinned ? '#b45309' : '#059669'}
                          strokeWidth={isPinned ? '1.8' : '1.2'}
                          strokeDasharray="3 3"
                        />
                      )}

                      {/* Nodo Venta */}
                      <circle
                        cx={p.x}
                        cy={p.yVenta}
                        r={isActive ? 4 : 2.5}
                        fill="#44403c"
                        stroke="#ffffff"
                        strokeWidth="1.5"
                      />

                      {/* Nodo Costo */}
                      <circle
                        cx={p.x}
                        cy={p.yCosto}
                        r={isActive ? 4 : 2.5}
                        fill="#d97706"
                        stroke="#ffffff"
                        strokeWidth="1.5"
                      />

                      {/* Nodo Ganancia (destacado) */}
                      <circle
                        cx={p.x}
                        cy={p.yGanancia}
                        r={isPinned ? 7 : isActive ? 5.5 : 4}
                        fill={isPinned ? '#b45309' : '#059669'}
                        stroke="#ffffff"
                        strokeWidth="2"
                      />

                      {/* Pin indicador circular sobre el nodo si está fijado */}
                      {isPinned && (
                        <circle
                          cx={p.x}
                          cy={p.yGanancia}
                          r={10}
                          fill="none"
                          stroke="#b45309"
                          strokeWidth="1.5"
                          opacity="0.6"
                        />
                      )}

                      {/* Tooltip flotante superior directo en el gráfico al hacer hover */}
                      {isHovered && (
                        <g transform={`translate(${p.x}, ${Math.max(16, p.yGanancia - 12)})`}>
                          <rect
                            x={-45}
                            y={-18}
                            width={90}
                            height={20}
                            rx={4}
                            fill="#1c1917"
                            opacity="0.9"
                          />
                          <text
                            x={0}
                            y={-4}
                            textAnchor="middle"
                            fill="#ffffff"
                            className="text-[10px] font-semibold"
                          >
                            {p.telaNombre}
                          </text>
                        </g>
                      )}
                    </g>
                  )
                })}
              </svg>
            </div>

            {/* Fichas fijadas / comparativas y hover inferior */}
            <div className="mt-2 border-t border-stone-100 pt-3 space-y-2">
              {/* Barra de ayuda / limpiar */}
              <div className="flex items-center justify-between text-[11px] text-stone-500">
                <span>
                  {pinnedIndices.length > 0 ? (
                    <>
                      <strong>{pinnedIndices.length}</strong> {pinnedIndices.length === 1 ? 'tela fijada' : 'telas fijadas para comparar'}:
                    </>
                  ) : (
                    hoverIndex !== null && puntosTelas[hoverIndex] ? (
                      <>Detalle de la tela seleccionada:</>
                    ) : (
                      <>Tocá cualquier punto para <strong>fijar y comparar</strong> varias telas a la vez.</>
                    )
                  )}
                </span>
                {pinnedIndices.length > 0 && (
                  <button
                    onClick={() => setPinnedIndices([])}
                    className="text-stone-500 hover:text-stone-800 hover:underline font-medium"
                  >
                    Desmarcar todas ✕
                  </button>
                )}
              </div>

              {/* Lista de telas fijadas (para comparar) */}
              {pinnedIndices.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                  {pinnedIndices.map((idx) => {
                    const item = puntosTelas[idx]
                    if (!item) return null
                    return (
                      <div
                        key={item.telaNombre}
                        className="flex flex-col justify-between rounded-md border border-amber-300 bg-amber-50/50 p-2.5 text-xs shadow-2xs relative"
                      >
                        <div className="flex items-center justify-between pb-1.5 border-b border-amber-200/60">
                          <span className="font-bold text-stone-900 uppercase">
                            {item.telaNombre}
                          </span>
                          <div className="flex items-center gap-1.5">
                            <span className="rounded bg-amber-100 px-1.5 py-0.2 text-[10px] font-semibold text-amber-900">
                              #{idx + 1}
                            </span>
                            <button
                              onClick={() => togglePin(idx)}
                              className="text-stone-400 hover:text-stone-700 font-bold ml-1"
                              title="Quitar comparación"
                            >
                              ✕
                            </button>
                          </div>
                        </div>
                        <div className="mt-2 grid grid-cols-3 gap-1 text-[11px]">
                          <div>
                            <div className="text-[10px] text-stone-400">Venta</div>
                            <strong className="text-stone-800"><Money value={item.venta} /></strong>
                          </div>
                          <div>
                            <div className="text-[10px] text-stone-400">Costo</div>
                            <strong className="text-amber-900"><Money value={item.costo} /></strong>
                          </div>
                          <div>
                            <div className="text-[10px] text-stone-400">Ganancia</div>
                            <strong className="text-emerald-700 font-bold"><Money value={item.ganancia} /></strong>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              ) : hoverIndex !== null && puntosTelas[hoverIndex] ? (
                /* Ficha temporal de Hover si no hay fijadas */
                <div className="flex flex-wrap items-center justify-between gap-3 rounded-md bg-stone-50 px-3.5 py-2 text-xs border border-stone-200">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-stone-900 uppercase">
                      {puntosTelas[hoverIndex].telaNombre}
                    </span>
                    <span className="rounded bg-stone-200/70 px-1.5 py-0.5 text-[10px] font-medium text-stone-600">
                      #{hoverIndex + 1} en ganancia
                    </span>
                    <span className="text-[10px] text-amber-800 font-medium">
                      (Hacé click para fijar)
                    </span>
                  </div>
                  <div className="flex flex-wrap items-center gap-5">
                    <span className="text-stone-600">
                      Venta: <strong className="text-stone-900"><Money value={puntosTelas[hoverIndex].venta} /></strong>
                    </span>
                    <span className="text-stone-600">
                      Costo: <strong className="text-amber-800"><Money value={puntosTelas[hoverIndex].costo} /></strong>
                    </span>
                    <span className="text-stone-600">
                      Ganancia neta:{' '}
                      <strong className="text-emerald-700 font-bold">
                        <Money value={puntosTelas[hoverIndex].ganancia} />
                      </strong>
                    </span>
                  </div>
                </div>
              ) : null}
            </div>
          </div>
        )}
      </div>

      {/* Stock general por tela */}
      <div className="space-y-3">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="text-base font-semibold text-stone-900">Stock General por Tela</h2>
            <p className="mt-0.5 text-xs text-stone-500">
              Vista consolidada por tipo de tela para control rápido de disponibilidad y valor.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <input
              className="h-9 w-full rounded-md border border-stone-300 bg-white px-3 text-sm focus:border-amber-600 focus:outline-none sm:w-64"
              placeholder="Buscar tela o color..."
              value={busqueda}
              onChange={(e) => {
                setBusqueda(e.target.value)
                setPaginaStock(1)
              }}
            />
            <label className="inline-flex h-9 items-center gap-2 rounded-md border border-stone-300 bg-white px-3 text-xs font-medium text-stone-700">
              <input
                type="checkbox"
                checked={soloBajoStock}
                onChange={(e) => {
                  setSoloBajoStock(e.target.checked)
                  setPaginaStock(1)
                }}
                className="accent-amber-600"
              />
              Solo bajo stock
            </label>
          </div>
        </div>

        {/* Resumen badges */}
        <div className="flex flex-wrap items-center gap-2 rounded-xl border border-stone-200 bg-white px-3.5 py-2.5 text-xs shadow-sm">
          <span className="font-medium text-stone-700">Estado de telas:</span>
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
            · <Link to="/rollos" className="text-amber-700 hover:underline">Ver detalle de rollos y compras →</Link>
          </span>
        </div>

        {/* Vista Mobile: Tarjetas por tela */}
        <div className="space-y-3 md:hidden">
          {stockPaginado.length === 0 ? (
            <div className="rounded-xl border border-stone-200 bg-white p-6 text-center text-sm text-stone-400">
              No se encontraron telas con los filtros aplicados.
            </div>
          ) : (
            stockPaginado.map((item) => (
              <div
                key={item.telaId}
                className="rounded-xl border border-stone-200 bg-white p-3.5 shadow-sm"
              >
                <div className="flex items-start justify-between gap-2 border-b border-stone-100 pb-2">
                  <div className="min-w-0">
                    <div className="truncate text-sm font-semibold text-stone-900">
                      {item.telaNombre}
                    </div>
                    <div className="mt-0.5 flex flex-wrap items-center gap-1.5 text-[11px] text-stone-500">
                      <span className="rounded bg-stone-100 px-1.5 py-0.5 text-[10px] font-medium text-stone-600">
                        {item.coloresCount} {item.coloresCount === 1 ? 'color' : 'colores'}
                      </span>
                      <span className="truncate" title={item.coloresNombres.join(', ')}>
                        {item.coloresNombres.slice(0, 3).join(', ')}
                        {item.coloresNombres.length > 3 && ` +${item.coloresNombres.length - 3}`}
                      </span>
                    </div>
                  </div>
                  <div className="shrink-0 text-right">
                    <div className="text-xs font-semibold text-stone-900">
                      <Money value={item.valorizadoPesos} />
                    </div>
                    <div className="text-[10px] text-stone-400">valorizado</div>
                  </div>
                </div>

                <div className="mt-2 grid grid-cols-3 gap-2 rounded-lg bg-stone-50 p-2 text-xs">
                  <div>
                    <span className="block text-[10px] text-stone-500">Comprado</span>
                    <strong className="text-stone-900">
                      {formatCantidad(item.compradoCantidad, item.unidad)}
                    </strong>
                  </div>
                  <div>
                    <span className="block text-[10px] text-stone-500">Consumido</span>
                    <strong className="text-stone-900">
                      {formatCantidad(item.usadoCantidad, item.unidad)}
                    </strong>
                  </div>
                  <div>
                    <span className="block text-[10px] text-stone-500">Rollos disp.</span>
                    <strong className="text-stone-900">
                      {formatRollos(item.disponibleRollos)}
                    </strong>
                  </div>
                </div>

                <div className="mt-2">
                  <StockIndicator
                    comprado={item.compradoCantidad}
                    usado={item.usadoCantidad}
                    unidad={item.unidad}
                    detalle={false}
                  />
                </div>
              </div>
            ))
          )}
        </div>

        {/* Vista Escritorio: Tabla por tela */}
        <div className="hidden overflow-x-auto rounded-xl border border-stone-200 bg-white shadow-sm md:block">
          <table className="w-full divide-y divide-stone-200">
            <thead className="bg-stone-50">
              <tr>
                <th className={`${th} text-left`}>Tela</th>
                <th className={`${th} text-left`}>Colores activos</th>
                <th className={thRight}>Comprado</th>
                <th className={thRight}>Consumido</th>
                <th className={`${th} text-left`}>Disponible</th>
                <th className={thRight}>Rollos disp.</th>
                <th className={thRight}>Valorizado</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {stockPaginado.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center text-sm text-stone-400">
                    No se encontraron telas con los filtros aplicados.
                  </td>
                </tr>
              ) : (
                stockPaginado.map((item) => (
                  <tr key={item.telaId} className="hover:bg-stone-50/70 transition-colors">
                    <td className={`${td} font-medium text-stone-900`}>
                      {item.telaNombre}
                    </td>
                    <td className={td}>
                      <div className="flex flex-wrap items-center gap-1.5 max-w-xs">
                        <span className="rounded bg-stone-100 px-1.5 py-0.5 text-[10px] font-medium text-stone-600">
                          {item.coloresCount} {item.coloresCount === 1 ? 'color' : 'colores'}
                        </span>
                        <span className="text-xs text-stone-500 truncate" title={item.coloresNombres.join(', ')}>
                          {item.coloresNombres.slice(0, 3).join(', ')}
                          {item.coloresNombres.length > 3 && ` +${item.coloresNombres.length - 3}`}
                        </span>
                      </div>
                    </td>
                    <td className={tdRight}>
                      {formatCantidad(item.compradoCantidad, item.unidad)}
                    </td>
                    <td className={tdRight}>
                      {formatCantidad(item.usadoCantidad, item.unidad)}
                    </td>
                    <td className={td}>
                      <StockIndicator
                        comprado={item.compradoCantidad}
                        usado={item.usadoCantidad}
                        unidad={item.unidad}
                        detalle={false}
                      />
                    </td>
                    <td className={`${tdRight} font-semibold text-stone-800`}>
                      {formatRollos(item.disponibleRollos)}
                    </td>
                    <td className={`${tdRight} font-medium text-stone-900`}>
                      <Money value={item.valorizadoPesos} />
                    </td>
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
            itemLabel="telas"
          />
        </div>
      </div>
    </div>
  )
}
