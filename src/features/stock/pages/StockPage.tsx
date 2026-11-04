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
const td = 'px-4 py-2.5 text-sm text-stone-900'
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
  // ANÁLISIS POR TELA: VENTA, GANANCIA Y COSTO (Para gráfico de líneas)
  // -------------------------------------------------------------
  const telasAnalisis = useMemo(() => {
    const mapa = new Map<string, { telaNombre: string; costo: number; venta: number; ganancia: number }>()

    // Compras / Inversión de cada tela
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

    // Ventas y Ganancias asignadas según artículos producidos con esa tela
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
      .sort((a, b) => b.ganancia - a.ganancia) // Más ganancia primero
  }, [compras, articulos])

  // Coordenadas calculadas para el gráfico de líneas (SVG Responsive)
  const maxGrafico = useMemo(() => {
    let max = 1000
    for (const t of telasAnalisis) {
      max = Math.max(max, t.costo, t.venta, t.ganancia)
    }
    return max * 1.15 // margen superior
  }, [telasAnalisis])

  const [hoverIndex, setHoverIndex] = useState<number | null>(null)

  // Dimensiones del canvas SVG
  const svgWidth = 800
  const svgHeight = 260
  const padLeft = 70
  const padRight = 40
  const padTop = 25
  const padBottom = 55
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

  const pathVenta = useMemo(() => {
    if (puntosTelas.length === 0) return ''
    return puntosTelas.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.yVenta}`).join(' ')
  }, [puntosTelas])

  const pathGanancia = useMemo(() => {
    if (puntosTelas.length === 0) return ''
    return puntosTelas.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.yGanancia}`).join(' ')
  }, [puntosTelas])

  const pathCosto = useMemo(() => {
    if (puntosTelas.length === 0) return ''
    return puntosTelas.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.yCosto}`).join(' ')
  }, [puntosTelas])

  // Área sombreada bajo la ganancia
  const areaGanancia = useMemo(() => {
    if (puntosTelas.length === 0) return ''
    const baseLine = padTop + chartH
    const firstX = puntosTelas[0].x
    const lastX = puntosTelas[puntosTelas.length - 1].x
    return `${pathGanancia} L ${lastX} ${baseLine} L ${firstX} ${baseLine} Z`
  }, [pathGanancia, puntosTelas, chartH])

  return (
    <div className="space-y-6">
      {/* Cabecera con accesos directos y Cotización persistida */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-stone-900">Resumen General</h1>
          <p className="mt-0.5 text-xs sm:text-sm text-stone-500">
            Vista ejecutiva del taller, stock por tela, finanzas y evolución de producción.
          </p>
        </div>

        {/* Botones de acción rápida: Cortes y Pagos */}
        <div className="flex flex-wrap items-center gap-2">
          <Link
            to="/cortes"
            className="inline-flex items-center gap-1.5 rounded-lg border border-amber-600 bg-amber-50 px-3.5 py-2 text-xs font-semibold text-amber-800 shadow-xs hover:bg-amber-100 transition-colors"
          >
            <span>✂️</span>
            <span>Ver Cortes</span>
            {cortesEnTaller > 0 && (
              <span className="rounded-full bg-amber-600 px-1.5 py-0.2 text-[10px] text-white">
                {cortesEnTaller}
              </span>
            )}
          </Link>
          <Link
            to="/pagos"
            className="inline-flex items-center gap-1.5 rounded-lg border border-emerald-600 bg-emerald-50 px-3.5 py-2 text-xs font-semibold text-emerald-800 shadow-xs hover:bg-emerald-100 transition-colors"
          >
            <span>💵</span>
            <span>Gestión de Pagos</span>
            {totalAPagarTalleres > 0 && (
              <span className="rounded-full bg-emerald-700 px-1.5 py-0.2 text-[10px] text-white">
                Saldo
              </span>
            )}
          </Link>
        </div>
      </div>

      {/* Tarjetas KPI Superiores */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        {/* Total Invertido */}
        <div className="rounded-xl border border-stone-200 bg-white p-3.5 shadow-sm">
          <div className="text-xs font-medium text-stone-500">Total invertido compras</div>
          <div className="mt-1 text-lg font-bold text-stone-900">
            <Money value={totalInvertidoCompras} />
          </div>
          <div className="mt-0.5 text-xs text-stone-400">
            USD ≈ ${(totalInvertidoCompras / (cotizacionDolar || 1)).toFixed(0)}
          </div>
        </div>

        {/* Stock valorizado */}
        <div className="rounded-xl border border-stone-200 bg-white p-3.5 shadow-sm">
          <div className="text-xs font-medium text-stone-500">Stock valorizado (tela)</div>
          <div className="mt-1 text-lg font-bold text-amber-800">
            <Money value={stockValorizadoTotal} />
          </div>
          <div className="mt-0.5 text-xs text-stone-400">
            USD ≈ ${(stockValorizadoTotal / (cotizacionDolar || 1)).toFixed(0)}
          </div>
        </div>

        {/* Cortes en taller */}
        <div className="rounded-xl border border-stone-200 bg-white p-3.5 shadow-sm">
          <div className="text-xs font-medium text-stone-500">Cortes en taller</div>
          <div className="mt-1 flex items-baseline gap-2">
            <span className="text-lg font-bold text-stone-900">{cortesEnTaller}</span>
            <span className="text-xs text-stone-500">activos</span>
          </div>
          <div className="mt-0.5 text-xs text-stone-400">
            <Link to="/cortes" className="hover:underline text-amber-700">Ir a cortes →</Link>
          </div>
        </div>

        {/* Cortes atrasados */}
        <div className="rounded-xl border border-stone-200 bg-white p-3.5 shadow-sm">
          <div className="text-xs font-medium text-stone-500">Cortes atrasados</div>
          <div className="mt-1 text-lg font-bold text-red-600">{cortesAtrasados}</div>
          <div className="mt-0.5 text-xs text-stone-400">
            {cortesAtrasados > 0 ? 'Requiere atención' : 'Todo a tiempo'}
          </div>
        </div>

        {/* Total a pagar talleres */}
        <div className="rounded-xl border border-stone-200 bg-white p-3.5 shadow-sm">
          <div className="text-xs font-medium text-stone-500">Saldo a pagar talleres</div>
          <div className="mt-1 text-lg font-bold text-stone-900">
            <Money value={totalAPagarTalleres} />
          </div>
          <div className="mt-0.5 text-xs text-stone-400">
            <Link to="/pagos" className="hover:underline text-amber-700">Ir a pagos →</Link>
          </div>
        </div>

        {/* Cotización Dólar Persistida */}
        <div className="rounded-xl border border-amber-200 bg-amber-50/50 p-3.5 shadow-sm">
          <label className="block text-xs font-semibold text-amber-900">Cotización USD ($)</label>
          <div className="mt-1 flex items-center gap-1.5">
            <span className="text-xs font-semibold text-stone-500">$</span>
            <input
              type="number"
              min={1}
              value={inputDolar}
              onChange={(e) => handleDolarChange(e.target.value)}
              className="h-8 w-full rounded border border-amber-300 bg-white px-2 text-sm font-bold text-amber-950 focus:border-amber-600 focus:outline-none"
              placeholder="1200"
            />
          </div>
          <div className="mt-0.5 text-[10px] text-amber-700">Persiste en tu navegador</div>
        </div>
      </div>

      {/* ----------------------------------------------------------- */}
      {/* GRÁFICO DE LÍNEAS: VENTA, GANANCIA Y COSTO POR TELA        */}
      {/* ----------------------------------------------------------- */}
      <div className="rounded-xl border border-stone-200 bg-white p-4 shadow-sm">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between border-b border-stone-100 pb-3">
          <div>
            <h2 className="text-base font-bold text-stone-900">
              Rendimiento por Tipo de Tela
            </h2>
            <p className="text-xs text-stone-500">
              Comparativa de líneas: qué tela genera mayor retorno. Ordenado de mayor a menor ganancia.
            </p>
          </div>

          {/* Leyenda interactiva */}
          <div className="flex flex-wrap items-center gap-4 text-xs font-medium">
            <span className="flex items-center gap-1.5 text-sky-700">
              <span className="inline-block h-3 w-3 rounded-full bg-sky-500 border-2 border-white shadow-xs" />
              Línea de Venta
            </span>
            <span className="flex items-center gap-1.5 text-emerald-700 font-bold">
              <span className="inline-block h-3 w-3 rounded-full bg-emerald-500 border-2 border-white shadow-xs" />
              Línea de Ganancia
            </span>
            <span className="flex items-center gap-1.5 text-rose-700">
              <span className="inline-block h-3 w-3 rounded-full bg-rose-400 border-2 border-white shadow-xs" />
              Línea de Costo / Inversión
            </span>
          </div>
        </div>

        {puntosTelas.length === 0 ? (
          <div className="py-16 text-center text-sm text-stone-400">
            No hay compras o artículos registrados para trazar las curvas.
          </div>
        ) : (
          <div className="mt-4 relative">
            {/* SVG del Gráfico de Líneas */}
            <svg
              viewBox={`0 0 ${svgWidth} ${svgHeight}`}
              className="w-full h-auto max-h-72 overflow-visible select-none"
            >
              <defs>
                <linearGradient id="gradGanancia" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#10b981" stopOpacity="0.25" />
                  <stop offset="100%" stopColor="#10b981" stopOpacity="0.0" />
                </linearGradient>
              </defs>

              {/* Guías horizontales y escala Y */}
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
                      stroke="#f1f5f9"
                      strokeDasharray={pct === 0 ? 'none' : '4 4'}
                      strokeWidth="1"
                    />
                    <text
                      x={padLeft - 10}
                      y={y + 4}
                      textAnchor="end"
                      className="text-[10px] fill-stone-400 font-mono"
                    >
                      ${valor >= 1000000 ? `${(valor / 1000000).toFixed(1)}M` : valor >= 1000 ? `${(valor / 1000).toFixed(0)}k` : valor}
                    </text>
                  </g>
                )
              })}

              {/* Área sombreada de ganancia */}
              <path d={areaGanancia} fill="url(#gradGanancia)" />

              {/* Líneas principales */}
              {/* 1. Línea de Venta */}
              <path
                d={pathVenta}
                fill="none"
                stroke="#38bdf8"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />

              {/* 2. Línea de Costo */}
              <path
                d={pathCosto}
                fill="none"
                stroke="#fb7185"
                strokeWidth="2.5"
                strokeDasharray="4 3"
                strokeLinecap="round"
                strokeLinejoin="round"
              />

              {/* 3. Línea de Ganancia (destacada) */}
              <path
                d={pathGanancia}
                fill="none"
                stroke="#10b981"
                strokeWidth="3.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />

              {/* Puntos y Etiquetas en la base (Telas) */}
              {puntosTelas.map((p, idx) => {
                const isHovered = hoverIndex === idx
                return (
                  <g
                    key={p.telaNombre}
                    className="cursor-pointer"
                    onMouseEnter={() => setHoverIndex(idx)}
                    onMouseLeave={() => setHoverIndex(null)}
                  >
                    {/* Guía vertical interactiva */}
                    <line
                      x1={p.x}
                      y1={padTop}
                      x2={p.x}
                      y2={padTop + chartH}
                      stroke={isHovered ? '#f59e0b' : 'transparent'}
                      strokeWidth={isHovered ? '1.5' : '0'}
                      strokeDasharray="3 3"
                    />

                    {/* Nodo Venta */}
                    <circle
                      cx={p.x}
                      cy={p.yVenta}
                      r={isHovered ? 5.5 : 3.5}
                      fill="#38bdf8"
                      stroke="#fff"
                      strokeWidth="2"
                    />

                    {/* Nodo Costo */}
                    <circle
                      cx={p.x}
                      cy={p.yCosto}
                      r={isHovered ? 5.5 : 3.5}
                      fill="#fb7185"
                      stroke="#fff"
                      strokeWidth="2"
                    />

                    {/* Nodo Ganancia */}
                    <circle
                      cx={p.x}
                      cy={p.yGanancia}
                      r={isHovered ? 7 : 5}
                      fill="#10b981"
                      stroke="#fff"
                      strokeWidth="2.5"
                    />

                    {/* Etiqueta de la Tela en la base */}
                    <text
                      x={p.x}
                      y={padTop + chartH + 22}
                      textAnchor="middle"
                      className={`text-[11px] font-semibold transition-all ${
                        isHovered ? 'fill-amber-800 font-bold scale-105' : 'fill-stone-600'
                      }`}
                    >
                      {p.telaNombre.length > 12 ? `${p.telaNombre.slice(0, 11)}..` : p.telaNombre}
                    </text>
                  </g>
                )
              })}
            </svg>

            {/* Tooltip flotante con datos de la tela seleccionada */}
            {hoverIndex !== null && puntosTelas[hoverIndex] && (
              <div className="mt-3 flex flex-wrap items-center justify-between gap-3 rounded-lg border border-amber-200 bg-amber-50/80 p-2.5 text-xs">
                <div>
                  <span className="font-bold text-amber-950 uppercase tracking-wide">
                    {puntosTelas[hoverIndex].telaNombre}
                  </span>
                  <span className="ml-2 text-stone-500 font-medium">
                    (Posición #{hoverIndex + 1} en rentabilidad)
                  </span>
                </div>
                <div className="flex flex-wrap items-center gap-4">
                  <span className="text-emerald-800">
                    Ganancia: <strong>${Math.round(puntosTelas[hoverIndex].ganancia).toLocaleString('es-AR')}</strong>
                  </span>
                  <span className="text-sky-800">
                    Venta: <strong>${Math.round(puntosTelas[hoverIndex].venta).toLocaleString('es-AR')}</strong>
                  </span>
                  <span className="text-rose-800">
                    Costo/Inversión: <strong>${Math.round(puntosTelas[hoverIndex].costo).toLocaleString('es-AR')}</strong>
                  </span>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* ----------------------------------------------------------- */}
      {/* SECCIÓN DE STOCK GENERAL: SIMPLIFICADO POR TELA            */}
      {/* ----------------------------------------------------------- */}
      <div className="space-y-3">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="text-base font-bold text-stone-900">Stock General por Tela</h2>
            <p className="mt-0.5 text-xs text-stone-500">
              Visualización unificada por tipo de tela (no desglosada por color) para un control simple y rápido.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <input
              className="h-9 w-full rounded-md border border-stone-300 bg-white px-3 text-sm focus:border-amber-600 focus:outline-none sm:w-64"
              placeholder="Buscar por nombre de tela o color..."
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
        <div className="flex flex-wrap items-center gap-2 rounded-lg border border-stone-200 bg-white px-3 py-2 text-xs">
          <span className="font-medium text-stone-700">Estado global de telas:</span>
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
            · Enlaces rápidos a compras: <Link to="/rollos" className="text-amber-700 hover:underline">Ver Textil / Rollos →</Link>
          </span>
        </div>

        {/* Tabla simplificada por tela */}
        <div className="overflow-x-auto rounded-lg border border-stone-200 bg-white shadow-xs">
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
                  <tr key={item.telaId} className="hover:bg-stone-50/80 transition-colors">
                    <td className={`${td} font-semibold text-stone-900`}>
                      {item.telaNombre}
                    </td>
                    <td className={td}>
                      <div className="flex flex-wrap items-center gap-1 max-w-xs">
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
                    <td className={`${tdRight} font-semibold text-amber-900`}>
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
