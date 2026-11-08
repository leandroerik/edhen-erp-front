import { useState, useMemo, useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import { Money } from '../../../shared/components/Money'
import { Pagination } from '../../../shared/components/Pagination'
import { formatCantidad, formatRollos, getStockInfo } from '../../../utils/stock'
import { stockDesdeCompras, usosStockDesdeDatos } from '../../../data/mock'
import { useErpStore } from '../../../data/erpStore'
import { resumenPagoCorte } from '../../pagos/pagos.utils'
import {
  DisponibilidadTelaModal,
  type ColorDisponible,
} from '../components/DisponibilidadTelaModal'
import type { UnidadTela } from '../../../types'

const th = 'px-4 py-2.5 text-xs font-semibold uppercase tracking-wide text-stone-500'
const thRight = `${th} text-right`
const td = 'px-4 py-3 text-sm text-stone-900'
const tdRight = `${td} text-right tabular-nums`

const FILAS_POR_PAGINA = 8
const DOLAR_STORAGE_KEY = 'edhen_erp_cotizacion_dolar'
const KPI_STORAGE_KEY = 'edhen_erp_resumen_kpis_ocultos_v2'
const KPI_IDS = ['invertido', 'stock', 'cortes', 'saldo', 'dolar'] as const
type KpiId = (typeof KPI_IDS)[number]

function esPantallaMobile() {
  try {
    return window.matchMedia('(max-width: 767px)').matches
  } catch {
    return false
  }
}

interface StockGeneralTela {
  telaId: string
  telaNombre: string
  unidad: UnidadTela
  orden: number
  compradoCantidad: number
  compradoRollos: number
  usadoCantidad: number
  usadoRollos: number
  disponibleCantidad: number
  disponibleRollos: number
  coloresCount: number
  coloresNombres: string[]
  coloresDisponibles: ColorDisponible[]
  valorizadoPesos: number
  info: ReturnType<typeof getStockInfo>
}

function OcultarKpiButton({
  label,
  onClick,
}: {
  label: string
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={`Ocultar ${label}`}
      aria-label={`Ocultar tarjeta ${label}`}
      className="absolute right-1.5 top-1.5 flex h-6 w-6 items-center justify-center rounded text-[11px] leading-none text-stone-300 transition-colors hover:bg-stone-100 hover:text-stone-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-500"
    >
      ✕
    </button>
  )
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

export function ResumenPage() {
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

  // Tarjetas KPI ocultables (persistidas por navegador)
  const [kpisOcultos, setKpisOcultos] = useState<KpiId[]>(() => {
    try {
      const guardado = localStorage.getItem(KPI_STORAGE_KEY)
      if (guardado) {
        const parsed: unknown = JSON.parse(guardado)
        if (Array.isArray(parsed)) {
          return parsed.filter((id): id is KpiId =>
            (KPI_IDS as readonly string[]).includes(String(id)),
          )
        }
      }
    } catch {
      // fallback
    }
    // En mobile arrancan ocultas para no ocupar espacio; en desktop visibles.
    return esPantallaMobile() ? [...KPI_IDS] : []
  })

  useEffect(() => {
    try {
      localStorage.setItem(KPI_STORAGE_KEY, JSON.stringify(kpisOcultos))
    } catch (e) {
      console.error('Error guardando tarjetas ocultas', e)
    }
  }, [kpisOcultos])

  const ocultarKpi = (id: KpiId) =>
    setKpisOcultos((prev) => (prev.includes(id) ? prev : [...prev, id]))

  const kpiVisible = (id: KpiId) => !kpisOcultos.includes(id)
  const algunKpiOculto = kpisOcultos.length > 0

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
      orden: number
      compradoCantidad: number
      compradoRollos: number
      usadoCantidad: number
      usadoRollos: number
      colores: Set<string>
      coloresDisponibles: Map<string, ColorDisponible>
      valorizadoPesos: number
    }>()

    for (const item of stockFuente) {
      const actual = mapa.get(item.telaId) || {
        telaId: item.telaId,
        telaNombre: item.telaNombre,
        unidad: item.unidad,
        // Orden de carga: respeta el orden en que aparecen las compras.
        orden: mapa.size,
        compradoCantidad: 0,
        compradoRollos: 0,
        usadoCantidad: 0,
        usadoRollos: 0,
        colores: new Set<string>(),
        coloresDisponibles: new Map<string, ColorDisponible>(),
        valorizadoPesos: 0,
      }

      actual.compradoCantidad += item.compradoCantidad
      actual.compradoRollos += item.compradoRollos
      actual.usadoCantidad += item.usadoCantidad
      actual.usadoRollos += item.usadoRollos
      if (item.colorNombre) actual.colores.add(item.colorNombre)

      const colorActual = actual.coloresDisponibles.get(item.colorId) ?? {
        colorId: item.colorId,
        colorNombre: item.colorNombre,
        disponibleCantidad: 0,
        disponibleRollos: 0,
      }
      colorActual.disponibleCantidad += Math.max(0, item.disponibleCantidad)
      colorActual.disponibleRollos += Math.max(0, item.disponibleRollos)
      actual.coloresDisponibles.set(item.colorId, colorActual)

      for (const lote of item.lotesDetalle) {
        const cantLoteRestante = Math.max(0, lote.cantidad - (lote.usadoCantidad || 0))
        actual.valorizadoPesos += cantLoteRestante * (lote.precioUnitario || item.precioUnitario || 0)
      }

      mapa.set(item.telaId, actual)
    }

    return Array.from(mapa.values()).map((t) => {
      const dispCant = Math.max(0, t.compradoCantidad - t.usadoCantidad)
      const dispRollos = Math.max(0, t.compradoRollos - t.usadoRollos)
      const coloresDisponibles = Array.from(t.coloresDisponibles.values())
        .filter((c) => c.disponibleCantidad > 0.005 || c.disponibleRollos > 0.005)
        .sort(
          (a, b) =>
            b.disponibleRollos - a.disponibleRollos ||
            a.colorNombre.localeCompare(b.colorNombre),
        )

      return {
        telaId: t.telaId,
        telaNombre: t.telaNombre,
        unidad: t.unidad,
        orden: t.orden,
        compradoCantidad: t.compradoCantidad,
        compradoRollos: t.compradoRollos,
        usadoCantidad: t.usadoCantidad,
        usadoRollos: t.usadoRollos,
        disponibleCantidad: dispCant,
        disponibleRollos: dispRollos,
        coloresCount: coloresDisponibles.length,
        coloresNombres: Array.from(t.colores),
        coloresDisponibles,
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

  const totalAPagarTalleres = useMemo(() => {
    return cortes.reduce((acc, corte) => {
      const res = resumenPagoCorte(corte, pagos)
      return acc + (res.saldo > 0 ? res.saldo : 0)
    }, 0)
  }, [cortes, pagos])

  // Productos: últimos cargados primero (mayor código al inicio)
  const productosResumen = useMemo(() => {
    const numeroCodigo = (codigo: string) => {
      const match = /(\d+)\s*$/.exec(codigo || '')
      return match ? Number(match[1]) : 0
    }

    return [...articulos]
      .sort((a, b) => numeroCodigo(b.codigoArticulo) - numeroCodigo(a.codigoArticulo))
      .map((art) => {
        const cantidad = Number(art.cantidadPrendas) || 0
        const precioVenta = Number(art.precioVenta) || 0
        const costoUnitario = Number(art.costoUnitario) || 0
        const gananciaTotal =
          Number(art.gananciaTotal) ||
          (Number(art.gananciaUnitaria) || precioVenta - costoUnitario) * cantidad

        return { ...art, cantidad, precioVenta, gananciaTotal }
      })
  }, [articulos])

  const totalPrendas = useMemo(
    () => productosResumen.reduce((acc, p) => acc + p.cantidad, 0),
    [productosResumen],
  )

  const [productosAbiertos, setProductosAbiertos] = useState(true)

  // Filtros de disponibilidad por tela
  const [busqueda, setBusqueda] = useState('')
  const [ocultarAgotadas, setOcultarAgotadas] = useState(() => esPantallaMobile())
  const [paginaStock, setPaginaStock] = useState(1)
  const [filasStock, setFilasStock] = useState(FILAS_POR_PAGINA)

  const texto = busqueda.trim().toLowerCase()

  const stockFiltrado = useMemo(() => {
    return stockPorTela
      .filter((s) => {
        if (ocultarAgotadas && s.info.nivel === 'AGOTADO') return false
        if (!texto) return true
        return s.telaNombre.toLowerCase().includes(texto) ||
          s.coloresNombres.some((c) => c.toLowerCase().includes(texto))
      })
      .sort((a, b) => {
        // Orden de carga descendente: lo último cargado aparece primero.
        const diff = b.orden - a.orden
        if (diff !== 0) return diff
        return a.telaNombre.localeCompare(b.telaNombre)
      })
  }, [stockPorTela, ocultarAgotadas, texto])

  const [telaDetalle, setTelaDetalle] = useState<StockGeneralTela | null>(null)

  const totalPaginasStock = Math.max(1, Math.ceil(stockFiltrado.length / filasStock))
  const paginaStockActual = Math.min(Math.max(1, paginaStock), totalPaginasStock)
  const indiceStock = (paginaStockActual - 1) * filasStock
  const stockPaginado = stockFiltrado.slice(indiceStock, indiceStock + filasStock)

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

  const chartRef = useRef<HTMLDivElement>(null)
  const [chartWidth, setChartWidth] = useState(840)

  const esAngosto = chartWidth < 480
  const svgWidth = chartWidth
  const svgHeight = esAngosto ? 210 : 280
  const padLeft = esAngosto ? 58 : 85
  const padRight = esAngosto ? 14 : 45
  const padTop = esAngosto ? 22 : 30
  const padBottom = esAngosto ? 26 : 65
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

  useEffect(() => {
    const el = chartRef.current
    if (!el) return
    const actualizar = () => {
      const ancho = el.clientWidth
      if (ancho > 0) setChartWidth(Math.max(300, Math.round(ancho)))
    }
    actualizar()
    const observer = new ResizeObserver(actualizar)
    observer.observe(el)
    return () => observer.disconnect()
  }, [puntosTelas.length])

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
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <h1 className="text-xl font-semibold text-stone-900 sm:text-2xl">Resumen</h1>
          <p className="mt-0.5 text-xs text-stone-500 sm:text-sm">
            Métricas clave de taller, rendimiento por tela y valorización de inventario.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setKpisOcultos(algunKpiOculto ? [] : [...KPI_IDS])}
          aria-expanded={!algunKpiOculto}
          className="inline-flex shrink-0 items-center gap-1.5 rounded-md border border-stone-300 bg-white px-3 py-1.5 text-xs font-medium text-stone-600 shadow-sm transition-colors hover:bg-stone-50"
        >
          <span aria-hidden="true">{algunKpiOculto ? '↺' : '▾'}</span>
          {algunKpiOculto ? 'Mostrar tarjetas' : 'Ocultar tarjetas'}
          {algunKpiOculto && (
            <span className="rounded-full bg-stone-100 px-1.5 py-0.5 text-[10px] font-semibold text-stone-600">
              {kpisOcultos.length}
            </span>
          )}
        </button>
      </div>

      {/* Tarjetas KPI */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        {/* Total Invertido */}
        <div
          className={`relative rounded-xl border border-t-2 border-stone-200 border-t-amber-600/70 bg-white p-3 shadow-sm sm:p-3.5 ${
            kpiVisible('invertido') ? '' : 'hidden'
          }`}
        >
          <OcultarKpiButton
            label="Total invertido"
            onClick={() => ocultarKpi('invertido')}
          />
          <div className="pr-6 text-xs font-medium text-stone-500">Total invertido</div>
          <div className="mt-1 text-base font-semibold tabular-nums text-stone-900 sm:text-lg">
            <Money value={totalInvertidoCompras} />
          </div>
          <div className="mt-0.5 text-xs text-stone-500">
            USD ≈ ${(totalInvertidoCompras / (cotizacionDolar || 1)).toFixed(0)}
          </div>
        </div>

        {/* Stock valorizado */}
        <div
          className={`relative rounded-xl border border-t-2 border-stone-200 border-t-emerald-600/70 bg-white p-3 shadow-sm sm:p-3.5 ${
            kpiVisible('stock') ? '' : 'hidden'
          }`}
        >
          <OcultarKpiButton
            label="Stock valorizado"
            onClick={() => ocultarKpi('stock')}
          />
          <div className="pr-6 text-xs font-medium text-stone-500">Stock valorizado</div>
          <div className="mt-1 text-base font-semibold tabular-nums text-stone-900 sm:text-lg">
            <Money value={stockValorizadoTotal} />
          </div>
          <div className="mt-0.5 text-xs font-medium text-emerald-700">
            USD ≈ ${(stockValorizadoTotal / (cotizacionDolar || 1)).toFixed(0)}
          </div>
        </div>

        {/* Cortes en taller */}
        <div
          className={`relative rounded-xl border border-t-2 border-stone-200 border-t-stone-400/70 bg-white p-3 shadow-sm sm:p-3.5 ${
            kpiVisible('cortes') ? '' : 'hidden'
          }`}
        >
          <OcultarKpiButton
            label="Cortes en taller"
            onClick={() => ocultarKpi('cortes')}
          />
          <div className="pr-6 text-xs font-medium text-stone-500">Cortes en taller</div>
          <div className="mt-1 flex items-baseline gap-2">
            <span className="text-lg font-semibold text-stone-900">{cortesEnTaller}</span>
            <span className="text-xs text-stone-500">activos</span>
          </div>
          <div className="mt-0.5 text-xs text-stone-500">
            <Link to="/cortes" className="text-amber-700 hover:underline">Ir a cortes →</Link>
          </div>
        </div>

        {/* Total a pagar talleres */}
        <div
          className={`relative rounded-xl border border-t-2 border-stone-200 border-t-amber-600/70 bg-white p-3 shadow-sm sm:p-3.5 ${
            kpiVisible('saldo') ? '' : 'hidden'
          }`}
        >
          <OcultarKpiButton
            label="Saldo a pagar"
            onClick={() => ocultarKpi('saldo')}
          />
          <div className="pr-6 text-xs font-medium text-stone-500">Saldo a pagar</div>
          <div className="mt-1 text-base font-semibold tabular-nums text-stone-900 sm:text-lg">
            <Money value={totalAPagarTalleres} />
          </div>
          <div className="mt-0.5 text-xs text-stone-500">
            <Link to="/pagos" className="text-amber-700 hover:underline">Ir a pagos →</Link>
          </div>
        </div>

        {/* Cotización Dólar Persistida */}
        <div
          className={`relative col-span-2 rounded-xl border border-t-2 border-stone-200 border-t-stone-400/70 bg-white p-3 shadow-sm sm:col-span-1 sm:p-3.5 ${
            kpiVisible('dolar') ? '' : 'hidden'
          }`}
        >
          <OcultarKpiButton
            label="Cotización USD"
            onClick={() => ocultarKpi('dolar')}
          />
          <label className="block pr-6 text-xs font-medium text-stone-500">Cotización USD</label>
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

      {/* Productos: cantidad y precios (desplegable) */}
      <div className="rounded-xl border border-stone-200 bg-white shadow-sm">
        <button
          type="button"
          onClick={() => setProductosAbiertos((abierto) => !abierto)}
          className="flex w-full items-center justify-between gap-3 px-4 py-3.5 text-left sm:px-5"
        >
          <div>
            <h2 className="text-base font-semibold text-stone-900">Productos</h2>
            <p className="mt-0.5 text-xs text-stone-500">
              Últimos cargados primero · cantidad, precio de venta y ganancia.
            </p>
          </div>
          <div className="flex shrink-0 items-center gap-2 text-xs">
            <span className="rounded-full bg-stone-100 px-2 py-0.5 font-semibold text-stone-700">
              {totalPrendas} prendas
            </span>
            <span className="font-medium text-amber-700">
              {productosAbiertos ? 'Ocultar' : 'Ver'}
            </span>
          </div>
        </button>

        {productosAbiertos && (
          <>
            {/* Mobile: tarjetas por producto (scroll vertical) */}
            <div className="max-h-[520px] space-y-3 overflow-y-auto border-t border-stone-100 p-3 md:hidden">
              {productosResumen.length === 0 ? (
                <div className="py-8 text-center text-sm text-stone-400">
                  Todavía no hay productos generados.
                </div>
              ) : (
                productosResumen.map((p) => (
                  <div
                    key={p.id}
                    className="flex items-center justify-between gap-3 rounded-lg border border-stone-200 p-3"
                  >
                    <div className="min-w-0">
                      <div className="truncate text-sm font-semibold text-stone-900">
                        {p.nombre}
                      </div>
                      <div className="text-[11px] text-stone-500">
                        {p.codigoArticulo} · {p.cantidad} u.
                      </div>
                      <div className="mt-0.5 text-[11px] text-emerald-700">
                        Ganancia <Money value={p.gananciaTotal} />
                      </div>
                    </div>
                    <div className="shrink-0 text-right">
                      <div className="text-sm font-semibold text-stone-900">
                        <Money value={p.precioVenta} />
                      </div>
                      <div className="text-[10px] text-stone-400">precio venta</div>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Escritorio: tabla simple con scroll vertical */}
            <div className="hidden max-h-[520px] overflow-auto border-t border-stone-100 md:block">
              <table className="w-full divide-y divide-stone-200">
                <thead className="sticky top-0 z-10 bg-stone-50 shadow-sm">
                  <tr>
                    <th className={`${th} text-left`}>Producto</th>
                    <th className={thRight}>Cantidad</th>
                    <th className={thRight}>Precio venta</th>
                    <th className={thRight}>Ganancia</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100">
                  {productosResumen.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="px-4 py-12 text-center text-sm text-stone-400">
                        Todavía no hay productos generados.
                      </td>
                    </tr>
                  ) : (
                    productosResumen.map((p) => (
                      <tr key={p.id} className="transition-colors hover:bg-stone-50/70">
                        <td className={td}>
                          <div className="font-medium text-stone-900">{p.nombre}</div>
                          <div className="text-xs text-stone-500">{p.codigoArticulo}</div>
                        </td>
                        <td className={tdRight}>{p.cantidad}</td>
                        <td className={`${tdRight} font-medium`}>
                          <Money value={p.precioVenta} />
                        </td>
                        <td className={`${tdRight} font-semibold text-emerald-700`}>
                          <Money value={p.gananciaTotal} />
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {productosResumen.length > 8 && (
              <div className="border-t border-stone-100 px-4 py-2 text-center text-[11px] text-stone-400">
                Desplazá para ver el resto de los productos
              </div>
            )}
          </>
        )}
      </div>

      {/* Disponibilidad de telas */}
      <div className="space-y-3">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="text-base font-semibold text-stone-900">Disponibilidad de telas</h2>
            <p className="mt-0.5 text-xs text-stone-500">
              Stock disponible por tipo de tela, de mayor a menor.
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
                checked={ocultarAgotadas}
                onChange={(e) => {
                  setOcultarAgotadas(e.target.checked)
                  setPaginaStock(1)
                }}
                className="accent-amber-600"
              />
              Ocultar agotadas
            </label>
          </div>
        </div>

        {/* Vista Mobile: Tarjetas de disponibilidad */}
        <div className="grid gap-2.5 sm:grid-cols-2 md:hidden">
          {stockPaginado.length === 0 ? (
            <div className="rounded-xl border border-stone-200 bg-white p-6 text-center text-sm text-stone-400 sm:col-span-2">
              No se encontraron telas con los filtros aplicados.
            </div>
          ) : (
            stockPaginado.map((item) => {
              const pct = Math.max(
                0,
                Math.min(100, Math.round(item.info.disponiblePct * 100)),
              )
              return (
                <button
                  type="button"
                  key={item.telaId}
                  onClick={() => setTelaDetalle(item)}
                  className="rounded-xl border border-stone-200 bg-white p-3.5 text-left shadow-sm transition-colors hover:border-amber-300 hover:bg-amber-50/20 active:bg-stone-50"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <div className="truncate text-sm font-semibold text-stone-900">
                        {item.telaNombre}
                      </div>
                      <div className="mt-1 text-base font-semibold tabular-nums text-stone-900 sm:text-lg">
                        {formatCantidad(item.disponibleCantidad, item.unidad)}
                      </div>
                    </div>
                    <span
                      className={`inline-flex shrink-0 rounded-full border px-2 py-0.5 text-[10px] font-semibold ${item.info.badgeClass}`}
                    >
                      {item.info.label}
                    </span>
                  </div>

                  <div className="mt-2 flex items-center justify-between text-[11px] text-stone-500">
                    <span className="font-medium text-stone-600">
                      {formatRollos(item.disponibleRollos)}{' '}
                      {item.disponibleRollos === 1 ? 'rollo' : 'rollos'}
                    </span>
                    <span className="font-semibold tabular-nums text-stone-600">{pct}%</span>
                  </div>
                  <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-stone-200">
                    <div
                      className={`h-full rounded-full ${item.info.barClass}`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  <div className="mt-2 flex items-center justify-between text-[11px] text-stone-400">
                    <span>
                      {item.coloresCount}{' '}
                      {item.coloresCount === 1 ? 'color con stock' : 'colores con stock'}
                    </span>
                    <span className="font-medium text-amber-700">Ver colores →</span>
                  </div>
                </button>
              )
            })
          )}
        </div>

        {/* Vista Escritorio: Tabla de disponibilidad */}
        <div className="hidden overflow-x-auto rounded-xl border border-stone-200 bg-white shadow-sm md:block">
          <table className="w-full divide-y divide-stone-200">
            <thead className="bg-stone-50">
              <tr>
                <th className={`${th} text-left`}>Tela</th>
                <th className={`${th} text-left`}>Estado</th>
                <th className={thRight}>Disponible</th>
                <th className={thRight}>Rollos disp.</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {stockPaginado.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-4 py-12 text-center text-sm text-stone-400">
                    No se encontraron telas con los filtros aplicados.
                  </td>
                </tr>
              ) : (
                stockPaginado.map((item) => {
                  const pct = Math.max(
                    0,
                    Math.min(100, Math.round(item.info.disponiblePct * 100)),
                  )
                  return (
                    <tr
                      key={item.telaId}
                      onClick={() => setTelaDetalle(item)}
                      title="Ver colores y rollos"
                      className="cursor-pointer hover:bg-stone-50/70 transition-colors"
                    >
                      <td className={`${td} font-medium text-stone-900`}>
                        <div>{item.telaNombre}</div>
                        <div className="text-[11px] font-normal text-stone-400">
                          {item.coloresCount}{' '}
                          {item.coloresCount === 1 ? 'color con stock' : 'colores con stock'}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <span
                            className={`inline-flex rounded-full border px-2 py-0.5 text-[10px] font-semibold ${item.info.badgeClass}`}
                          >
                            {item.info.label}
                          </span>
                          <div className="h-1.5 w-16 overflow-hidden rounded-full bg-stone-200">
                            <div
                              className={`h-full rounded-full ${item.info.barClass}`}
                              style={{ width: `${pct}%` }}
                            />
                          </div>
                          <span className="text-[11px] font-medium tabular-nums text-stone-500">
                            {pct}%
                          </span>
                        </div>
                      </td>
                      <td className={`${tdRight} font-semibold`}>
                        {formatCantidad(item.disponibleCantidad, item.unidad)}
                      </td>
                      <td className={tdRight}>
                        {formatRollos(item.disponibleRollos)}
                      </td>
                    </tr>
                  )
                })
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
            <div ref={chartRef} className="w-full">
              <svg
                viewBox={`0 0 ${svgWidth} ${svgHeight}`}
                className="h-auto w-full select-none overflow-visible"
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
                        <g transform={`translate(${p.x}, ${Math.max(20, p.yGanancia - 12)})`}>
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

      {telaDetalle && (
        <DisponibilidadTelaModal
          telaNombre={telaDetalle.telaNombre}
          unidad={telaDetalle.unidad}
          disponibleCantidad={telaDetalle.disponibleCantidad}
          disponibleRollos={telaDetalle.disponibleRollos}
          colores={telaDetalle.coloresDisponibles}
          onClose={() => setTelaDetalle(null)}
        />
      )}
    </div>
  )
}
