import { useState, useMemo } from 'react'
import { Button } from '../../../shared/components/Button'
import { Money } from '../../../shared/components/Money'
import { mockColores, mockModelos } from '../../../data/mock'
import { uid } from '../../../utils/format'
import { comprasDesdeStock } from '../../articulos/stockRollos'
import { useErpStore } from '../../../data/erpStore'
import type {
  CargaCapas,
  Encimada,
  EncimadaItem,
  EstadoEncimada,
  TelaUsadaEncimada,
} from '../../../types'

interface Props {
  encimada?: Encimada
  codigoSugerido: string
  onClose: () => void
  onSave: (encimada: Encimada) => void
}

interface CapaFila {
  id: string
  color: string
  capas: number
}

interface GrupoTelas {
  key: string
  telaNombre: string
  proveedorNombre: string
  compraCodigo: string
  compraFecha: string
  telas: TelaUsadaEncimada[]
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
  'h-9 sm:h-8 w-full rounded border border-stone-300 bg-white px-2 text-sm text-stone-900 focus:border-amber-600 focus:outline-none'
const numberInputCls =
  'h-9 sm:h-8 w-20 rounded border border-stone-300 bg-white px-2 text-center text-sm font-semibold text-stone-900 focus:border-amber-600 focus:outline-none'
const labelCls = 'mb-1 block text-xs font-medium text-stone-500'
const th = 'px-3 py-2 text-xs font-semibold uppercase tracking-wide text-stone-500'
const thRight = `${th} text-right`
const td = 'px-3 py-1.5 text-sm text-stone-900'
const tdRight = `${td} text-right tabular-nums`

function calcularPorcentajesPonderados(cantidades: number[]): number[] {
  const total = cantidades.reduce((a, b) => a + (Number(b) || 0), 0)
  if (total <= 0) {
    const igual = Math.round((100 / (cantidades.length || 1)) * 10) / 10
    return cantidades.map(() => igual)
  }

  let acumulado = 0
  return cantidades.map((c, idx) => {
    if (idx === cantidades.length - 1) {
      return Math.round((100 - acumulado) * 10) / 10
    }
    const pct = Math.round(((Number(c) || 0) / total) * 1000) / 10
    acumulado += pct
    return pct
  })
}

function filasDesdeEncimada(encimada?: Encimada): CapaFila[] {
  const agrupadas = new Map<string, CapaFila>()

  for (const carga of encimada?.cargas ?? []) {
    const key = carga.colorNombre.trim().toLowerCase()
    if (!key) continue
    const actual = agrupadas.get(key)
    if (actual) actual.capas += carga.capas
    else agrupadas.set(key, { id: uid('fila'), color: carga.colorNombre, capas: carga.capas })
  }

  const filas = Array.from(agrupadas.values())
  return filas.length ? filas : [{ id: uid('fila'), color: '', capas: 0 }]
}

export function EncimadaModal({ encimada, codigoSugerido, onClose, onSave }: Props) {
  const [codigo, setCodigo] = useState(encimada?.codigo ?? codigoSugerido)
  const [fecha, setFecha] = useState(encimada?.fecha ?? new Date().toISOString().slice(0, 10))
  const [estado, setEstado] = useState<EstadoEncimada>(encimada?.estado ?? 'EN_CORTE')
  const [notas, setNotas] = useState(encimada?.notas ?? '')
  const [filas, setFilas] = useState<CapaFila[]>(() => filasDesdeEncimada(encimada))
  const [telasUsadas, setTelasUsadas] = useState<TelaUsadaEncimada[]>(
    encimada?.telasUsadas ?? [],
  )
  const [selectedRolloKey, setSelectedRolloKey] = useState('')

  // Estados para rollo custom en Encimada
  const [mostrarFormCustom, setMostrarFormCustom] = useState(false)
  const [customTela, setCustomTela] = useState('')
  const [customColor, setCustomColor] = useState('')
  const [customUnidad, setCustomUnidad] = useState<'METRO' | 'KILO'>('METRO')
  const [customPrecio, setCustomPrecio] = useState<number>(0)
  const [customRollos, setCustomRollos] = useState<number>(1)
  const [customCantidad, setCustomCantidad] = useState<number>(0)
  const [customProveedor, setCustomProveedor] = useState('')

  const [items, setItems] = useState<EncimadaItem[]>(() => {
    if (encimada?.items && encimada.items.length > 0) {
      const tienePcts = encimada.items.every(
        (i) => typeof i.porcentaje === 'number' && i.porcentaje > 0,
      )
      if (tienePcts) return encimada.items
      const pcts = calcularPorcentajesPonderados(encimada.items.map((i) => i.cantidad))
      return encimada.items.map((it, idx) => ({ ...it, porcentaje: pcts[idx] }))
    }
    return [{ id: uid('ei'), modeloNombre: '', cantidad: 0, porcentaje: 100 }]
  })

  const largoCapa = encimada?.largoCapa ?? 1.2
  const capasTotales = filas.reduce((a, f) => a + (Number(f.capas) || 0), 0)
  const prendasTotales = items.reduce(
    (a, i) => a + capasTotales * (Number(i.cantidad) || 0),
    0,
  )
  const costoTotalTelas = telasUsadas.reduce(
    (a, t) => a + (Number(t.costoUsado) || 0),
    0,
  )
  const rollosTotales = telasUsadas.reduce(
    (a, t) => a + (Number(t.rollosUsados) || 0),
    0,
  )
  const itemsValidos = items.filter((i) => i.modeloNombre.trim() && i.cantidad > 0)
  const cargasValidas = filas.filter((f) => f.color.trim() && f.capas > 0)
  const puedeGuardar = cargasValidas.length > 0 && itemsValidos.length > 0

  const gruposTelas = telasUsadas.reduce<GrupoTelas[]>((grupos, tela) => {
    const key = `${tela.compraCodigo}|${tela.telaId}`
    const grupo = grupos.find((g) => g.key === key)
    if (grupo) grupo.telas.push(tela)
    else
      grupos.push({
        key,
        telaNombre: tela.telaNombre,
        proveedorNombre: tela.proveedorNombre,
        compraCodigo: tela.compraCodigo,
        compraFecha: tela.compraFecha,
        telas: [tela],
      })
    return grupos
  }, [])

  const { compras } = useErpStore()
  const comprasLista = useMemo(() => comprasDesdeStock(compras), [compras])

  const gruposStock = useMemo(() => {
    return comprasLista
      .map((compra) => ({
        ...compra,
        opciones: compra.opciones.filter(
          (op) =>
            op.rollosDisponibles > 0 &&
            !telasUsadas.some((t) => t.stockKey === op.stockKey),
        ),
      }))
      .filter((compra) => compra.opciones.length > 0)
  }, [comprasLista, telasUsadas])

  const opcionesStock = useMemo(() => {
    return comprasLista.flatMap((compra) => compra.opciones)
  }, [comprasLista])

  const agregarTelaDesdeStock = () => {
    const opcion = opcionesStock.find((op) => op.key === selectedRolloKey)
    if (!opcion) return

    const rollosUsados = Math.max(1, opcion.rollosDisponibles)
    const promPorRollo =
      opcion.rollosDisponibles > 0
        ? opcion.cantidadDisponible / opcion.rollosDisponibles
        : 15
    const cantidadUsada = Math.round(rollosUsados * promPorRollo * 10) / 10
    const costoUsado = Math.round(cantidadUsada * opcion.precioUnitario)

    const nuevaTela: TelaUsadaEncimada = {
      id: uid('tue'),
      stockKey: opcion.stockKey,
      loteId: opcion.loteId,
      compraCodigo: opcion.compraCodigo,
      compraFecha: opcion.compraFecha,
      proveedorNombre: opcion.proveedorNombre,
      telaId: opcion.telaId,
      telaNombre: opcion.telaNombre,
      colorId: opcion.colorId,
      colorNombre: opcion.colorNombre,
      unidad: opcion.unidad,
      precioUnitario: opcion.precioUnitario,
      rollosDisponibles: opcion.rollosDisponibles,
      cantidadDisponible: opcion.cantidadDisponible,
      rollosUsados,
      cantidadUsada,
      costoUsado,
    }

    setTelasUsadas((prev) => [...prev, nuevaTela])
    setSelectedRolloKey('')

    // Asegurar que el color esté en la tabla de capas por conveniencia
    setFilas((prev) => {
      const existe = prev.some(
        (f) => f.color.trim().toLowerCase() === opcion.colorNombre.trim().toLowerCase(),
      )
      if (!existe) {
        if (prev.length === 1 && !prev[0].color.trim()) {
          return [{ id: prev[0].id, color: opcion.colorNombre, capas: prev[0].capas || 0 }]
        }
        return [...prev, { id: uid('fila'), color: opcion.colorNombre, capas: 0 }]
      }
      return prev
    })
  }

  const handleAgregarRolloCustom = () => {
    if (!customTela.trim() || !customColor.trim()) return

    const rollosNum = Math.max(1, Number(customRollos) || 1)
    const cantidadTotal = Number(customCantidad) > 0 ? Number(customCantidad) : rollosNum * 20
    const precio = Math.max(0, Number(customPrecio) || 0)
    const customKey = `custom-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`

    const nuevaTela: TelaUsadaEncimada = {
      id: uid('tue'),
      stockKey: customKey,
      compraCodigo: 'CUSTOM',
      compraFecha: new Date().toISOString().slice(0, 10),
      proveedorNombre: customProveedor.trim() || 'Rollo custom (sin stock)',
      telaId: customKey,
      telaNombre: customTela.trim(),
      colorId: `col-${customColor.trim().toLowerCase().replace(/\s+/g, '-')}`,
      colorNombre: customColor.trim(),
      unidad: customUnidad,
      precioUnitario: precio,
      rollosDisponibles: rollosNum,
      cantidadDisponible: cantidadTotal,
      rollosUsados: rollosNum,
      cantidadUsada: cantidadTotal,
      costoUsado: Math.round(cantidadTotal * precio),
    }

    setTelasUsadas((prev) => [...prev, nuevaTela])

    // Agregar a capas si no existe
    setFilas((prev) => {
      const existe = prev.some(
        (f) => f.color.trim().toLowerCase() === customColor.trim().toLowerCase(),
      )
      if (!existe) {
        if (prev.length === 1 && !prev[0].color.trim()) {
          return [{ id: prev[0].id, color: customColor.trim(), capas: prev[0].capas || 0 }]
        }
        return [...prev, { id: uid('fila'), color: customColor.trim(), capas: 0 }]
      }
      return prev
    })

    setCustomTela('')
    setCustomColor('')
    setCustomPrecio(0)
    setCustomCantidad(0)
    setCustomRollos(1)
    setCustomProveedor('')
    setMostrarFormCustom(false)
  }

  const updateTelaRollos = (id: string, rawVal: number | string) => {
    setTelasUsadas((prev) =>
      prev.map((t) => {
        if (t.id === id) {
          if (rawVal === '') {
            return { ...t, rollosUsados: 0, cantidadUsada: 0, costoUsado: 0 }
          }
          const num = typeof rawVal === 'string' ? parseInt(rawVal, 10) : rawVal
          if (Number.isNaN(num)) return t
          const isCustom = t.compraCodigo === 'CUSTOM'
          const maxRollos = isCustom ? Math.max(t.rollosDisponibles, num) : t.rollosDisponibles
          const r = Math.max(0, Math.min(maxRollos, num))
          const promPorRollo =
            t.rollosDisponibles > 0 ? t.cantidadDisponible / t.rollosDisponibles : 15
          const cantidadUsada = Math.round(r * promPorRollo * 10) / 10
          const costoUsado = Math.round(cantidadUsada * t.precioUnitario)
          return {
            ...t,
            rollosDisponibles: maxRollos,
            cantidadDisponible:
              isCustom && num > t.rollosDisponibles
                ? (t.cantidadDisponible / (t.rollosDisponibles || 1)) * maxRollos
                : t.cantidadDisponible,
            rollosUsados: r,
            cantidadUsada,
            costoUsado,
          }
        }
        return t
      }),
    )
  }

  const removeTela = (id: string) => {
    setTelasUsadas((prev) => prev.filter((t) => t.id !== id))
  }

  const updateFila = (id: string, patch: Partial<Pick<CapaFila, 'color' | 'capas'>>) => {
    setFilas((prev) => prev.map((f) => (f.id === id ? { ...f, ...patch } : f)))
  }

  const addFila = () => {
    setFilas((prev) => [...prev, { id: uid('fila'), color: '', capas: 0 }])
  }

  const removeFila = (id: string) => {
    setFilas((prev) => {
      const next = prev.filter((f) => f.id !== id)
      return next.length ? next : [{ id: uid('fila'), color: '', capas: 0 }]
    })
  }

  const addItem = () => {
    setItems((prev) => {
      const next = [...prev, { id: uid('ei'), modeloNombre: '', cantidad: 0, porcentaje: 0 }]
      const pcts = calcularPorcentajesPonderados(next.map((i) => i.cantidad))
      return next.map((it, idx) => ({ ...it, porcentaje: pcts[idx] }))
    })
  }

  const updateItemCantidad = (id: string, cantidad: number) => {
    setItems((prev) => {
      const cant = Math.max(0, Math.round(cantidad))
      const next = prev.map((i) => (i.id === id ? { ...i, cantidad: cant } : i))
      const pcts = calcularPorcentajesPonderados(next.map((i) => i.cantidad))
      return next.map((it, idx) => ({ ...it, porcentaje: pcts[idx] }))
    })
  }

  const removeItem = (id: string) => {
    setItems((prev) => {
      const next = prev.filter((i) => i.id !== id)
      const lista = next.length
        ? next
        : [{ id: uid('ei'), modeloNombre: '', cantidad: 0, porcentaje: 100 }]
      const pcts = calcularPorcentajesPonderados(lista.map((i) => i.cantidad))
      return lista.map((it, idx) => ({ ...it, porcentaje: pcts[idx] }))
    })
  }

  const handleSave = () => {
    if (!puedeGuardar) return

    const cargas: CargaCapas[] = cargasValidas.map((f) => {
      const color = mockColores.find(
        (c) => c.nombre.toLowerCase() === f.color.trim().toLowerCase(),
      )
      const telaPpal = telasUsadas[0]
      return {
        id: uid('cc'),
        telaId: telaPpal?.telaId ?? 'tel-1',
        telaNombre: telaPpal?.telaNombre ?? 'Morley',
        colorId: color?.id ?? uid('col'),
        colorNombre: f.color.trim(),
        unidad: telaPpal?.unidad ?? 'METRO',
        capas: f.capas,
        rollosUsados: 0,
        cantidadUsada: f.capas * largoCapa,
        fechaHora: new Date().toISOString(),
      }
    })

    onSave({
      id: encimada?.id ?? uid('enc'),
      codigo: codigo.trim() || codigoSugerido,
      fecha,
      estado,
      largoCapa,
      items: itemsValidos,
      cargas,
      telasUsadas,
      notas: notas.trim() || undefined,
    })
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="flex max-h-[92vh] w-full max-w-3xl flex-col rounded-lg bg-white shadow-xl">
        {/* Cabecera */}
        <div className="flex items-center justify-between border-b border-stone-200 px-4 py-3">
          <div>
            <h2 className="text-base font-semibold text-stone-900">
              {encimada ? 'Editar encimada' : 'Nueva encimada'}
            </h2>
            <p className="text-xs text-stone-500">
              Cargá las capas por color y los modelos de la tizada.
            </p>
          </div>
          <button
            onClick={onClose}
            className="flex h-7 w-7 items-center justify-center rounded text-stone-400 hover:bg-stone-100 hover:text-stone-700"
          >
            ✕
          </button>
        </div>

        {/* Datos generales */}
        <div className="border-b border-stone-200 bg-stone-50 px-4 py-3">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <div>
              <label className={labelCls}>Código</label>
              <input
                className={inputCls}
                value={codigo}
                onChange={(e) => setCodigo(e.target.value)}
              />
            </div>
            <div>
              <label className={labelCls}>Fecha</label>
              <input
                type="date"
                className={inputCls}
                value={fecha}
                onChange={(e) => setFecha(e.target.value)}
              />
            </div>
            <div>
              <label className={labelCls}>Estado</label>
              <select
                className={inputCls}
                value={estado}
                onChange={(e) => setEstado(e.target.value as EstadoEncimada)}
              >
                <option value="EN_CORTE">En corte</option>
                <option value="CERRADA">Cerrada</option>
              </select>
            </div>
            <div>
              <label className={labelCls}>Notas</label>
              <input
                className={inputCls}
                value={notas}
                onChange={(e) => setNotas(e.target.value)}
                placeholder="Opcional"
              />
            </div>
          </div>
        </div>

        {/* Cuerpo del formulario */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {/* Telas opcionales, agrupadas por tela y compra */}
          <details className="group rounded-lg border border-stone-200 bg-white">
            <summary className="flex cursor-pointer list-none flex-wrap items-center justify-between gap-2 px-3.5 py-2.5 [&::-webkit-details-marker]:hidden">
              <div className="flex items-center gap-2">
                <span className="text-stone-400 transition-transform group-open:rotate-90">
                  ▸
                </span>
                <span className="text-xs font-semibold uppercase tracking-wide text-stone-700">
                  Telas y costos
                </span>
                <span className="rounded-full bg-stone-100 px-2 py-0.5 text-[10px] font-medium text-stone-500">
                  Opcional
                </span>
              </div>
              <span className="text-xs text-stone-500">
                {telasUsadas.length === 0 ? (
                  'Sin telas asignadas'
                ) : (
                  <>
                    {telasUsadas.length} {telasUsadas.length === 1 ? 'color' : 'colores'} ·{' '}
                    {rollosTotales} {rollosTotales === 1 ? 'rollo' : 'rollos'} ·{' '}
                    <strong className="font-semibold text-stone-800">
                      <Money value={costoTotalTelas} />
                    </strong>
                  </>
                )}
              </span>
            </summary>

            <div className="space-y-2.5 border-t border-stone-200 p-3">
              <p className="text-xs text-stone-500">
                Se agrupan por tela y compra. Indicá solo los rollos por color.
              </p>

              <div className="flex flex-col items-stretch gap-2 sm:flex-row sm:items-center">
                <select
                  className={inputCls}
                  value={selectedRolloKey}
                  onChange={(e) => setSelectedRolloKey(e.target.value)}
                >
                  <option value="">Tela y color del stock</option>
                  {gruposStock.map((compra) => {
                    const telas = Array.from(
                      new Set(compra.opciones.map((op) => op.telaNombre)),
                    )
                    return (
                      <optgroup
                        key={compra.codigo}
                        label={`${telas.join(' / ')} · ${compra.codigo}`}
                      >
                        {compra.opciones.map((op) => (
                          <option key={op.key} value={op.key}>
                            {telas.length > 1 ? `${op.telaNombre} · ` : ''}
                            {op.colorNombre} · {op.rollosDisponibles}{' '}
                            {op.rollosDisponibles === 1 ? 'rollo' : 'rollos'}
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
              </div>

              {telasUsadas.length === 0 ? (
                <div className="rounded border border-dashed border-stone-200 px-3 py-2 text-center text-xs text-stone-400">
                  Sin telas asignadas. Podés guardar solo con capas y modelos.
                </div>
              ) : (
                <div className="space-y-2">
                  {gruposTelas.map((grupo) => {
                    const rollosGrupo = grupo.telas.reduce(
                      (a, t) => a + (Number(t.rollosUsados) || 0),
                      0,
                    )
                    return (
                      <div
                        key={grupo.key}
                        className="rounded-lg border border-stone-200 bg-stone-50/70 p-2"
                        title={`${grupo.proveedorNombre} · ${grupo.compraFecha}`}
                      >
                        <div className="flex flex-wrap items-center justify-between gap-1">
                          <div className="flex min-w-0 flex-wrap items-center gap-1.5">
                            <span className="text-xs font-semibold text-stone-900">
                              {grupo.telaNombre}
                            </span>
                            <span className="rounded bg-white px-1.5 py-0.5 font-mono text-[10px] text-stone-500 ring-1 ring-stone-200">
                              {grupo.compraCodigo}
                            </span>
                          </div>
                          <span className="text-[11px] text-stone-500">
                            Stock:{' '}
                            <strong className="text-stone-700">
                              {grupo.telas.reduce(
                                (a, t) => a + (Number(t.rollosDisponibles) || 0),
                                0,
                              )}{' '}
                              rollos disp.
                            </strong>{' '}
                            · Usando: <strong className="text-amber-800">{rollosGrupo}</strong>
                          </span>
                        </div>
                        <div className="mt-1.5 flex flex-wrap gap-1.5">
                          {grupo.telas.map((tela) => {
                            const quedan = tela.rollosDisponibles - tela.rollosUsados
                            const esTodo = tela.rollosUsados >= tela.rollosDisponibles
                            return (
                              <div
                                key={tela.id}
                                className="flex items-center gap-1.5 rounded-full border border-stone-200 bg-white py-1 pl-2.5 pr-1.5 shadow-sm"
                              >
                                <span
                                  className={`h-2.5 w-2.5 shrink-0 rounded-full border border-stone-300 ${
                                    COLOR_SWATCH[tela.colorNombre] ?? 'bg-stone-200'
                                  }`}
                                />
                                <span className="text-xs font-semibold text-stone-800">
                                  {tela.colorNombre}
                                </span>
                                <div className="flex items-center gap-1 bg-stone-100/80 rounded-lg p-0.5 border border-stone-200">
                                  <button
                                    type="button"
                                    disabled={tela.rollosUsados <= 1}
                                    onClick={() => updateTelaRollos(tela.id, tela.rollosUsados - 1)}
                                    className="h-6 w-6 flex items-center justify-center rounded bg-white text-stone-700 font-bold hover:bg-stone-50 disabled:opacity-30 disabled:cursor-not-allowed shadow-xs text-xs"
                                    title="Usar 1 rollo menos"
                                  >
                                    −
                                  </button>
                                  <input
                                    type="number"
                                    min={1}
                                    max={tela.rollosDisponibles}
                                    className="h-6 w-11 rounded border border-stone-300 bg-white px-1 text-center text-xs font-bold text-stone-900 focus:border-amber-600 focus:outline-none"
                                    value={tela.rollosUsados === 0 ? '' : tela.rollosUsados}
                                    onFocus={(e) => e.currentTarget.select()}
                                    onChange={(e) =>
                                      updateTelaRollos(tela.id, e.target.value)
                                    }
                                    onBlur={() => {
                                      if (!tela.rollosUsados || tela.rollosUsados < 1) {
                                        updateTelaRollos(tela.id, 1)
                                      } else if (tela.rollosUsados > tela.rollosDisponibles) {
                                        updateTelaRollos(tela.id, tela.rollosDisponibles)
                                      }
                                    }}
                                    title={`Rollos a usar (máx. ${tela.rollosDisponibles} disponibles)`}
                                  />
                                  <button
                                    type="button"
                                    disabled={tela.rollosUsados >= tela.rollosDisponibles}
                                    onClick={() => updateTelaRollos(tela.id, tela.rollosUsados + 1)}
                                    className="h-6 w-6 flex items-center justify-center rounded bg-white text-stone-700 font-bold hover:bg-stone-50 disabled:opacity-30 disabled:cursor-not-allowed shadow-xs text-xs"
                                    title="Usar 1 rollo más"
                                  >
                                    +
                                  </button>
                                  <span className="text-[10px] font-semibold text-stone-600 px-1">
                                    / {tela.rollosDisponibles}
                                  </span>
                                </div>
                                <span
                                  className={`rounded px-1.5 py-0.5 text-[9px] font-medium ${
                                    esTodo
                                      ? 'bg-emerald-50 text-emerald-700'
                                      : 'bg-stone-100 text-stone-600'
                                  }`}
                                >
                                  {esTodo ? 'Todo' : `Quedan ${quedan}`}
                                </span>
                                <button
                                  type="button"
                                  onClick={() => removeTela(tela.id)}
                                  className="flex h-5 w-5 items-center justify-center rounded-full text-[10px] text-stone-400 hover:bg-stone-100 hover:text-red-600"
                                  title="Quitar tela"
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
          </details>

          {/* Capas y modelos: lo principal de la encimada */}
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {/* Colores y Capas */}
            <div>
              <div className="mb-2 flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-wide text-stone-600">
                  Capas por color
                </span>
                <span className="text-xs text-stone-500">
                  Total: <strong className="text-stone-800">{capasTotales}</strong> capas
                </span>
              </div>
              <div className="overflow-hidden rounded border border-stone-200">
                <table className="w-full divide-y divide-stone-200">
                  <thead className="bg-stone-50">
                    <tr>
                      <th className={`${th} text-left`}>Color</th>
                      <th className={thRight}>Capas</th>
                      <th className="w-8"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-100">
                    {filas.map((f) => (
                      <tr key={f.id}>
                        <td className="p-1.5">
                          <input
                            list="colores-carga-capas"
                            className={inputCls}
                            value={f.color}
                            onChange={(e) => updateFila(f.id, { color: e.target.value })}
                            placeholder="Color"
                          />
                        </td>
                        <td className="p-1.5 text-right">
                          <input
                            type="number"
                            min={0}
                            className={numberInputCls}
                            value={f.capas || ''}
                            onFocus={(e) => e.currentTarget.select()}
                            onChange={(e) =>
                              updateFila(f.id, {
                                capas: Math.max(0, Math.round(Number(e.target.value) || 0)),
                              })
                            }
                            placeholder="0"
                          />
                        </td>
                        <td className="p-1.5 text-center">
                          <button
                            type="button"
                            onClick={() => removeFila(f.id)}
                            className="text-xs text-stone-400 hover:text-red-600"
                            title="Quitar"
                          >
                            ✕
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="mt-2">
                <button
                  type="button"
                  onClick={addFila}
                  className="text-xs font-medium text-amber-700 hover:text-amber-800"
                >
                  + Agregar color
                </button>
              </div>
            </div>

            {/* Modelos */}
            <div>
              <div className="mb-2 flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-wide text-stone-600">
                  Modelos
                </span>
                <span className="text-xs text-stone-500">
                  {itemsValidos.length}{' '}
                  {itemsValidos.length === 1 ? 'modelo' : 'modelos'}
                </span>
              </div>

              {/* Vista Mobile: Tarjetas por modelo */}
              <div className="space-y-2 sm:hidden">
                {items.map((it) => {
                  const prendasItem = capasTotales * (Number(it.cantidad) || 0)

                  return (
                    <div
                      key={it.id}
                      className="rounded-lg border border-stone-200 bg-stone-50/50 p-2 space-y-2"
                    >
                      <div className="flex items-center gap-2">
                        <input
                          list="modelos-carga-capas"
                          className={inputCls}
                          value={it.modeloNombre}
                          onChange={(e) =>
                            setItems((prev) =>
                              prev.map((i) =>
                                i.id === it.id ? { ...i, modeloNombre: e.target.value } : i,
                              ),
                            )
                          }
                          placeholder="Nombre del modelo"
                        />
                        <button
                          type="button"
                          onClick={() => removeItem(it.id)}
                          className="flex h-9 w-9 shrink-0 items-center justify-center rounded text-stone-400 hover:bg-stone-100 hover:text-red-600"
                          title="Quitar"
                        >
                          ✕
                        </button>
                      </div>

                      <div className="grid grid-cols-2 gap-2 text-xs">
                        <div>
                          <label className="mb-0.5 block text-[10px] font-medium text-stone-500">
                            Talles/moldes
                          </label>
                          <input
                            type="number"
                            min={0}
                            className="h-9 w-full rounded border border-stone-300 bg-white px-1 text-center font-semibold text-stone-900 focus:border-amber-600 focus:outline-none"
                            value={it.cantidad || ''}
                            onFocus={(e) => e.currentTarget.select()}
                            onChange={(e) =>
                              updateItemCantidad(it.id, Number(e.target.value) || 0)
                            }
                            placeholder="1"
                          />
                        </div>
                        <div>
                          <label className="mb-0.5 block text-[10px] font-medium text-stone-500">
                            Prendas
                          </label>
                          <div className="flex h-9 items-center justify-center rounded border border-stone-200 bg-white font-bold text-stone-800">
                            {prendasItem}
                          </div>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>

              {/* Vista Escritorio: Tabla */}
              <div className="hidden overflow-hidden rounded border border-stone-200 sm:block">
                <table className="w-full divide-y divide-stone-200">
                  <thead className="bg-stone-50">
                    <tr>
                      <th className={`${th} text-left`}>Modelo</th>
                      <th className={thRight} title="Talles o moldes en tizada">
                        Talles
                      </th>
                      <th className={thRight} title="Prendas totales = capas × talles">
                        Prendas
                      </th>
                      <th className="w-7"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-100">
                    {items.map((it) => {
                      const prendasItem = capasTotales * (Number(it.cantidad) || 0)

                      return (
                        <tr key={it.id}>
                          <td className="p-1.5">
                            <input
                              list="modelos-carga-capas"
                              className={inputCls}
                              value={it.modeloNombre}
                              onChange={(e) =>
                                setItems((prev) =>
                                  prev.map((i) =>
                                    i.id === it.id ? { ...i, modeloNombre: e.target.value } : i,
                                  ),
                                )
                              }
                              placeholder="Modelo"
                            />
                          </td>
                          <td className="p-1.5 text-right">
                            <input
                              type="number"
                              min={0}
                              className="h-8 w-14 rounded border border-stone-300 bg-white px-1 text-center text-sm font-semibold text-stone-900 focus:border-amber-600 focus:outline-none"
                              value={it.cantidad || ''}
                              onFocus={(e) => e.currentTarget.select()}
                              onChange={(e) =>
                                updateItemCantidad(it.id, Number(e.target.value) || 0)
                              }
                              placeholder="1"
                            />
                          </td>
                          <td className={`${tdRight} text-xs font-semibold text-stone-700`}>
                            {prendasItem}
                          </td>
                          <td className="p-1 text-center">
                            <button
                              type="button"
                              onClick={() => removeItem(it.id)}
                              className="text-xs text-stone-400 hover:text-red-600"
                              title="Quitar"
                            >
                              ✕
                            </button>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>

              <div className="mt-2">
                <button
                  type="button"
                  onClick={addItem}
                  className="text-xs font-medium text-amber-700 hover:text-amber-800"
                >
                  + Agregar modelo
                </button>
              </div>
            </div>
          </div>

          <datalist id="colores-carga-capas">
            {mockColores.map((c) => (
              <option key={c.id} value={c.nombre} />
            ))}
          </datalist>

          <datalist id="modelos-carga-capas">
            {mockModelos.map((m) => (
              <option key={m.id} value={m.nombre} />
            ))}
          </datalist>
        </div>

        {/* Pie con totales y botones */}
        <div className="flex flex-col items-stretch justify-between gap-3 border-t border-stone-200 bg-white px-4 py-3 sm:flex-row sm:items-center">
          <div className="flex flex-wrap items-center justify-between gap-2 text-xs sm:justify-start sm:gap-4 sm:text-sm">
            <span>
              Capas: <strong className="text-stone-900">{capasTotales}</strong>
            </span>
            <span className="hidden text-stone-300 sm:inline">|</span>
            <span>
              Modelos: <strong className="text-stone-900">{itemsValidos.length}</strong>
            </span>
            <span className="hidden text-stone-300 sm:inline">|</span>
            <span>
              Prendas: <strong className="text-stone-900">{prendasTotales}</strong>
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Button className="flex-1 sm:flex-none" variant="secondary" onClick={onClose}>
              Cancelar
            </Button>
            <Button
              className="flex-1 sm:flex-none"
              disabled={!puedeGuardar}
              onClick={handleSave}
            >
              Guardar encimada
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
