import { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button } from '../../../shared/components/Button'
import { Money } from '../../../shared/components/Money'
import { fechaISO, formatDate, hoyISO } from '../../../utils/format'
import { siguienteCodigo } from '../../../utils/codigos'
import { ordenarPorFechaYCodigoDesc } from '../../../utils/orden'
import { useErpStore } from '../../../data/erpStore'
import type { Corte, EstadoCorte } from '../../../types'
import {
  ESTADO_PAGO_LABEL,
  ESTADO_PAGO_STYLES,
  resumenPagoCorte,
} from '../../pagos/pagos.utils'
import { NuevoCorteModal } from '../components/NuevoCorteModal'

const th = 'px-4 py-2.5 text-xs font-semibold uppercase tracking-wide text-stone-500'
const thRight = `${th} text-right`
const td = 'px-4 py-2.5 text-sm text-stone-900'
const tdRight = `${td} text-right tabular-nums`

const ESTADO_TABS: { id: string; label: string }[] = [
  { id: 'TODOS', label: 'Todos' },
  { id: 'PREPARADO', label: 'Preparado' },
  { id: 'EN_TALLER', label: 'En taller' },
  { id: 'ENTREGADO', label: 'Entregado' },
  { id: 'PAGADO', label: 'Pagado' },
]

const ESTADOS_CORTE: { value: EstadoCorte; label: string }[] = [
  { value: 'PREPARADO', label: 'Preparado' },
  { value: 'EN_TALLER', label: 'En taller' },
  { value: 'ENTREGADO', label: 'Entregado' },
  { value: 'PAGADO', label: 'Pagado' },
]

const ESTADO_STYLES: Record<string, string> = {
  PREPARADO: 'bg-stone-100 text-stone-800 border-stone-300',
  EN_TALLER: 'bg-amber-100 text-amber-800 border-amber-300',
  ENTREGADO: 'bg-sky-100 text-sky-800 border-sky-300',
  PAGADO: 'bg-emerald-100 text-emerald-800 border-emerald-300',
}

function corteAtrasado(corte: Corte, hoy: string): boolean {
  if (corte.estado === 'ENTREGADO' || corte.estado === 'PAGADO') return false
  const vence = fechaISO(corte.fechaEntregaPrometida)
  return !!corte.atrasado || (!!vence && vence < hoy)
}

