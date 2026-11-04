import { useState, useMemo } from 'react'
import { Button } from '../../../shared/components/Button'
import { Money } from '../../../shared/components/Money'
import { comprasDesdeStock } from '../stockRollos'
import type { OpcionRollo } from '../stockRollos'
import { usosStockDesdeDatos } from '../../../data/mock'
import { useErpStore } from '../../../data/erpStore'
import { formatARS } from '../../../utils/format'
import { ordenarPorFechaYCodigoDesc } from '../../../utils/orden'
import { formatRollos, redondearRollos } from '../../../utils/stock'
import type { Articulo, AvioArticulo, UnidadTela } from '../../../types'

interface Props {
  articulo?: Articulo | null
  codigoSugerido: string
  onClose: () => void
  onSave: (data: any) => void
}

interface TelaLine {
  id: string
  stockKey: string
  loteId?: string
  compraCodigo?: string
  compraFecha?: string
  proveedorNombre?: string
  telaNombre: string
  colorNombre: string
  unidad: UnidadTela
  precioUnitario: number
  disponibleRollos: number
  disponibleCantidad: number
  rollosUsar: number
}

interface AvioLine {
  id: string
  nombre: string
  monto: number
  porPrenda: boolean
}

type TelaCalculada = TelaLine & {
  rollosUsados: number
  cantidadUsada: number
  costoUsado: number
}

interface GrupoTelas {
  key: string
  telaNombre: string
  compraCodigo?: string
  proveedorNombre?: string
  compraFecha?: string
  telas: TelaCalculada[]
}

const COLOR_SWATCH: Record<string, string> = {
  Negro: 'bg-stone-900',
  Blanco: 'bg-white',
  Crudo: 'bg-amber-50',
  Azul: 'bg-blue-600',
  Beige: 'bg-amber-100',
  Rojo: 'bg-red-600',
  Verde: 'bg-emerald-600',
  Gris: 'bg-stone-400',
  Camel: 'bg-amber-700',
  Marino: 'bg-blue-900',
  Rosa: 'bg-pink-300',
  Celeste: 'bg-sky-300',
  Terracota: 'bg-orange-700',
}

const inputCls =
  'h-8 w-full rounded border border-stone-300 bg-white px-2.5 text-sm text-stone-900 focus:border-amber-600 focus:outline-none'
const numberInputCls =
  'h-8 w-24 rounded border border-stone-300 bg-white px-2 text-center text-sm font-semibold text-stone-900 focus:border-amber-600 focus:outline-none'
const labelCls = 'mb-1 block text-xs font-medium text-stone-500'

function telasIniciales(articulo: Articulo | null | undefined, opciones: OpcionRollo[]): TelaLine[] {
  if (!articulo?.telas) return []
  return articulo.telas.map((t, idx) => {
    // Buscar en el stock actual para conocer disponibilidad y datos del lote
    const opcionStock = opciones.find(
      (op) =>
        (t.stockKey && op.stockKey === t.stockKey) ||
        (t.compraCodigo &&
          op.compraCodigo === t.compraCodigo &&
          op.colorNombre.toLowerCase() === t.colorNombre.toLowerCase()) ||
        (op.telaNombre.toLowerCase() === t.telaNombre.toLowerCase() &&
          op.colorNombre.toLowerCase() === t.colorNombre.toLowerCase()),
    )
    const rollosUsadosActuales = Math.max(1, Number(t.rollosUsados) || 1)
    const disponibleRollos = opcionStock
      ? Math.max(rollosUsadosActuales, opcionStock.rollosDisponibles + rollosUsadosActuales)
      : Math.max(rollosUsadosActuales, Number(t.rollosDisponibles) || rollosUsadosActuales)

    const cantidadUsada = Number(t.cantidadUsar) || 0
    const disponibleCantidad = opcionStock
      ? opcionStock.cantidadDisponible + cantidadUsada
      : (Number(t.cantidadLibre) || 0) + cantidadUsada

    return {
      id: `tela-${idx + 1}`,
      stockKey:
        t.stockKey ||
        (opcionStock?.key ??
          `${t.compraCodigo || 'C'}-${t.telaNombre}-${t.colorNombre}`),
      loteId: t.loteId || opcionStock?.loteId,
      compraCodigo: t.compraCodigo || opcionStock?.compraCodigo,
      compraFecha: t.compraFecha || opcionStock?.compraFecha,
      proveedorNombre: t.proveedorNombre || opcionStock?.proveedorNombre,
      telaNombre: t.telaNombre,
      colorNombre: t.colorNombre,
      unidad: t.unidad || opcionStock?.unidad || 'METRO',
      precioUnitario: Number(t.precioUnitario) || opcionStock?.precioUnitario || 0,
      disponibleRollos,
      disponibleCantidad,
      rollosUsar: rollosUsadosActuales,
    }
  })
}

function aviosIniciales(articulo?: Articulo | null): AvioLine[] {
  if (!articulo?.avios || articulo.avios.length === 0) return []
  return articulo.avios.map((a, idx) => ({
    id: a.id || `av-${idx + 1}`,
    nombre: a.nombre || '',
    monto: Number(a.monto) || 0,
    porPrenda: (a as AvioArticulo).porPrenda !== false,
  }))
}

