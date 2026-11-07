import { useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Button } from '../../../shared/components/Button'
import { Money } from '../../../shared/components/Money'
import { formatDate } from '../../../utils/format'
import { useErpStore } from '../../../data/erpStore'
import { ordenarPorFechaYCodigoDesc } from '../../../utils/orden'
import type { Corte } from '../../../types'
import type { EstadoPagoCorte, ResumenPagoCorte } from '../pagos.utils'
import {
  ESTADO_PAGO_LABEL,
  ESTADO_PAGO_STYLES,
  TIPO_PAGO_LABEL,
  TIPO_PAGO_STYLES,
  resumenPagoCorte,
} from '../pagos.utils'
import { RegistrarPagoModal } from '../components/RegistrarPagoModal'

const th = 'px-4 py-2.5 text-xs font-semibold uppercase tracking-wide text-stone-500'
const thRight = `${th} text-right`
const td = 'px-4 py-2.5 text-sm text-stone-900'
const tdRight = `${td} text-right tabular-nums`

const selectCls =
  'h-9 rounded-md border border-stone-300 bg-white px-3 text-sm text-stone-900 focus:border-amber-600 focus:outline-none'

function SaldoCell({ saldo }: { saldo: number }) {
  if (saldo > 0.005) {
    return (
      <span className="font-semibold text-amber-800">
        <Money value={saldo} />
      </span>
    )
  }
  if (saldo < -0.005) {
    return (
      <span className="font-semibold text-emerald-700">
        A favor <Money value={Math.abs(saldo)} />
      </span>
    )
  }
  return (
    <span className="text-stone-400">
      <Money value={0} />
    </span>
  )
}

interface GrupoTaller {
  tallerId: string
  tallerNombre: string
  cantidad: number
  conSaldo: number
  total: number
  pagado: number
  saldo: number
  resumenes: Array<{ corte: Corte } & ResumenPagoCorte>
}