export function CortesPage() {
  const { cortes, pagos, talleres, changeEstadoCorte, assignTallerCorte, addCorte } = useErpStore()
  const navigate = useNavigate()
  const [filtroEstado, setFiltroEstado] = useState<string>('TODOS')
  const [busqueda, setBusqueda] = useState('')
  const [openModal, setOpenModal] = useState(false)

  const nextCodigo = siguienteCodigo(
    'C',
    cortes.map((c) => c.codigo),
  )
  const hoy = hoyISO()

  const kpis = useMemo(() => {
    let activos = 0
    let atrasados = 0
    let prendasEnTaller = 0
    let saldo = 0

    for (const c of cortes) {
      if (c.estado === 'PREPARADO' || c.estado === 'EN_TALLER') {
        activos += 1
        prendasEnTaller += Number(c.cantidadPrendas) || 0
      }

      if (corteAtrasado(c, hoy)) {
        atrasados += 1
      }

      const resumen = resumenPagoCorte(c, pagos)
      if (resumen.saldo > 0) saldo += resumen.saldo
    }

    return { activos, atrasados, prendasEnTaller, saldo }
  }, [cortes, pagos, hoy])

  const conteos = useMemo(() => {
    const mapa: Record<string, number> = { TODOS: cortes.length }
    for (const c of cortes) {
      mapa[c.estado] = (mapa[c.estado] ?? 0) + 1
    }
    return mapa
  }, [cortes])

  const cortesFiltrados = useMemo(() => {
    const q = busqueda.trim().toLowerCase()
    const lista = (filtroEstado === 'TODOS'
      ? cortes
      : cortes.filter((c) => c.estado === filtroEstado)
    ).filter((c) =>
      q
        ? `${c.codigo} ${c.modeloNombre} ${c.tallerNombre ?? ''}`
            .toLowerCase()
            .includes(q)
        : true,
    )

    // Más nuevos primero
    return ordenarPorFechaYCodigoDesc(
      lista,
      (c) => c.fecha,
      (c) => c.codigo,
    )
  }, [cortes, filtroEstado, busqueda])

  return (
    <div className="space-y-4">
      {/* Cabecera */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-semibold text-stone-900 sm:text-2xl">Cortes</h1>
          <p className="mt-0.5 text-xs text-stone-500 sm:text-sm">
            Asigná talleres y seguí el estado de cada corte. Los pagos se registran aparte.
          </p>
        </div>
        <Button className="w-full sm:w-auto" onClick={() => setOpenModal(true)}>
          + Nuevo corte
        </Button>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="rounded-xl border border-t-2 border-stone-200 border-t-sky-500/70 bg-white p-3 shadow-sm sm:p-3.5">
          <div className="text-[11px] font-medium text-stone-500 sm:text-xs">Activos</div>
          <div className="mt-1 text-lg font-semibold text-stone-900">{kpis.activos}</div>
          <div className="mt-0.5 text-[10px] text-stone-500 sm:text-xs">preparado / en taller</div>
        </div>

        <div
          className={`rounded-xl border border-t-2 p-3 shadow-sm sm:p-3.5 ${
            kpis.atrasados > 0
              ? 'border-stone-200 border-t-red-500/70 bg-red-50/40'
              : 'border-stone-200 border-t-stone-300 bg-white'
          }`}
        >
          <div
            className={`text-[11px] font-medium sm:text-xs ${
              kpis.atrasados > 0 ? 'text-red-700' : 'text-stone-500'
            }`}
          >
            Atrasados
          </div>
          <div className="mt-1 text-lg font-semibold text-stone-900">{kpis.atrasados}</div>
          <div className="mt-0.5 text-[10px] text-stone-500 sm:text-xs">fuera de fecha</div>
        </div>

        <div className="rounded-xl border border-t-2 border-stone-200 border-t-amber-600/70 bg-white p-3 shadow-sm sm:p-3.5">
          <div className="text-[11px] font-medium text-stone-500 sm:text-xs">Prendas</div>
          <div className="mt-1 text-lg font-semibold text-stone-900">{kpis.prendasEnTaller}</div>
          <div className="mt-0.5 text-[10px] text-stone-500 sm:text-xs">en taller</div>
        </div>

        <div className="rounded-xl border border-t-2 border-stone-200 border-t-emerald-600/70 bg-white p-3 shadow-sm sm:p-3.5">
          <div className="text-[11px] font-medium text-stone-500 sm:text-xs">Saldo</div>
          <div className="mt-1 whitespace-nowrap text-lg font-semibold text-stone-900">
            <Money value={kpis.saldo} />
          </div>
          <div className="mt-0.5 text-[10px] text-stone-500 sm:text-xs">a pagar a talleres</div>
        </div>
      </div>

      {/* Filtros por estado */}
      <div className="-mx-1 flex items-center gap-2 overflow-x-auto px-1 pb-1 sm:flex-wrap sm:pb-0">
        {ESTADO_TABS.map((tab) => {
          const count = conteos[tab.id] ?? 0
          const active = filtroEstado === tab.id

          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setFiltroEstado(tab.id)}
              className={`inline-flex shrink-0 items-center gap-2 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
                active
                  ? 'bg-stone-900 text-white shadow-sm'
                  : 'border border-stone-200 bg-white text-stone-600 hover:border-stone-300 hover:bg-stone-50 hover:text-stone-900'
              }`}
            >
              <span>{tab.label}</span>
              <span
                className={`rounded-full px-1.5 py-0.5 text-[10px] font-semibold leading-none tabular-nums ${
                  active ? 'bg-stone-700 text-stone-100' : 'bg-stone-100 text-stone-500'
                }`}
              >
                {count}
              </span>
            </button>
          )
        })}
      </div>

      {/* Buscador */}
      {cortes.length > 0 && (
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <input
            className="h-9 w-full rounded-md border border-stone-300 bg-white px-3 text-sm focus:border-amber-600 focus:outline-none sm:w-72"
            placeholder="Buscar por código, prenda o taller..."
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
          />
          <span className="text-xs text-stone-500">
            {cortesFiltrados.length} de {cortes.length} cortes
          </span>
        </div>
      )}

      {/* Vista Mobile: Tarjetas */}
      <div className="space-y-3 md:hidden">
        {cortesFiltrados.length === 0 ? (
          <div className="rounded-xl border border-stone-200 bg-white p-8 text-center text-sm text-stone-500 shadow-sm">
            {busqueda
              ? 'No se encontraron cortes con esa búsqueda.'
              : 'No hay cortes registrados en este estado.'}
          </div>
        ) : (
          cortesFiltrados.map((c) => {
            const cantidad = Number(c.cantidadPrendas) || 0
            const totalTaller = cantidad * (Number(c.precioPorPrenda) || 0)
            const sinTaller = !c.tallerId || c.tallerId === 'sin-taller'
            const resumenPago = resumenPagoCorte(c, pagos)
            const atrasado = corteAtrasado(c, hoy)
            const enviadas = c.seguimiento?.enviadas ?? cantidad
            const entregadas = c.seguimiento?.entregadas ?? 0

            return (
              <div
                key={c.id}
                className="overflow-hidden rounded-xl border border-stone-200 bg-white shadow-sm"
              >
                {/* Código, prenda y estado */}
                <div className="flex items-start justify-between gap-2 px-3.5 pt-3.5">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-x-1.5 gap-y-1 text-[11px]">
                      <span className="font-mono font-semibold text-amber-900">
                        {c.codigo}
                      </span>
                      <span className="text-stone-300">·</span>
                      <span className="text-stone-400">{formatDate(c.fecha)}</span>
                      {atrasado && (
                        <span
                          title={`Entrega prometida: ${formatDate(c.fechaEntregaPrometida)}`}
                          className="rounded-full bg-red-100 px-1.5 py-0.5 text-[10px] font-semibold text-red-700"
                        >
                          Atrasado
                        </span>
                      )}
                    </div>
                    <h3 className="mt-0.5 truncate text-sm font-semibold text-stone-900">
                      {c.modeloNombre}
                    </h3>
                  </div>

                  <select
                    aria-label={`Estado del corte ${c.codigo}`}
                    value={c.estado}
                    onChange={(e) =>
                      changeEstadoCorte(c.id, e.target.value as EstadoCorte)
                    }
                    className={`shrink-0 cursor-pointer rounded-full border px-2.5 py-1 text-xs font-semibold transition-colors focus:outline-none ${
                      ESTADO_STYLES[c.estado] || 'bg-stone-100 text-stone-800'
                    }`}
                  >
                    {ESTADOS_CORTE.map((e) => (
                      <option key={e.value} value={e.value}>
                        {e.label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Taller asignado */}
                <div className="mt-2.5 px-3.5">
                  <select
                    aria-label={`Taller del corte ${c.codigo}`}
                    value={c.tallerId || ''}
                    onChange={(e) => {
                      const tId = e.target.value
                      const tObj = talleres.find((t) => t.id === tId)
                      assignTallerCorte(
                        c.id,
                        tId,
                        tObj ? tObj.nombre : 'Sin asignar',
                      )
                    }}
                    className={`h-8 w-full rounded-md border px-2 text-xs font-medium transition-colors focus:border-amber-600 focus:outline-none ${
                      sinTaller
                        ? 'border-amber-300 bg-amber-50 font-semibold text-amber-900'
                        : 'border-stone-300 bg-white text-stone-900'
                    }`}
                  >
                    <option value="">-- Asignar taller --</option>
                    {talleres.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.nombre}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Prendas, $/prenda y total */}
                <div className="mx-3.5 mt-2.5 grid grid-cols-3 gap-2 rounded-lg bg-stone-50 px-2.5 py-2 text-xs">
                  <div>
                    <div className="text-[10px] text-stone-500">Prendas</div>
                    <div className="font-semibold text-stone-900">{cantidad}</div>
                    <div className="text-[10px] text-stone-400">
                      Ent. {entregadas}/{enviadas}
                    </div>
                  </div>
                  <div>
                    <div className="text-[10px] text-stone-500">$/prenda</div>
                    <div className="mt-0.5 flex items-center gap-0.5">
                      <span className="text-stone-400">$</span>
                      <input
                        type="number"
                        min="0"
                        aria-label={`Precio por prenda del corte ${c.codigo}`}
                        value={c.precioPorPrenda || ''}
                        onChange={(e) => {
                          const p = Math.max(0, Number(e.target.value) || 0)
                          assignTallerCorte(
                            c.id,
                            c.tallerId,
                            c.tallerNombre,
                            p,
                          )
                        }}
                        className="h-6 w-full min-w-0 rounded border border-stone-300 bg-white px-1 text-right text-xs font-medium text-stone-900 focus:border-amber-600 focus:outline-none"
                      />
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-[10px] text-stone-500">Total taller</div>
                    <div className="font-semibold text-amber-900">
                      <Money value={totalTaller} />
                    </div>
                  </div>
                </div>

                {/* Pago y saldo */}
                <div className="mt-2.5 flex items-center justify-between gap-2 border-t border-stone-100 px-3.5 py-2.5">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <span
                        className={`inline-flex rounded-full border px-2 py-0.5 text-[10px] font-semibold ${
                          ESTADO_PAGO_STYLES[resumenPago.estado]
                        }`}
                      >
                        {ESTADO_PAGO_LABEL[resumenPago.estado]}
                      </span>
                      {resumenPago.saldo > 0 ? (
                        <span className="text-[11px] font-semibold text-amber-800">
                          Debe <Money value={resumenPago.saldo} />
                        </span>
                      ) : resumenPago.saldo < 0 ? (
                        <span className="text-[11px] font-semibold text-emerald-700">
                          A favor <Money value={-resumenPago.saldo} />
                        </span>
                      ) : (
                        <span className="text-[10px] text-stone-400">Sin saldo</span>
                      )}
                    </div>
                    <div className="mt-0.5 text-[10px] text-stone-500">
                      Pagado <Money value={resumenPago.pagado} />
                    </div>
                  </div>

                  {sinTaller ? (
                    <span className="shrink-0 text-[10px] font-medium text-amber-700">
                      Asigná taller
                    </span>
                  ) : (
                    <button
                      type="button"
                      onClick={() => navigate(`/pagos?corte=${encodeURIComponent(c.id)}`)}
                      className="shrink-0 rounded-md border border-emerald-200 bg-emerald-50 px-2.5 py-1.5 text-[11px] font-semibold text-emerald-800 transition-colors hover:bg-emerald-100 active:bg-emerald-200"
                    >
                      {resumenPago.saldo > 0 ? 'Pagar' : 'Ver pagos'}
                    </button>
                  )}
                </div>
              </div>
            )
          })
        )}
      </div>

      {/* Vista Escritorio: Tabla completa */}
      <div className="hidden overflow-x-auto rounded-xl border border-stone-200 bg-white shadow-sm md:block">
        <table className="w-full divide-y divide-stone-200">
          <thead className="bg-stone-50">
            <tr>
              <th className={`${th} text-left`}>Código</th>
              <th className={`${th} text-left`}>Fecha</th>
              <th className={`${th} text-left`}>Prenda / Modelo</th>
              <th className={`${th} text-left`}>Taller asignado</th>
              <th className={thRight}>Prendas</th>
              <th className={thRight}>$/prenda</th>
              <th className={thRight}>Total taller</th>
              <th className={`${th} text-left`}>Estado corte</th>
              <th className={`${th} text-left`}>Pago / saldo</th>
              <th className={`${th} text-left`}>Seguimiento</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-stone-100">
            {cortesFiltrados.length === 0 ? (
              <tr>
                <td colSpan={10} className="px-4 py-12 text-center text-sm text-stone-400">
                  {busqueda
                    ? 'No se encontraron cortes con esa búsqueda.'
                    : 'No hay cortes registrados en este estado.'}
                </td>
              </tr>
            ) : (
              cortesFiltrados.map((c) => {
                const cantidad = Number(c.cantidadPrendas) || 0
                const totalTaller = cantidad * (Number(c.precioPorPrenda) || 0)
                const sinTaller = !c.tallerId || c.tallerId === 'sin-taller'
                const resumenPago = resumenPagoCorte(c, pagos)
                const atrasado = corteAtrasado(c, hoy)

                return (
                  <tr key={c.id} className="transition-colors hover:bg-stone-50/80">
                    <td className={`${td} font-medium`}>{c.codigo}</td>
                    <td className={`${td} text-stone-500`}>
                      <div>{formatDate(c.fecha)}</div>
                      {atrasado && (
                        <span
                          title={`Entrega prometida: ${formatDate(c.fechaEntregaPrometida)}`}
                          className="mt-0.5 inline-flex rounded-full bg-red-100 px-1.5 py-0.5 text-[10px] font-semibold text-red-700"
                        >
                          Atrasado
                        </span>
                      )}
                    </td>
                    <td className={`${td} font-medium text-stone-900`}>{c.modeloNombre}</td>

                    {/* Selector de Taller asignado */}
                    <td className="px-4 py-2">
                      <select
                        aria-label={`Taller del corte ${c.codigo}`}
                        value={c.tallerId || ''}
                        onChange={(e) => {
                          const tId = e.target.value
                          const tObj = talleres.find((t) => t.id === tId)
                          assignTallerCorte(
                            c.id,
                            tId,
                            tObj ? tObj.nombre : 'Sin asignar',
                          )
                        }}
                        className={`h-8 w-full max-w-[180px] rounded border px-2 text-xs font-medium transition-colors focus:border-amber-600 focus:outline-none ${
                          sinTaller
                            ? 'border-amber-300 bg-amber-50 font-semibold text-amber-900'
                            : 'border-stone-300 bg-white text-stone-900'
                        }`}
                      >
                        <option value="">-- Asignar taller --</option>
                        {talleres.map((t) => (
                          <option key={t.id} value={t.id}>
                            {t.nombre}
                          </option>
                        ))}
                      </select>
                    </td>

                    <td className={tdRight}>{cantidad}</td>

                    {/* Precio por prenda editable */}
                    <td className="px-3 py-2 text-right">
                      <div className="inline-flex items-center justify-end gap-1">
                        <span className="text-xs text-stone-400">$</span>
                        <input
                          type="number"
                          min="0"
                          aria-label={`Precio por prenda del corte ${c.codigo}`}
                          value={c.precioPorPrenda || ''}
                          onChange={(e) => {
                            const p = Math.max(0, Number(e.target.value) || 0)
                            assignTallerCorte(
                              c.id,
                              c.tallerId,
                              c.tallerNombre,
                              p,
                            )
                          }}
                          className="h-7 w-20 rounded border border-stone-300 bg-white px-1.5 text-right text-xs font-medium text-stone-900 focus:border-amber-600 focus:outline-none"
                        />
                      </div>
                    </td>

                    <td className={`${tdRight} font-semibold text-stone-900`}>
                      <Money value={totalTaller} />
                    </td>

                    {/* Estado interactivo */}
                    <td className="px-4 py-2">
                      <select
                        aria-label={`Estado del corte ${c.codigo}`}
                        value={c.estado}
                        onChange={(e) =>
                          changeEstadoCorte(c.id, e.target.value as EstadoCorte)
                        }
                        className={`cursor-pointer rounded-full border px-2.5 py-1 text-xs font-semibold transition-colors focus:outline-none ${
                          ESTADO_STYLES[c.estado] || 'bg-stone-100 text-stone-800'
                        }`}
                      >
                        {ESTADOS_CORTE.map((e) => (
                          <option key={e.value} value={e.value}>
                            {e.label}
                          </option>
                        ))}
                      </select>
                    </td>

                    {/* Estado de pago calculado */}
                    <td className="px-4 py-2">
                      <span
                        className={`inline-flex rounded-full border px-2 py-0.5 text-[11px] font-semibold ${
                          ESTADO_PAGO_STYLES[resumenPago.estado]
                        }`}
                      >
                        {ESTADO_PAGO_LABEL[resumenPago.estado]}
                      </span>
                      <div className="mt-1 text-[11px] text-stone-500">
                        Pagado <Money value={resumenPago.pagado} />
                      </div>
                      <div className="mt-0.5 text-[11px]">
                        {resumenPago.saldo > 0 ? (
                          <span className="font-medium text-amber-800">
                            Saldo <Money value={resumenPago.saldo} />
                          </span>
                        ) : resumenPago.saldo < 0 ? (
                          <span className="font-medium text-emerald-700">
                            A favor <Money value={-resumenPago.saldo} />
                          </span>
                        ) : (
                          <span className="text-stone-400">Sin saldo</span>
                        )}
                      </div>
                      {sinTaller ? (
                        <div className="mt-1 text-[11px] text-amber-700">Asigná taller</div>
                      ) : (
                        <button
                          type="button"
                          onClick={() =>
                            navigate(`/pagos?corte=${encodeURIComponent(c.id)}`)
                          }
                          className="mt-1 text-[11px] font-semibold text-emerald-700 hover:underline"
                        >
                          {resumenPago.saldo > 0 ? 'Registrar pago' : 'Ver pagos'}
                        </button>
                      )}
                    </td>

                    <td className="px-4 py-2 text-xs text-stone-500">
                      Env: {c.seguimiento?.enviadas ?? cantidad} / Ent:{' '}
                      {c.seguimiento?.entregadas ?? 0}
                    </td>
                  </tr>
                )
              })
            )}
          </tbody>
        </table>
      </div>

      <NuevoCorteModal
        open={openModal}
        codigoSugerido={nextCodigo}
        onClose={() => setOpenModal(false)}
        onSave={(nuevo) => addCorte(nuevo)}
      />
    </div>
  )
}