export function ArticuloModal({ articulo, codigoSugerido, onClose, onSave }: Props) {
  const { compras, encimadas, articulos } = useErpStore()
  const usosStock = useMemo(
    () => usosStockDesdeDatos(encimadas, articulos),
    [encimadas, articulos],
  )
  const comprasLista = useMemo(
    () => comprasDesdeStock(compras, usosStock),
    [compras, usosStock],
  )
  const opcionesStock = useMemo(
    () => comprasLista.flatMap((c) => c.opciones),
    [comprasLista],
  )

  const [codigoArticulo, setCodigoArticulo] = useState(
    articulo?.codigoArticulo || codigoSugerido,
  )
  const [nombre, setNombre] = useState(articulo?.nombre || '')
  const [descripcion, setDescripcion] = useState(articulo?.descripcion || '')
  const [mostrarDescripcion, setMostrarDescripcion] = useState(!!articulo?.descripcion)
  const [cantidadPrendas, setCantidadPrendas] = useState<number>(
    articulo ? Number(articulo.cantidadPrendas) || 0 : 12,
  )

  const [telas, setTelas] = useState<TelaLine[]>(() => telasIniciales(articulo, opcionesStock))
  const [rollosEdit, setRollosEdit] = useState<Record<string, string>>({})
  const [selectedRolloKey, setSelectedRolloKey] = useState('')
  const [manoObra, setManoObra] = useState<number>(
    articulo ? Number(articulo.manoObra) || 0 : 0,
  )
  const [avios, setAvios] = useState<AvioLine[]>(() => aviosIniciales(articulo))
  const [margenGanancia, setMargenGanancia] = useState<number>(
    articulo ? Number(articulo.margenGanancia) || 0 : 100,
  )
  const [precioVenta, setPrecioVenta] = useState<number>(
    articulo ? Number(articulo.precioVenta) || 0 : 0,
  )
  const [precioManual, setPrecioManual] = useState(!!articulo?.precioVenta)
  const [encimadaId, setEncimadaId] = useState(articulo?.encimadaId || '')
  const [encimadaItemId, setEncimadaItemId] = useState(articulo?.encimadaItemId || '')

  // Estados para agregar un rollo custom (sin stock previo)
  const [mostrarFormCustom, setMostrarFormCustom] = useState(false)
  const [customTela, setCustomTela] = useState('')
  const [customColor, setCustomColor] = useState('')
  const [customUnidad, setCustomUnidad] = useState<UnidadTela>('METRO')
  const [customPrecio, setCustomPrecio] = useState<number>(0)
  const [customRollos, setCustomRollos] = useState<number>(1)
  const [customRollosEdit, setCustomRollosEdit] = useState<string | null>(null)
  const [customCantidad, setCustomCantidad] = useState<number>(0)
  const [customProveedor, setCustomProveedor] = useState('')

  const encimadaSeleccionada = encimadas.find((encimada) => encimada.id === encimadaId)
  const itemsEncimada = encimadaSeleccionada?.items ?? []
  const encimadasOrdenadas = useMemo(
    () => ordenarPorFechaYCodigoDesc(encimadas, (e) => e.fecha, (e) => e.codigo),
    [encimadas],
  )

  const handleEncimadaChange = (id: string) => {
    setEncimadaId(id)
    if (!id) {
      setEncimadaItemId('')
      return
    }
    const encimada = encimadas.find((item) => item.id === id)
    if (!encimada) {
      setEncimadaItemId('')
      return
    }
    const itemActual = encimada.items.find((item) => item.id === encimadaItemId)
    const itemMismoNombre = encimada.items.find(
      (item) => item.modeloNombre.trim().toLowerCase() === nombre.trim().toLowerCase(),
    )
    setEncimadaItemId(itemActual?.id ?? itemMismoNombre?.id ?? encimada.items[0]?.id ?? '')
  }

  // Opciones de rollos agrupadas por compra exactamente como en EncimadaModal
  const gruposStock = useMemo(() => {
    return comprasLista
      .map((compra) => ({
        ...compra,
        opciones: compra.opciones.filter(
          (op) =>
            op.rollosDisponibles > 0 &&
            !telas.some((t) => t.stockKey === op.stockKey),
        ),
      }))
      .filter((compra) => compra.opciones.length > 0)
  }, [comprasLista, telas])

  const cantPrendas = Math.max(0, Number(cantidadPrendas) || 0)

  // Cálculos de telas
  const telasCalculadas = telas.map((t) => {
    const rollosUsados = Math.max(
      0,
      Math.min(t.disponibleRollos, redondearRollos(t.rollosUsar ?? t.disponibleRollos)),
    )
    const cantidadPorRollo =
      t.disponibleRollos > 0 ? t.disponibleCantidad / t.disponibleRollos : 15
    const cantidadUsada = Math.round(cantidadPorRollo * rollosUsados * 10) / 10
    const costoUsado = Math.round(cantidadUsada * t.precioUnitario)
    return {
      ...t,
      rollosUsados,
      cantidadUsada,
      costoUsado,
    }
  })

  // Agrupación visual por tela y compra idéntica a EncimadaModal
  const gruposTelas = telasCalculadas.reduce<GrupoTelas[]>((grupos, tela) => {
    const key = `${tela.compraCodigo || 'C'}|${tela.telaNombre}`
    const grupo = grupos.find((g) => g.key === key)
    if (grupo) {
      grupo.telas.push(tela)
    } else {
      grupos.push({
        key,
        telaNombre: tela.telaNombre,
        compraCodigo: tela.compraCodigo,
        compraFecha: tela.compraFecha,
        proveedorNombre: tela.proveedorNombre,
        telas: [tela],
      })
    }
    return grupos
  }, [])

  const costoTelaTotal = telasCalculadas.reduce((a, t) => a + t.costoUsado, 0)
  const rollosTotales = telasCalculadas.reduce((a, t) => a + t.rollosUsados, 0)
  const costoTelaPorPrenda = cantPrendas > 0 ? Math.round((costoTelaTotal / cantPrendas) * 100) / 100 : 0

  const precioActualTela = (tela: {
    telaNombre: string
    colorNombre: string
    compraCodigo?: string
  }) => {
    if (tela.compraCodigo === 'CUSTOM') return undefined
    const telaNombre = tela.telaNombre.trim().toLowerCase()
    const colorNombre = tela.colorNombre.trim().toLowerCase()
    let masReciente: OpcionRollo | undefined
    for (const opcion of opcionesStock) {
      if (opcion.telaNombre.trim().toLowerCase() !== telaNombre) continue
      if (opcion.colorNombre.trim().toLowerCase() !== colorNombre) continue
      if (
        !masReciente ||
        String(opcion.compraFecha) > String(masReciente.compraFecha)
      ) {
        masReciente = opcion
      }
    }
    return masReciente && masReciente.precioUnitario > 0
      ? masReciente.precioUnitario
      : undefined
  }

  const telasConCambio = telasCalculadas.filter((tela) => {
    const precioActual = precioActualTela(tela)
    return (
      typeof precioActual === 'number' &&
      Math.abs(precioActual - tela.precioUnitario) > 0.5
    )
  })

  const costoConPreciosActuales = telasCalculadas.reduce((total, tela) => {
    const precioActual = precioActualTela(tela) ?? tela.precioUnitario
    return total + Math.round(tela.cantidadUsada * precioActual)
  }, 0)

  // Cálculos de avíos
  const aviosValidos = avios.filter((a) => a.nombre.trim() || Number(a.monto) > 0)
  const aviosPorPrendaDirectos = aviosValidos.reduce(
    (a, av) => a + (av.porPrenda ? Number(av.monto) || 0 : 0),
    0,
  )
  const aviosTotalesFijos = aviosValidos.reduce(
    (a, av) => a + (!av.porPrenda ? Number(av.monto) || 0 : 0),
    0,
  )
  const aviosPorPrenda =
    aviosPorPrendaDirectos + (cantPrendas > 0 ? Math.round((aviosTotalesFijos / cantPrendas) * 100) / 100 : 0)
  const aviosTotales = aviosTotalesFijos + aviosPorPrendaDirectos * cantPrendas

  // Costo total y unitario
  const manoObraPrenda = Math.max(0, Number(manoObra) || 0)
  const costoUnitario = costoTelaPorPrenda + manoObraPrenda + aviosPorPrenda
  const costoTotalProduccion = costoUnitario * cantPrendas

  // Precio y ganancia
  const margenNum = Number(margenGanancia) || 0
  const precioSugerido = Math.round(costoUnitario * (1 + margenNum / 100) * 100) / 100
  const precioVentaFinal = precioManual ? Number(precioVenta) || 0 : precioSugerido
  const gananciaUnitaria = precioVentaFinal - costoUnitario
  const gananciaTotal = gananciaUnitaria * cantPrendas
  const margenReal = costoUnitario > 0 ? (gananciaUnitaria / costoUnitario) * 100 : 0

  // Manejo de telas
  const agregarTelaDesdeStock = () => {
    if (!selectedRolloKey) return
    const opcion = opcionesStock.find((o) => o.key === selectedRolloKey)
    if (!opcion) return
    if (telas.some((t) => t.stockKey === opcion.key)) return

    const disponibleRollos = Math.max(1, opcion.rollosDisponibles)
    const nueva: TelaLine = {
      id: `tela-${telas.length + 1}`,
      stockKey: opcion.key,
      loteId: opcion.loteId,
      compraCodigo: opcion.compraCodigo,
      compraFecha: opcion.compraFecha,
      proveedorNombre: opcion.proveedorNombre,
      telaNombre: opcion.telaNombre,
      colorNombre: opcion.colorNombre,
      unidad: opcion.unidad,
      precioUnitario: opcion.precioUnitario,
      disponibleRollos,
      disponibleCantidad: opcion.cantidadDisponible,
      rollosUsar: disponibleRollos, // Por defecto carga todo el stock disponible
    }

    setTelas((prev) => [...prev, nueva])
    setSelectedRolloKey('')
  }

  const handleAgregarRolloCustom = () => {
    if (!customTela.trim() || !customColor.trim()) return

    const rollosNum = Math.max(1, Number(customRollos) || 1)
    const cantidadTotal = Number(customCantidad) > 0 ? Number(customCantidad) : rollosNum * 20
    const precio = Math.max(0, Number(customPrecio) || 0)
    const customKey = `custom-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`

    const nueva: TelaLine = {
      id: customKey,
      stockKey: customKey,
      compraCodigo: 'CUSTOM',
      compraFecha: new Date().toISOString().slice(0, 10),
      proveedorNombre: customProveedor.trim() || 'Rollo custom (sin stock)',
      telaNombre: customTela.trim(),
      colorNombre: customColor.trim(),
      unidad: customUnidad,
      precioUnitario: precio,
      disponibleRollos: rollosNum,
      disponibleCantidad: cantidadTotal,
      rollosUsar: rollosNum,
    }

    setTelas((prev) => [...prev, nueva])

    // Limpiar formulario y cerrar
    setCustomTela('')
    setCustomColor('')
    setCustomPrecio(0)
    setCustomCantidad(0)
    setCustomRollos(1)
    setCustomProveedor('')
    setMostrarFormCustom(false)
  }

  const updateRollosUsar = (id: string, rawVal: number | string) => {
    setTelas((prev) =>
      prev.map((t) => {
        if (t.id !== id) return t
        if (rawVal === '') return { ...t, rollosUsar: 0 }
        const num =
          typeof rawVal === 'string'
            ? parseFloat(rawVal.replace(',', '.'))
            : rawVal
        if (Number.isNaN(num)) return t
        const isCustom = t.compraCodigo === 'CUSTOM'
        const maxRollos = isCustom ? Math.max(t.disponibleRollos, num) : t.disponibleRollos
        const clamped = Math.max(0, Math.min(maxRollos, redondearRollos(num)))
        return {
          ...t,
          disponibleRollos: maxRollos,
          disponibleCantidad:
            isCustom && num > t.disponibleRollos
              ? (t.disponibleCantidad / (t.disponibleRollos || 1)) * maxRollos
              : t.disponibleCantidad,
          rollosUsar: clamped,
        }
      }),
    )
  }

  const removeTela = (id: string) => {
    setTelas((prev) => prev.filter((t) => t.id !== id))
  }

  const handleRecalcularPrecios = () => {
    if (telasConCambio.length === 0) {
      window.alert('Los precios de las telas ya están actualizados con la última compra.')
      return
    }

    const mensaje = [
      '¿Actualizar los precios de tela con la última compra de cada tela/color?',
      '',
      `Costo de tela actual: ${formatARS(costoTelaTotal)}`,
      `Costo de tela nuevo: ${formatARS(costoConPreciosActuales)}`,
      '',
      precioManual
        ? 'El precio de venta es manual y no se modifica. Usá "Sugerido" si querés recalcularlo con el margen actual.'
        : 'El precio de venta se recalculará automáticamente con el margen actual.',
    ].join('\n')

    if (!window.confirm(mensaje)) return

    setTelas((prev) =>
      prev.map((tela) => {
        const precioActual = precioActualTela(tela)
        return typeof precioActual === 'number' && precioActual > 0
          ? { ...tela, precioUnitario: precioActual }
          : tela
      }),
    )
  }

  // Manejo de avíos
  const addAvio = () => {
    setAvios((prev) => [
      ...prev,
      {
        id: `av-${prev.length + 1}`,
        nombre: '',
        monto: 0,
        porPrenda: true,
      },
    ])
  }

  const updateAvio = (id: string, patch: Partial<AvioLine>) => {
    setAvios((prev) => prev.map((a) => (a.id === id ? { ...a, ...patch } : a)))
  }

  const removeAvio = (id: string) => {
    setAvios((prev) => prev.filter((a) => a.id !== id))
  }

  const handleSave = () => {
    const telasData = telasCalculadas.map((t) => ({
      stockKey: t.stockKey,
      loteId: t.loteId,
      compraCodigo: t.compraCodigo,
      compraFecha: t.compraFecha,
      proveedorNombre: t.proveedorNombre,
      telaNombre: t.telaNombre,
      colorNombre: t.colorNombre,
      unidad: t.unidad,
      rollosUsados: t.rollosUsados,
      rollosDisponibles: t.disponibleRollos,
      rollosLibres: t.disponibleRollos - t.rollosUsados,
      cantidadUsar: t.cantidadUsada,
      cantidadLibre: t.disponibleCantidad - t.cantidadUsada,
      precioUnitario: t.precioUnitario,
      costoUsado: t.costoUsado,
    }))

    const payload = {
      ...(articulo ? { id: articulo.id, corteId: articulo.corteId } : {}),
      encimadaId: encimadaId || undefined,
      encimadaItemId: encimadaId ? encimadaItemId || undefined : undefined,
      codigoArticulo: codigoArticulo.trim() || codigoSugerido,
      nombre: nombre.trim() || descripcion.trim() || 'Artículo',
      descripcion: descripcion.trim(),
      cantidadPrendas: cantPrendas,
      tallerId: articulo?.tallerId || '',
      tallerNombre: articulo?.tallerNombre || 'Sin asignar',
      telas: telasData,
      costoTelaTotalUsado: costoTelaTotal,
      costoTelaPorPrenda,
      manoObra: manoObraPrenda,
      avios: aviosValidos.map((av, idx) => ({ ...av, id: `av-${idx + 1}` })),
      aviosPorPrenda,
      aviosTotales,
      costoUnitario,
      costoTotalProduccion,
      margenGanancia: margenNum,
      precioSugerido,
      precioVenta: precioVentaFinal,
      gananciaUnitaria,
      gananciaTotal,
      margenReal,
    }

    onSave(payload)
    onClose()
  }

  const telasValidas = telasCalculadas.every(
    (t) => t.rollosUsados > 0 && t.rollosUsados <= t.disponibleRollos,
  )
  const encimadaValida =
    !encimadaId ||
    !encimadaSeleccionada ||
    itemsEncimada.length === 0 ||
    Boolean(encimadaItemId)
  const puedeGuardar =
    cantPrendas > 0 &&
    (nombre.trim().length > 0 || descripcion.trim().length > 0) &&
    telasValidas &&
    encimadaValida

  return (
    <div className="fixed inset-0 z-50 flex items-stretch justify-center bg-black/40 sm:items-center sm:p-4">
      <div className="flex h-[100dvh] w-full max-w-3xl flex-col bg-white shadow-2xl sm:h-auto sm:max-h-[92vh] sm:rounded-xl">
        {/* Cabecera */}
        <div className="flex items-center justify-between border-b border-stone-200 px-4 py-3 sm:px-5">
          <div className="min-w-0">
            <h2 className="truncate text-sm font-semibold text-stone-900 sm:text-base">
              {articulo ? `Editar artículo · ${articulo.codigoArticulo}` : 'Nuevo artículo de producción'}
            </h2>
            <p className="hidden text-xs text-stone-500 sm:block">
              Datos de la prenda, telas consumidas del stock y costeo de fabricación.
            </p>
            <p className="text-[11px] text-stone-500 sm:hidden">
              Completá la prenda y elegí las telas del stock.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded text-stone-400 hover:bg-stone-100 hover:text-stone-700"
          >
            ✕
          </button>
        </div>

        {/* 1. Datos básicos de la prenda */}
        <div className="border-b border-stone-200 bg-stone-50 px-4 py-3 sm:px-5">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <div className="order-1 sm:order-none">
              <label className={labelCls}>Código</label>
              <input
                className={inputCls}
                value={codigoArticulo}
                onFocus={(e) => e.currentTarget.select()}
                onChange={(e) => setCodigoArticulo(e.target.value)}
              />
            </div>
            <div className="order-3 col-span-2 sm:order-none sm:col-span-1">
              <div className="flex items-center justify-between">
                <label className={labelCls}>Nombre de prenda</label>
                <button
                  type="button"
                  onClick={() => setMostrarDescripcion((prev) => !prev)}
                  className="mb-1 text-[11px] font-medium text-amber-700 sm:hidden"
                >
                  {mostrarDescripcion ? 'Ocultar descripción' : '+ Descripción'}
                </button>
              </div>
              <input
                className={inputCls}
                value={nombre}
                onFocus={(e) => e.currentTarget.select()}
                onChange={(e) => setNombre(e.target.value)}
                placeholder="Ej. Camisa corta"
              />
            </div>
            <div
              className={`order-4 col-span-2 sm:order-none sm:col-span-1 ${
                mostrarDescripcion ? '' : 'hidden sm:block'
              }`}
            >
              <label className={labelCls}>Descripción (opcional)</label>
              <input
                className={inputCls}
                value={descripcion}
                onFocus={(e) => e.currentTarget.select()}
                onChange={(e) => setDescripcion(e.target.value)}
                placeholder="Ej. Manga corta, cuello mao"
              />
            </div>
            <div className="order-2 sm:order-none">
              <label className={labelCls}>Prendas a confeccionar</label>
              <input
                type="number"
                min="1"
                className={inputCls}
                value={cantidadPrendas || ''}
                onFocus={(e) => e.currentTarget.select()}
                onChange={(e) => setCantidadPrendas(Number(e.target.value) || 0)}
                placeholder="12"
              />
            </div>
          </div>
        </div>

        {/* Cuerpo del formulario */}
        <div className="flex-1 space-y-4 overflow-y-auto p-4 sm:p-5">
          {!articulo && (
            <details className="group rounded-lg border border-stone-200 bg-white p-3.5 shadow-sm">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-2 [&::-webkit-details-marker]:hidden">
                <div>
                  <span className="text-xs font-semibold uppercase tracking-wide text-stone-700">
                    Encimada de origen (opcional)
                  </span>
                  <p className="mt-0.5 text-xs text-stone-500">
                    Tocá para asociar este artículo a una encimada existente.
                  </p>
                </div>
                <span className="shrink-0 text-xs text-stone-400 transition-transform group-open:rotate-180">
                  ▾
                </span>
              </summary>
              <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div>
                  <label className={labelCls}>Encimada</label>
                  <select
                    className={inputCls}
                    value={encimadaId}
                    onChange={(e) => handleEncimadaChange(e.target.value)}
                  >
                    <option value="">Sin asociar</option>
                    {encimadasOrdenadas.map((encimada) => (
                      <option key={encimada.id} value={encimada.id}>
                        {encimada.codigo} · {encimada.items.length}{' '}
                        {encimada.items.length === 1 ? 'modelo' : 'modelos'}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className={labelCls}>Modelo de la encimada</label>
                  <select
                    className={inputCls}
                    value={encimadaItemId}
                    disabled={!encimadaSeleccionada || itemsEncimada.length === 0}
                    onChange={(e) => setEncimadaItemId(e.target.value)}
                  >
                    <option value="">
                      {!encimadaSeleccionada
                        ? 'Elegí una encimada'
                        : itemsEncimada.length === 0
                          ? 'La encimada no tiene modelos'
                          : 'Seleccionar modelo'}
                    </option>
                    {itemsEncimada.map((item) => (
                      <option key={item.id} value={item.id}>
                        {item.modeloNombre} · {item.cantidad} u/capa
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </details>
          )}

          {/* 2. Telas del stock agrupadas por compra con chips de color (como EncimadaModal) */}
          <div className="rounded-lg border border-stone-200 bg-white p-3.5 shadow-sm">
            <div className="mb-2.5 flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold uppercase tracking-wide text-stone-700">
                  Telas y rollos del stock
                </span>
                <span className="rounded-full bg-stone-100 px-2 py-0.5 text-[10px] font-medium text-stone-600">
                  {telasCalculadas.length} {telasCalculadas.length === 1 ? 'color' : 'colores'} · {formatRollos(rollosTotales)} {rollosTotales === 1 ? 'rollo' : 'rollos'}
                </span>
              </div>
              <div className="flex flex-wrap items-center gap-3">
                {articulo && (
                  <button
                    type="button"
                    onClick={handleRecalcularPrecios}
                    disabled={telasConCambio.length === 0}
                    title={
                      telasConCambio.length > 0
                        ? 'Compara con la última compra de cada tela/color'
                        : 'Los precios coinciden con la última compra'
                    }
                    className={`rounded-md border px-2.5 py-1 text-[11px] font-medium transition ${
                      telasConCambio.length > 0
                        ? 'border-amber-300 bg-amber-50 text-amber-800 hover:bg-amber-100'
                        : 'cursor-default border-stone-200 bg-stone-50 text-stone-400'
                    }`}
                  >
                    {telasConCambio.length > 0
                      ? `Actualizar precios (${telasConCambio.length})`
                      : 'Precios al día'}
                  </button>
                )}
                <div className="text-xs text-stone-600">
                  Total tela: <strong className="text-stone-900"><Money value={costoTelaTotal} /></strong>
                  {cantPrendas > 0 && (
                    <span className="text-stone-500 font-medium"> (<Money value={costoTelaPorPrenda} /> / prenda)</span>
                  )}
                </div>
              </div>
            </div>

            {/* Selector agrupado por compra exactamente como EncimadaModal */}
            <div className="mb-3 flex flex-col items-stretch gap-2 sm:flex-row sm:items-center">
              <select
                className={inputCls}
                value={selectedRolloKey}
                onChange={(e) => setSelectedRolloKey(e.target.value)}
              >
                <option value="">-- Seleccionar tela y color del stock --</option>
                {gruposStock.map((compra) => {
                  const telasNombres = Array.from(
                    new Set(compra.opciones.map((op) => op.telaNombre)),
                  )
                  return (
                    <optgroup
                      key={compra.codigo}
                      label={`${telasNombres.join(' / ')} · ${compra.codigo} (${compra.proveedorNombre})`}
                    >
                      {compra.opciones.map((op) => (
                        <option key={op.key} value={op.key}>
                          {telasNombres.length > 1 ? `${op.telaNombre} · ` : ''}
                          {op.colorNombre} · {formatRollos(op.rollosDisponibles)}{' '}
                          {op.rollosDisponibles === 1 ? 'rollo disponible' : 'rollos disponibles'}
                        </option>
                      ))}
                    </optgroup>
                  )
                })}
              </select>
              <Button
                size="sm"
                variant="secondary"
                disabled={!selectedRolloKey}
                onClick={agregarTelaDesdeStock}
              >
                + Usar tela
              </Button>
              <Button
                size="sm"
                variant="secondary"
                onClick={() => setMostrarFormCustom((prev) => !prev)}
                className="shrink-0 text-amber-900 border-amber-300 bg-amber-50 hover:bg-amber-100 font-medium"
              >
                {mostrarFormCustom ? '✕ Cancelar' : '✨ + Rollo custom'}
              </Button>
            </div>

            {/* Formulario para agregar Rollo Custom / Tela no registrada */}
            {mostrarFormCustom && (
              <div className="mb-3 rounded-lg border border-amber-300 bg-amber-50/70 p-3.5 space-y-3 shadow-xs">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-amber-950">
                    <span>✨</span>
                    <span>Cargar rollo custom (tela no registrada en stock)</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setMostrarFormCustom(false)}
                    className="text-stone-400 hover:text-stone-700 text-xs px-1"
                  >
                    ✕
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                  <div>
                    <label className="text-[11px] font-medium text-stone-700 block mb-1">
                      Nombre de tela *
                    </label>
                    <input
                      type="text"
                      placeholder="Ej: Poplin, Sastrero..."
                      value={customTela}
                      onChange={(e) => setCustomTela(e.target.value)}
                      className="h-8 w-full rounded border border-stone-300 bg-white px-2 text-xs text-stone-900 focus:border-amber-600 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-medium text-stone-700 block mb-1">
                      Color *
                    </label>
                    <input
                      type="text"
                      placeholder="Ej: Negro, Azul, Crudo..."
                      value={customColor}
                      onChange={(e) => setCustomColor(e.target.value)}
                      className="h-8 w-full rounded border border-stone-300 bg-white px-2 text-xs text-stone-900 focus:border-amber-600 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-medium text-stone-700 block mb-1">
                      Unidad de medida
                    </label>
                    <select
                      value={customUnidad}
                      onChange={(e) => setCustomUnidad(e.target.value as UnidadTela)}
                      className="h-8 w-full rounded border border-stone-300 bg-white px-2 text-xs text-stone-900 focus:border-amber-600 focus:outline-none"
                    >
                      <option value="METRO">Metro (m)</option>
                      <option value="KILO">Kilo (kg)</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-[11px] font-medium text-stone-700 block mb-1">
                      Precio x {customUnidad === 'METRO' ? 'metro' : 'kilo'} ($)
                    </label>
                    <input
                      type="number"
                      min="0"
                      placeholder="Ej: 12500"
                      value={customPrecio || ''}
                      onChange={(e) =>
                        setCustomPrecio(e.target.value === '' ? 0 : Number(e.target.value))
                      }
                      className="h-8 w-full rounded border border-stone-300 bg-white px-2 text-xs text-stone-900 focus:border-amber-600 focus:outline-none text-right font-mono"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                  <div>
                    <label className="text-[11px] font-medium text-stone-700 block mb-1">
                      Cantidad de rollos
                    </label>
                    <input
                      type="text"
                      inputMode="decimal"
                      value={customRollosEdit ?? formatRollos(customRollos)}
                      onFocus={(e) => {
                        e.currentTarget.select()
                        setCustomRollosEdit(String(redondearRollos(customRollos)))
                      }}
                      onChange={(e) => {
                        const raw = e.target.value
                        setCustomRollosEdit(raw)
                        if (raw.trim() === '' || /[.,]$/.test(raw.trim())) return
                        const parsed = parseFloat(raw.replace(',', '.'))
                        if (!Number.isNaN(parsed)) {
                          setCustomRollos(Math.max(0.5, redondearRollos(parsed)))
                        }
                      }}
                      onBlur={() => {
                        setCustomRollosEdit(null)
                        setCustomRollos((prev) => Math.max(0.5, redondearRollos(prev)))
                      }}
                      className="h-8 w-full rounded border border-stone-300 bg-white px-2 text-xs text-stone-900 focus:border-amber-600 focus:outline-none text-center font-bold"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-medium text-stone-700 block mb-1">
                      Total {customUnidad === 'METRO' ? 'metros' : 'kilos'} estim.
                    </label>
                    <input
                      type="number"
                      min="0"
                      step="0.1"
                      placeholder="Ej: 20"
                      value={customCantidad || ''}
                      onChange={(e) =>
                        setCustomCantidad(e.target.value === '' ? 0 : Number(e.target.value))
                      }
                      className="h-8 w-full rounded border border-stone-300 bg-white px-2 text-xs text-stone-900 focus:border-amber-600 focus:outline-none text-right font-mono"
                    />
                  </div>

                  <div className="col-span-2">
                    <label className="text-[11px] font-medium text-stone-700 block mb-1">
                      Proveedor / Detalle (opcional)
                    </label>
                    <input
                      type="text"
                      placeholder="Ej: Compra directa, Sin remito..."
                      value={customProveedor}
                      onChange={(e) => setCustomProveedor(e.target.value)}
                      className="h-8 w-full rounded border border-stone-300 bg-white px-2 text-xs text-stone-900 focus:border-amber-600 focus:outline-none"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-end gap-2 pt-1 border-t border-amber-200">
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => setMostrarFormCustom(false)}
                  >
                    Cancelar
                  </Button>
                  <Button
                    size="sm"
                    onClick={handleAgregarRolloCustom}
                    disabled={!customTela.trim() || !customColor.trim()}
                    className="bg-amber-800 hover:bg-amber-900 text-white font-medium"
                  >
                    + Agregar rollo custom
                  </Button>
                </div>
              </div>
            )}

            {/* Visualización en tarjetas compactas con chips de color */}
            {telasCalculadas.length === 0 ? (
              <div className="rounded-lg border border-dashed border-stone-200 px-3 py-4 text-center text-xs text-stone-400">
                No hay telas asignadas. Seleccioná una tela del stock arriba para computar su costo.
              </div>
            ) : (
              <div className="space-y-2.5">
                {gruposTelas.map((grupo) => {
                  const rollosGrupo = grupo.telas.reduce(
                    (a, t) => a + (Number(t.rollosUsados) || 0),
                    0,
                  )
                  const rollosDisponiblesGrupo = grupo.telas.reduce(
                    (a, t) => a + (Number(t.disponibleRollos) || 0),
                    0,
                  )
                  const costoGrupo = grupo.telas.reduce(
                    (a, t) => a + (Number(t.costoUsado) || 0),
                    0,
                  )
                  return (
                    <div
                      key={grupo.key}
                      className="rounded-lg border border-stone-200 bg-stone-50/70 p-2.5"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-1 border-b border-stone-200 pb-1.5 mb-2">
                        <div className="flex min-w-0 flex-wrap items-center gap-1.5">
                          <span className="text-xs font-semibold text-stone-900">
                            {grupo.telaNombre}
                          </span>
                          {grupo.compraCodigo === 'CUSTOM' ? (
                            <span className="rounded bg-amber-100 text-amber-900 border border-amber-300 px-1.5 py-0.5 text-[10px] font-bold">
                              🏷️ Rollo Custom
                            </span>
                          ) : (
                            grupo.compraCodigo && (
                              <span className="rounded bg-white px-1.5 py-0.5 font-mono text-[10px] text-stone-500 ring-1 ring-stone-200">
                                {grupo.compraCodigo}
                              </span>
                            )
                          )}
                          {grupo.proveedorNombre && (
                            <span className="text-[11px] text-stone-400">· {grupo.proveedorNombre}</span>
                          )}
                        </div>
                        <div className="flex items-center gap-2 text-[11px] text-stone-500">
                          <span>
                            Stock total: <strong className="font-semibold text-stone-700">{formatRollos(rollosDisponiblesGrupo)} {rollosDisponiblesGrupo === 1 ? 'rollo' : 'rollos'}</strong>
                          </span>
                          <span>·</span>
                          <span>
                            En uso: <strong className="font-semibold text-amber-800">{formatRollos(rollosGrupo)}</strong>
                          </span>
                          <span>·</span>
                          <span>
                            Subtotal: <strong className="text-stone-800"><Money value={costoGrupo} /></strong>
                          </span>
                        </div>
                      </div>

                      {/* Chips de color */}
                      <div className="flex flex-wrap gap-2">
                        {grupo.telas.map((tela) => {
                          const quedan = tela.disponibleRollos - tela.rollosUsados
                          const esTodo = tela.rollosUsados >= tela.disponibleRollos
                          return (
                            <div
                              key={tela.id}
                              className={`flex w-full flex-wrap items-center gap-2 rounded-xl border bg-white px-2.5 py-2 shadow-sm transition-colors sm:w-auto sm:flex-nowrap sm:rounded-full sm:py-1 sm:pl-3 sm:pr-1.5 ${
                                tela.rollosUsados === 0
                                  ? 'border-amber-400 bg-amber-50/50'
                                  : 'border-stone-200'
                              }`}
                            >
                              <span
                                className={`h-3 w-3 shrink-0 rounded-full border border-stone-300 ${
                                  COLOR_SWATCH[tela.colorNombre] ?? 'bg-stone-200'
                                }`}
                              />
                              <div className="flex flex-col">
                                <span className="text-xs font-semibold text-stone-800 leading-tight">
                                  {tela.colorNombre}
                                </span>
                                <span className="text-[10px] text-stone-400 leading-tight">
                                  Disp: {formatRollos(tela.disponibleRollos)} {tela.disponibleRollos === 1 ? 'rollo' : 'rollos'}
                                </span>
                              </div>

                              <div className="flex items-center gap-1 bg-stone-100/80 rounded-lg p-0.5 border border-stone-200">
                                <button
                                  type="button"
                                  disabled={tela.rollosUsados <= 0.5}
                                  onClick={() => updateRollosUsar(tela.id, tela.rollosUsados - 0.5)}
                                  className="h-6 w-6 flex items-center justify-center rounded bg-white text-stone-700 font-bold hover:bg-stone-50 disabled:opacity-30 disabled:cursor-not-allowed shadow-xs text-xs"
                                  title="Usar medio rollo menos"
                                >
                                  −
                                </button>
                                <input
                                  type="text"
                                  inputMode="decimal"
                                  className="h-6 w-11 rounded border border-stone-300 bg-white px-1 text-center text-xs font-bold text-stone-900 focus:border-amber-600 focus:outline-none"
                                  value={
                                    rollosEdit[tela.id] ??
                                    (tela.rollosUsar === 0 ? '' : formatRollos(tela.rollosUsar))
                                  }
                                  onFocus={(e) => {
                                    e.currentTarget.select()
                                    setRollosEdit((prev) => ({
                                      ...prev,
                                      [tela.id]:
                                        tela.rollosUsar === 0
                                          ? ''
                                          : String(redondearRollos(tela.rollosUsar)),
                                    }))
                                  }}
                                  onChange={(e) => {
                                    const raw = e.target.value
                                    setRollosEdit((prev) => ({ ...prev, [tela.id]: raw }))
                                    if (raw.trim() === '' || /[.,]$/.test(raw.trim())) return
                                    updateRollosUsar(tela.id, raw)
                                  }}
                                  onBlur={() => {
                                    setRollosEdit((prev) => {
                                      const next = { ...prev }
                                      delete next[tela.id]
                                      return next
                                    })
                                    if (!tela.rollosUsar || tela.rollosUsar < 0.5) {
                                      updateRollosUsar(tela.id, 0.5)
                                    } else if (tela.rollosUsar > tela.disponibleRollos) {
                                      updateRollosUsar(tela.id, tela.disponibleRollos)
                                    }
                                  }}
                                  title={`Rollos a consumir (podés usar medios). Máximo disponible: ${formatRollos(tela.disponibleRollos)}`}
                                />
                                <button
                                  type="button"
                                  disabled={tela.compraCodigo !== 'CUSTOM' && tela.rollosUsados >= tela.disponibleRollos}
                                  onClick={() => updateRollosUsar(tela.id, tela.rollosUsados + 0.5)}
                                  className="h-6 w-6 flex items-center justify-center rounded bg-white text-stone-700 font-bold hover:bg-stone-50 disabled:opacity-30 disabled:cursor-not-allowed shadow-xs text-xs"
                                  title="Usar medio rollo más"
                                >
                                  +
                                </button>
                                <span className="text-[11px] font-semibold text-stone-600 px-1">
                                  / {formatRollos(tela.disponibleRollos)}
                                </span>
                              </div>

                              <span
                                className={`rounded px-1.5 py-0.5 text-[10px] font-medium ${
                                  esTodo
                                    ? 'bg-emerald-50 text-emerald-700'
                                    : 'bg-stone-100 text-stone-600'
                                }`}
                              >
                                {esTodo ? 'Todo el stock' : `Quedan ${formatRollos(quedan)}`}
                              </span>

                              <span className="text-xs font-bold text-stone-800 tabular-nums pl-1">
                                <Money value={tela.costoUsado} />
                              </span>

                              <button
                                type="button"
                                onClick={() => removeTela(tela.id)}
                                className="flex h-5 w-5 items-center justify-center rounded-full text-[11px] text-stone-400 hover:bg-stone-100 hover:text-red-600"
                                title="Quitar este color"
                              >
                                ✕
                              </button>
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>

          {/* 3. Confección (Mano de obra) y Avíos en columnas */}
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {/* Mano de obra */}
            <div className="rounded-lg border border-stone-200 bg-white p-3.5 shadow-sm">
              <span className="text-xs font-semibold uppercase tracking-wide text-stone-700">
                Confección / Taller
              </span>
              <p className="mt-0.5 text-xs text-stone-500">
                Pago estimado al taller de costura por prenda terminada.
              </p>
              <div className="mt-3">
                <label className={labelCls}>Mano de obra por prenda ($)</label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min="0"
                    className={inputCls}
                    value={manoObra || ''}
                    onFocus={(e) => e.currentTarget.select()}
                    onChange={(e) => setManoObra(Number(e.target.value) || 0)}
                    placeholder="0"
                  />
                </div>
              </div>
              <div className="mt-2 text-right text-xs text-stone-500">
                Total taller: <strong className="text-stone-800"><Money value={manoObraPrenda * cantPrendas} /></strong>
              </div>
            </div>

            {/* Avíos e insumos */}
            <div className="rounded-lg border border-stone-200 bg-white p-3.5 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-xs font-semibold uppercase tracking-wide text-stone-700">
                    Avíos e insumos
                  </span>
                  <p className="mt-0.5 text-xs text-stone-500">Botones, cierres, hilo, etiquetas.</p>
                </div>
                <button
                  type="button"
                  onClick={addAvio}
                  className="rounded px-2 py-0.5 text-xs font-medium text-amber-700 hover:bg-amber-50"
                >
                  + Agregar
                </button>
              </div>

              <div className="mt-2.5 space-y-2">
                {avios.length === 0 ? (
                  <p className="text-xs text-stone-400 italic">Sin avíos cargados.</p>
                ) : (
                  avios.map((av) => (
                    <div key={av.id} className="flex items-center gap-2">
                      <input
                        className={inputCls}
                        value={av.nombre}
                        onFocus={(e) => e.currentTarget.select()}
                        onChange={(e) => updateAvio(av.id, { nombre: e.target.value })}
                        placeholder="Insumo (ej. Botones)"
                      />
                      <input
                        type="number"
                        min="0"
                        className={numberInputCls}
                        value={av.monto || ''}
                        onFocus={(e) => e.currentTarget.select()}
                        onChange={(e) => updateAvio(av.id, { monto: Number(e.target.value) || 0 })}
                        placeholder="$"
                      />
                      <button
                        type="button"
                        onClick={() => removeAvio(av.id)}
                        className="text-xs text-stone-400 hover:text-red-600 px-1"
                        title="Quitar"
                      >
                        ✕
                      </button>
                    </div>
                  ))
                )}
                {aviosPorPrenda > 0 && (
                  <div className="pt-1 text-right text-xs text-stone-500">
                    Subtotal avíos: <strong className="text-stone-800"><Money value={aviosPorPrenda} /></strong> / prenda
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* 4. Resumen de Costos, Precio de Venta y Margen */}
          <div className="rounded-lg border border-stone-200 bg-stone-50/80 p-3.5">
            <div className="mb-2.5 flex items-center justify-between border-b border-stone-200 pb-2">
              <span className="text-xs font-semibold uppercase tracking-wide text-stone-700">
                Rentabilidad y precio al público
              </span>
              <div className="text-xs text-stone-600">
                Costo unitario prenda:{' '}
                <strong className="text-base font-bold text-stone-900"><Money value={costoUnitario} /></strong>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              <div>
                <label className={labelCls}>% Margen deseado</label>
                <div className="flex items-center gap-1">
                  <input
                    type="number"
                    min="0"
                    className={inputCls}
                    value={margenGanancia || ''}
                    onFocus={(e) => e.currentTarget.select()}
                    onChange={(e) => {
                      setMargenGanancia(Number(e.target.value) || 0)
                      setPrecioManual(false)
                    }}
                    placeholder="100"
                  />
                  <span className="text-xs text-stone-500">%</span>
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between">
                  <label className={labelCls}>Precio venta</label>
                  {precioManual && (
                    <button
                      type="button"
                      onClick={() => setPrecioManual(false)}
                      className="text-[11px] font-medium text-amber-700 hover:underline"
                    >
                      Sugerido
                    </button>
                  )}
                </div>
                <input
                  type="number"
                  min="0"
                  className={inputCls}
                  value={precioManual ? precioVenta || '' : precioSugerido || ''}
                  onFocus={(e) => e.currentTarget.select()}
                  onChange={(e) => {
                    setPrecioManual(true)
                    setPrecioVenta(Number(e.target.value) || 0)
                  }}
                  placeholder="Precio"
                />
              </div>

              <div className="rounded-lg border border-stone-200 bg-white p-2.5">
                <div className="text-[11px] text-stone-500">Ganancia / prenda</div>
                <div className="text-base font-bold text-emerald-800">
                  <Money value={gananciaUnitaria} />
                </div>
                <div className="text-[10px] text-stone-400">
                  Margen: {margenReal.toFixed(1)}%
                </div>
              </div>

              <div className="rounded-lg border border-stone-200 bg-white p-2.5">
                <div className="text-[11px] text-stone-500">Ganancia total ({cantPrendas} un.)</div>
                <div className="text-base font-bold text-emerald-900">
                  <Money value={gananciaTotal} />
                </div>
                <div className="text-[10px] text-stone-400">
                  Venta: <Money value={precioVentaFinal * cantPrendas} />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Pie con acciones */}
        <div className="flex flex-col gap-2 border-t border-stone-200 bg-white px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-5">
          <div className="order-2 text-center text-[11px] text-stone-500 sm:order-1 sm:text-left sm:text-xs">
            {cantPrendas} prendas · Costo total:{' '}
            <strong className="text-stone-800"><Money value={costoTotalProduccion} /></strong>
          </div>
          <div className="order-1 flex gap-2 sm:order-2">
            <Button variant="secondary" className="flex-1 sm:flex-none" onClick={onClose}>
              Cancelar
            </Button>
            <Button className="flex-1 sm:flex-none" disabled={!puedeGuardar} onClick={handleSave}>
              {articulo ? 'Guardar cambios' : 'Guardar artículo'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