export function PagosPage() {
  const { cortes, pagos, addPagoTaller, deletePagoTaller } = useErpStore()
  const [searchParams, setSearchParams] = useSearchParams()
  const corteParam = searchParams.get('corte') ?? undefined
  const [busqueda, setBusqueda] = useState('')
  const [filtroTaller, setFiltroTaller] = useState('')
  const [filtroEstado, setFiltroEstado] = useState<EstadoPagoCorte | 'TODOS'>('TODOS')
  const [tab, setTab] = useState<'talleres' | 'cortes' | 'pagos'>(() =>
    corteParam ? 'cortes' : 'talleres',
  )
  const [talleresAbiertos, setTalleresAbiertos] = useState<Record<string, boolean>>({})
  const [modalAbierto, setModalAbierto] = useState(() => Boolean(corteParam))
  const [corteSeleccionado, setCorteSeleccionado] = useState<string | undefined>(
    () => corteParam,
  )

  const cortesPagables = ordenarPorFechaYCodigoDesc(
    cortes.filter((corte) => corte.tallerId && corte.tallerId !== 'sin-taller'),
    (corte) => corte.fecha,
    (corte) => corte.codigo,
  )
  const resumenes = cortesPagables.map((corte) => ({
    corte,
    ...resumenPagoCorte(corte, pagos),
  }))

  // El filtro de taller manda sobre los totales: si elegís uno, ves lo que le debés a ese taller.
  const resumenesBase = filtroTaller
    ? resumenes.filter(({ corte }) => corte.tallerId === filtroTaller)
    : resumenes

  const total = resumenesBase.reduce((acumulado, resumen) => acumulado + resumen.total, 0)
  const pagado = resumenesBase.reduce((acumulado, resumen) => acumulado + resumen.pagado, 0)
  const saldoPendiente = resumenesBase.reduce(
    (acumulado, resumen) => acumulado + Math.max(0, resumen.saldo),
    0,
  )
  const saldoAFavor = resumenesBase.reduce(
    (acumulado, resumen) => acumulado + Math.max(0, -resumen.saldo),
    0,
  )

  const talleres = Array.from(
    new Map(cortesPagables.map((corte) => [corte.tallerId, corte.tallerNombre])).entries(),
  )
    .map(([id, nombre]) => ({ id, nombre }))
    .sort((a, b) => a.nombre.localeCompare(b.nombre))

  const texto = busqueda.trim().toLowerCase()

  const grupos = (() => {
    const mapa = new Map<string, GrupoTaller>()
    for (const resumen of resumenesBase) {
      const { corte } = resumen
      const actual = mapa.get(corte.tallerId) ?? {
        tallerId: corte.tallerId,
        tallerNombre: corte.tallerNombre,
        cantidad: 0,
        conSaldo: 0,
        total: 0,
        pagado: 0,
        saldo: 0,
        resumenes: [],
      }

      actual.cantidad += 1
      if (resumen.saldo > 0.005) actual.conSaldo += 1
      actual.total += resumen.total
      actual.pagado += resumen.pagado
      actual.saldo += resumen.saldo
      actual.resumenes.push(resumen)
      mapa.set(corte.tallerId, actual)
    }

    return Array.from(mapa.values())
      .filter((grupo) => !texto || grupo.tallerNombre.toLowerCase().includes(texto))
      .sort((a, b) => a.tallerNombre.localeCompare(b.tallerNombre))
  })()

  const resumenesFiltrados = resumenesBase.filter(({ corte, estado }) => {
    if (filtroEstado !== 'TODOS' && estado !== filtroEstado) return false
    if (!texto) return true
    return `${corte.codigo} ${corte.modeloNombre} ${corte.tallerNombre}`
      .toLowerCase()
      .includes(texto)
  })

  const pagosFiltrados = pagos
    .filter((pago) => {
      if (filtroTaller && pago.tallerId !== filtroTaller) return false
      if (!texto) return true
      return `${pago.corteCodigo} ${pago.tallerNombre} ${pago.concepto ?? ''}`
        .toLowerCase()
        .includes(texto)
    })
    .slice()
    .sort((a, b) => b.fecha.localeCompare(a.fecha))

  const hayFiltros = Boolean(busqueda.trim() || filtroTaller || filtroEstado !== 'TODOS')

  const limpiarFiltros = () => {
    setBusqueda('')
    setFiltroTaller('')
    setFiltroEstado('TODOS')
  }

  const toggleTaller = (tallerId: string) => {
    setTalleresAbiertos((prev) => ({ ...prev, [tallerId]: !prev[tallerId] }))
  }

  const abrirPago = (corteId?: string) => {
    setCorteSeleccionado(corteId)
    setModalAbierto(true)
  }

  const cerrarPago = () => {
    setModalAbierto(false)
    setCorteSeleccionado(undefined)
    if (searchParams.has('corte')) {
      const next = new URLSearchParams(searchParams)
      next.delete('corte')
      setSearchParams(next, { replace: true })
    }
  }

  const handleEliminar = (pagoId: string) => {
    if (window.confirm('¿Eliminar este pago? El saldo del corte se recalculará.')) {
      deletePagoTaller(pagoId)
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-stone-900">Pagos a talleres</h1>
          <p className="mt-0.5 text-sm text-stone-500">
            Agrupá por taller para ver el total, lo pagado y el saldo pendiente. Abrí un taller
            para ver sus cortes y registrar pagos.
          </p>
        </div>
        <Button onClick={() => abrirPago()} disabled={cortesPagables.length === 0}>
          + Registrar pago
        </Button>
      </div>

      <div className="grid grid-cols-3 divide-x divide-stone-100 rounded-lg border border-stone-200 bg-white py-2.5 shadow-sm">
        <div className="px-3 text-center">
          <div className="text-[10px] font-medium uppercase tracking-wide text-stone-500">
            Total
          </div>
          <div className="mt-0.5 text-sm font-semibold text-stone-900">
            <Money value={total} />
          </div>
        </div>
        <div className="px-3 text-center">
          <div className="text-[10px] font-medium uppercase tracking-wide text-stone-500">
            Pagado
          </div>
          <div className="mt-0.5 text-sm font-semibold text-emerald-700">
            <Money value={pagado} />
          </div>
        </div>
        <div className="px-3 text-center">
          <div className="text-[10px] font-medium uppercase tracking-wide text-stone-500">
            Saldo pendiente
          </div>
          <div className="mt-0.5 text-sm font-semibold text-amber-800">
            <Money value={saldoPendiente} />
          </div>
          {saldoAFavor > 0 && (
            <div className="text-[10px] text-violet-700">
              A favor: <Money value={saldoAFavor} />
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-3 gap-1 rounded-lg border border-stone-200 bg-white p-1">
        {(
          [
            ['talleres', 'Por taller', grupos.length],
            ['cortes', 'Cortes', resumenesFiltrados.length],
            ['pagos', 'Pagos', pagosFiltrados.length],
          ] as const
        ).map(([id, label, count]) => (
          <button
            key={id}
            type="button"
            onClick={() => setTab(id)}
            aria-pressed={tab === id}
            className={`rounded-md px-2 py-1.5 text-xs font-medium transition-colors ${
              tab === id
                ? 'bg-stone-900 text-white'
                : 'text-stone-600 hover:bg-stone-100 hover:text-stone-900'
            }`}
          >
            {label}
            <span className={`ml-1 ${tab === id ? 'text-stone-300' : 'text-stone-400'}`}>
              {count}
            </span>
          </button>
        ))}
      </div>

      <div className="flex flex-col gap-2 rounded-lg border border-stone-200 bg-white p-3 sm:flex-row sm:items-center">
        <input
          className="h-9 flex-1 rounded-md border border-stone-300 bg-white px-3 text-sm focus:border-amber-600 focus:outline-none"
          placeholder={
            tab === 'talleres'
              ? 'Buscar taller...'
              : tab === 'pagos'
                ? 'Buscar corte, taller o concepto...'
                : 'Buscar corte, modelo o taller...'
          }
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
        />
        <select
          className={selectCls}
          value={filtroTaller}
          onChange={(e) => {
            const id = e.target.value
            setFiltroTaller(id)
            if (id) setTalleresAbiertos((prev) => ({ ...prev, [id]: true }))
          }}
        >
          <option value="">Todos los talleres</option>
          {talleres.map((taller) => (
            <option key={taller.id} value={taller.id}>
              {taller.nombre}
            </option>
          ))}
        </select>
        {tab === 'cortes' && (
          <select
            className={selectCls}
            value={filtroEstado}
            onChange={(e) => setFiltroEstado(e.target.value as EstadoPagoCorte | 'TODOS')}
          >
            <option value="TODOS">Todos los estados</option>
            {(Object.keys(ESTADO_PAGO_LABEL) as EstadoPagoCorte[]).map((estado) => (
              <option key={estado} value={estado}>
                {ESTADO_PAGO_LABEL[estado]}
              </option>
            ))}
          </select>
        )}
        {hayFiltros && (
          <button
            type="button"
            onClick={limpiarFiltros}
            className="h-9 rounded-md px-2 text-xs font-medium text-stone-500 transition-colors hover:bg-stone-100 hover:text-stone-800"
          >
            Limpiar
          </button>
        )}
      </div>

      {tab === 'talleres' && (
        <div className="space-y-2.5">
          <div className="flex flex-col gap-1 px-1 sm:flex-row sm:items-center sm:justify-between">
            <span className="text-xs text-stone-500">
              {grupos.length} taller{grupos.length === 1 ? '' : 'es'} ·{' '}
              {grupos.reduce((acumulado, grupo) => acumulado + grupo.conSaldo, 0)} corte(s) con
              saldo
            </span>
            <span className="text-[11px] text-stone-400">
              Tocá un taller para ver el detalle de sus cortes
            </span>
          </div>

          {grupos.length === 0 ? (
            <div className="rounded-lg border border-stone-200 bg-white p-6 text-center text-sm text-stone-400">
              {resumenes.length === 0
                ? 'No hay cortes con taller asignado. Asigná un taller desde la sección Cortes.'
                : 'No hay talleres para los filtros seleccionados.'}
            </div>
          ) : (
            grupos.map((grupo) => {
              const abierto = Boolean(talleresAbiertos[grupo.tallerId])

              return (
                <div
                  key={grupo.tallerId}
                  className="overflow-hidden rounded-lg border border-stone-200 bg-white shadow-sm"
                >
                  <button
                    type="button"
                    onClick={() => toggleTaller(grupo.tallerId)}
                    aria-expanded={abierto}
                    className="flex w-full flex-col gap-2 p-3 text-left transition-colors hover:bg-stone-50/80 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div className="flex min-w-0 items-center gap-2">
                      <svg
                        className={`h-4 w-4 shrink-0 text-stone-400 transition-transform ${
                          abierto ? 'rotate-90' : ''
                        }`}
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M9 5l7 7-7 7"
                        />
                      </svg>
                      <div className="min-w-0">
                        <div className="truncate text-sm font-semibold text-stone-900">
                          {grupo.tallerNombre}
                        </div>
                        <div className="mt-0.5 text-xs text-stone-500">
                          {grupo.cantidad} corte{grupo.cantidad === 1 ? '' : 's'}
                          {grupo.conSaldo > 0 ? ` · ${grupo.conSaldo} con saldo` : ' · al día'}
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-2 rounded-md bg-stone-50 p-2 text-xs sm:min-w-[340px] sm:bg-transparent sm:p-0">
                      <div>
                        <span className="block text-[10px] uppercase tracking-wide text-stone-500">
                          Total
                        </span>
                        <strong className="text-stone-900">
                          <Money value={grupo.total} />
                        </strong>
                      </div>
                      <div>
                        <span className="block text-[10px] uppercase tracking-wide text-stone-500">
                          Pagado
                        </span>
                        <strong className="text-emerald-700">
                          <Money value={grupo.pagado} />
                        </strong>
                      </div>
                      <div className="text-right">
                        <span className="block text-[10px] uppercase tracking-wide text-stone-500">
                          Saldo
                        </span>
                        <SaldoCell saldo={grupo.saldo} />
                      </div>
                    </div>
                  </button>

                  {abierto && (
                    <div className="divide-y divide-stone-100 border-t border-stone-100 bg-stone-50/40">
                      {grupo.resumenes.map(
                        ({ corte, total: totalCorte, pagado: pagadoCorte, saldo, estado }) => (
                          <div
                            key={corte.id}
                            className="flex flex-col gap-2 p-3 sm:flex-row sm:items-center sm:justify-between"
                          >
                            <div className="min-w-0">
                              <div className="flex flex-wrap items-center gap-1.5">
                                <span className="font-mono text-xs font-semibold text-amber-800">
                                  {corte.codigo}
                                </span>
                                <span className="text-xs text-stone-400">
                                  · {formatDate(corte.fecha)}
                                </span>
                                <span
                                  className={`inline-flex rounded-full border px-2 py-0.5 text-[10px] font-semibold ${ESTADO_PAGO_STYLES[estado]}`}
                                >
                                  {ESTADO_PAGO_LABEL[estado]}
                                </span>
                              </div>
                              <div className="mt-0.5 truncate text-sm font-medium text-stone-900">
                                {corte.modeloNombre}
                              </div>
                            </div>

                            <div className="grid grid-cols-3 gap-2 rounded bg-white p-2 text-xs sm:min-w-[300px]">
                              <div>
                                <span className="block text-[10px] text-stone-500">Total</span>
                                <strong className="text-stone-900">
                                  <Money value={totalCorte} />
                                </strong>
                              </div>
                              <div>
                                <span className="block text-[10px] text-stone-500">Pagado</span>
                                <span className="font-medium text-stone-800">
                                  <Money value={pagadoCorte} />
                                </span>
                              </div>
                              <div className="text-right">
                                <span className="block text-[10px] text-stone-500">Saldo</span>
                                <SaldoCell saldo={saldo} />
                              </div>
                            </div>

                            <Button
                              size="sm"
                              variant={
                                estado === 'PAGADO' || estado === 'A_FAVOR'
                                  ? 'secondary'
                                  : 'primary'
                              }
                              onClick={() => abrirPago(corte.id)}
                              className="w-full sm:w-auto"
                            >
                              {estado === 'PAGADO' || estado === 'A_FAVOR'
                                ? 'Agregar pago'
                                : 'Registrar pago'}
                            </Button>
                          </div>
                        ),
                      )}
                    </div>
                  )}
                </div>
              )
            })
          )}
        </div>
      )}

      {tab === 'cortes' && (
      <div>
        <div className="flex items-center justify-end">
          <span className="text-xs text-stone-500">
            {resumenesFiltrados.length} de {resumenes.length} cortes
          </span>
        </div>
        {/* Vista Mobile: Tarjetas de Cortes a pagar */}
        <div className="mt-2 space-y-3 md:hidden">
          {resumenesFiltrados.length === 0 ? (
            <div className="rounded-lg border border-stone-200 bg-white p-6 text-center text-sm text-stone-400">
              {resumenes.length === 0
                ? 'No hay cortes con taller asignado. Asigná un taller desde la sección Cortes.'
                : 'No hay cortes para los filtros seleccionados.'}
            </div>
          ) : (
            resumenesFiltrados.map(
              ({ corte, total: totalCorte, pagado: pagadoCorte, saldo, estado }) => (
                <div
                  key={corte.id}
                  className="rounded-lg border border-stone-200 bg-white p-3.5 shadow-sm space-y-2.5"
                >
                  <div className="flex items-start justify-between gap-2 border-b border-stone-100 pb-2">
                    <div>
                      <div className="flex items-center gap-1.5 font-mono text-xs font-semibold text-amber-800">
                        {corte.codigo}
                        <span className="text-stone-400 font-normal">· {formatDate(corte.fecha)}</span>
                      </div>
                      <div className="text-sm font-semibold text-stone-900 mt-0.5">{corte.modeloNombre}</div>
                      <div className="text-xs text-stone-600 mt-0.5">Taller: <strong>{corte.tallerNombre}</strong></div>
                    </div>
                    <span
                      className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold ${ESTADO_PAGO_STYLES[estado]}`}
                    >
                      {ESTADO_PAGO_LABEL[estado]}
                    </span>
                  </div>

                  <div className="grid grid-cols-3 gap-2 rounded bg-stone-50 p-2 text-xs">
                    <div>
                      <span className="text-stone-500 block text-[10px]">Total</span>
                      <strong className="text-stone-900 font-bold"><Money value={totalCorte} /></strong>
                    </div>
                    <div>
                      <span className="text-stone-500 block text-[10px]">Pagado</span>
                      <span className="text-stone-800 font-medium"><Money value={pagadoCorte} /></span>
                    </div>
                    <div className="text-right">
                      <span className="text-stone-500 block text-[10px]">Saldo</span>
                      <SaldoCell saldo={saldo} />
                    </div>
                  </div>

                  <Button
                    size="sm"
                    className="w-full justify-center"
                    variant={estado === 'PAGADO' || estado === 'A_FAVOR' ? 'secondary' : 'primary'}
                    onClick={() => abrirPago(corte.id)}
                  >
                    {estado === 'PAGADO' || estado === 'A_FAVOR' ? 'Agregar otro pago' : 'Registrar pago de corte'}
                  </Button>
                </div>
              ),
            )
          )}
        </div>

        {/* Vista Escritorio: Tabla completa */}
        <div className="mt-2 hidden md:block overflow-x-auto rounded-lg border border-stone-200 bg-white">
          <table className="w-full divide-y divide-stone-200">
            <thead className="bg-stone-100">
              <tr>
                <th className={`${th} text-left`}>Corte</th>
                <th className={`${th} text-left`}>Taller</th>
                <th className={thRight}>Total</th>
                <th className={thRight}>Pagado</th>
                <th className={thRight}>Saldo</th>
                <th className={`${th} text-left`}>Estado</th>
                <th className="px-4 py-2.5 text-center text-xs font-semibold uppercase tracking-wide text-stone-500">
                  Acción
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {resumenesFiltrados.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center text-sm text-stone-400">
                    {resumenes.length === 0
                      ? 'No hay cortes con taller asignado. Asigná un taller desde la sección Cortes.'
                      : 'No hay cortes para los filtros seleccionados.'}
                  </td>
                </tr>
              ) : (
                resumenesFiltrados.map(
                  ({ corte, total: totalCorte, pagado: pagadoCorte, saldo, estado }) => (
                    <tr key={corte.id} className="hover:bg-stone-50/80 transition-colors">
                      <td className={`${td} font-medium`}>
                        <div className="font-mono text-xs text-amber-800">{corte.codigo}</div>
                        <div className="font-medium text-stone-900">{corte.modeloNombre}</div>
                        <div className="text-xs text-stone-400">{formatDate(corte.fecha)}</div>
                      </td>
                      <td className={`${td} text-stone-700`}>{corte.tallerNombre}</td>
                      <td className={`${tdRight} font-semibold`}>
                        <Money value={totalCorte} />
                      </td>
                      <td className={tdRight}>
                        <Money value={pagadoCorte} />
                      </td>
                      <td className={tdRight}>
                        <SaldoCell saldo={saldo} />
                      </td>
                      <td className="px-4 py-2">
                        <span
                          className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold ${ESTADO_PAGO_STYLES[estado]}`}
                        >
                          {ESTADO_PAGO_LABEL[estado]}
                        </span>
                      </td>
                      <td className="px-4 py-2 text-center">
                        <Button size="sm" variant="secondary" onClick={() => abrirPago(corte.id)}>
                          {estado === 'PAGADO' || estado === 'A_FAVOR'
                            ? 'Agregar pago'
                            : 'Registrar pago'}
                        </Button>
                      </td>
                    </tr>
                  ),
                )
              )}
            </tbody>
          </table>
        </div>
      </div>
      )}

      {tab === 'pagos' && (
      <div>
        {/* Vista Mobile: Tarjetas de Pagos registrados */}
        <div className="mt-2 space-y-2.5 md:hidden">
          {pagosFiltrados.length === 0 ? (
            <div className="rounded-lg border border-stone-200 bg-white p-6 text-center text-sm text-stone-400">
              No hay pagos registrados para los filtros seleccionados.
            </div>
          ) : (
            pagosFiltrados.map((pago) => (
              <div
                key={pago.id}
                className="rounded-lg border border-stone-200 bg-white p-3 shadow-sm space-y-1.5"
              >
                <div className="flex items-center justify-between">
                  <div className="font-semibold text-stone-900 text-sm">{pago.tallerNombre}</div>
                  <span
                    className={`inline-flex rounded-full border px-2 py-0.5 text-[10px] font-medium ${TIPO_PAGO_STYLES[pago.tipo]}`}
                  >
                    {TIPO_PAGO_LABEL[pago.tipo]}
                  </span>
                </div>
                <div className="flex items-center justify-between text-xs text-stone-500">
                  <span>Corte: <strong className="text-stone-700">{pago.corteCodigo}</strong> · {formatDate(pago.fecha)}</span>
                  <span className="font-bold text-stone-900 text-sm"><Money value={pago.monto} /></span>
                </div>
                {pago.concepto && (
                  <div className="text-xs text-stone-400 italic">
                    {pago.concepto}
                  </div>
                )}
                <div className="pt-1 flex justify-end">
                  <Button
                    size="sm"
                    variant="ghost"
                    className="text-red-700 hover:bg-red-50 text-xs h-7 px-2"
                    onClick={() => handleEliminar(pago.id)}
                  >
                    Eliminar
                  </Button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Vista Escritorio: Tabla completa */}
        <div className="mt-2 hidden md:block overflow-x-auto rounded-lg border border-stone-200 bg-white">
          <table className="w-full divide-y divide-stone-200">
            <thead className="bg-stone-100">
              <tr>
                <th className={`${th} text-left`}>Fecha</th>
                <th className={`${th} text-left`}>Taller</th>
                <th className={`${th} text-left`}>Corte</th>
                <th className={`${th} text-left`}>Tipo</th>
                <th className={`${th} text-left`}>Concepto</th>
                <th className={thRight}>Monto</th>
                <th className="px-4 py-2.5 text-center text-xs font-semibold uppercase tracking-wide text-stone-500">
                  Acción
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {pagosFiltrados.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-10 text-center text-sm text-stone-400">
                    No hay pagos registrados para los filtros seleccionados.
                  </td>
                </tr>
              ) : (
                pagosFiltrados.map((pago) => (
                  <tr key={pago.id} className="hover:bg-stone-50">
                    <td className={`${td} text-stone-600`}>{formatDate(pago.fecha)}</td>
                    <td className={`${td} font-medium`}>{pago.tallerNombre}</td>
                    <td className={`${td} text-stone-600`}>{pago.corteCodigo}</td>
                    <td className="px-4 py-2">
                      <span
                        className={`inline-flex rounded-full border px-2 py-0.5 text-xs font-medium ${TIPO_PAGO_STYLES[pago.tipo]}`}
                      >
                        {TIPO_PAGO_LABEL[pago.tipo]}
                      </span>
                    </td>
                    <td className={`${td} text-stone-600`}>{pago.concepto || '-'}</td>
                    <td className={`${tdRight} font-semibold`}>
                      <Money value={pago.monto} />
                    </td>
                    <td className="px-4 py-2 text-center">
                      <Button
                        size="sm"
                        variant="ghost"
                        className="text-red-700 hover:bg-red-50"
                        onClick={() => handleEliminar(pago.id)}
                      >
                        Eliminar
                      </Button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
      )}

      {modalAbierto ? (
        <RegistrarPagoModal
          key={corteSeleccionado ?? 'nuevo'}
          cortes={cortesPagables}
          pagos={pagos}
          corteIdInicial={corteSeleccionado}
          onClose={cerrarPago}
          onSave={addPagoTaller}
        />
      ) : null}
    </div>
  )
}
