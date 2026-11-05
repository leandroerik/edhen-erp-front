import { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button } from '../../../shared/components/Button'
import { Money } from '../../../shared/components/Money'
import { formatDate } from '../../../utils/format'
import { siguienteCodigo } from '../../../utils/codigos'
import { ordenarPorFechaYCodigoDesc } from '../../../utils/orden'
import { useErpStore } from '../../../data/erpStore'
import type { EstadoCorte } from '../../../types'
import {
  ESTADO_PAGO_LABEL,
  ESTADO_PAGO_STYLES,
  resumenPagoCorte,
} from '../../pagos/pagos.utils'
import { NuevoCorteModal } from '../components/NuevoCorteModal'

const th = 'px-4 py-3 text-xs font-semibold uppercase tracking-wider text-stone-500'
const thRight = `${th} text-right`
const td = 'px-4 py-3 text-sm text-stone-900'
const tdRight = `${td} text-right tabular-nums`

const ESTADO_TABS: { id: string; label: string }[] = [
  { id: 'TODOS', label: 'Todos' },
  { id: 'PREPARADO', label: 'Preparado' },
  { id: 'EN_TALLER', label: 'En taller' },
  { id: 'ENTREGADO', label: 'Entregado' },
  { id: 'PAGADO', label: 'Pagado' },
]

const ESTADO_STYLES: Record<string, string> = {
  PREPARADO: 'bg-stone-100 text-stone-800 border-stone-300',
  EN_TALLER: 'bg-amber-100 text-amber-800 border-amber-300',
  ENTREGADO: 'bg-sky-100 text-sky-800 border-sky-300',
  PAGADO: 'bg-emerald-100 text-emerald-800 border-emerald-300',
}

export function CortesPage() {
  const { cortes, pagos, talleres, changeEstadoCorte, assignTallerCorte, addCorte } = useErpStore()
  const navigate = useNavigate()
  const [filtroEstado, setFiltroEstado] = useState<string>('TODOS')
  const [openModal, setOpenModal] = useState(false)

  const nextCodigo = siguienteCodigo(
    'C',
    cortes.map((c) => c.codigo),
  )

  const cortesFiltrados = useMemo(() => {
    const lista =
      filtroEstado === 'TODOS'
        ? cortes
        : cortes.filter((c) => c.estado === filtroEstado)
    // Más nuevos primero
    return ordenarPorFechaYCodigoDesc(
      lista,
      (c) => c.fecha,
      (c) => c.codigo,
    )
  }, [cortes, filtroEstado])

  return (
    <div className="space-y-4">
      {/* Encabezado */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-stone-900">Cortes</h1>
          <p className="mt-0.5 text-sm text-stone-500">
            Asigná talleres a cada corte y gestioná los estados del proceso. El estado
            de pago se calcula aparte en Pagos a talleres.
          </p>
        </div>
        <Button onClick={() => setOpenModal(true)}>+ Nuevo corte</Button>
      </div>

      {/* Botones de acceso rápido a estados */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0 sm:flex-wrap">
        {ESTADO_TABS.map((tab) => {
          const count =
            tab.id === 'TODOS'
              ? cortes.length
              : cortes.filter((c) => c.estado === tab.id).length
          const active = filtroEstado === tab.id

          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setFiltroEstado(tab.id)}
              className={`shrink-0 inline-flex items-center gap-2 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
                active
                  ? 'bg-stone-900 text-white shadow-sm'
                  : 'border border-stone-200 bg-white text-stone-600 hover:border-stone-300 hover:bg-stone-50 hover:text-stone-900'
              }`}
            >
              <span>{tab.label}</span>
              <span
                className={`rounded-full px-1.5 py-0.5 text-[10px] font-semibold tabular-nums leading-none ${
                  active
                    ? 'bg-stone-700 text-stone-100'
                    : 'bg-stone-100 text-stone-500'
                }`}
              >
                {count}
              </span>
            </button>
          )
        })}
      </div>

      {/* Vista Mobile: Tarjetas con pago rápido de cortes */}
      <div className="space-y-3 md:hidden">
        {cortesFiltrados.length === 0 ? (
          <div className="rounded-lg border border-stone-200 bg-white p-6 text-center text-sm text-stone-400">
            No hay cortes registrados en este estado.
          </div>
        ) : (
          cortesFiltrados.map((c) => {
            const totalTaller =
              (Number(c.cantidadPrendas) || 0) * (Number(c.precioPorPrenda) || 0)
            const sinTaller = !c.tallerId || c.tallerId === 'sin-taller'
            const resumenPago = resumenPagoCorte(c, pagos)

            return (
              <div
                key={c.id}
                className="rounded-lg border border-stone-200 bg-white p-3.5 shadow-sm space-y-3"
              >
                {/* Cabecera de la tarjeta: Código, Prenda y Estado */}
                <div className="flex items-start justify-between gap-2 border-b border-stone-100 pb-2.5">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-stone-900">{c.codigo}</span>
                      <span className="text-xs text-stone-500">{formatDate(c.fecha)}</span>
                    </div>
                    <h3 className="text-sm font-medium text-stone-900 mt-0.5">{c.modeloNombre}</h3>
                  </div>

                  <select
                    value={c.estado}
                    onChange={(e) =>
                      changeEstadoCorte(c.id, e.target.value as EstadoCorte)
                    }
                    className={`cursor-pointer rounded-full border px-2.5 py-1 text-xs font-semibold focus:outline-none transition-colors ${
                      ESTADO_STYLES[c.estado] || 'bg-stone-100 text-stone-800'
                    }`}
                  >
                    <option value="PREPARADO">Preparado</option>
                    <option value="EN_TALLER">En taller</option>
                    <option value="ENTREGADO">Entregado</option>
                    <option value="PAGADO">Pagado</option>
                  </select>
                </div>

                {/* Taller asignado */}
                <div>
                  <label className="text-[11px] font-medium text-stone-500 block mb-1">
                    Taller confección
                  </label>
                  <select
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
                    className={`h-9 w-full rounded border px-2 text-xs font-medium focus:border-amber-600 focus:outline-none transition-colors ${
                      sinTaller
                        ? 'border-amber-300 bg-amber-50 text-amber-900 font-semibold'
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

                {/* Valores: Prendas, $/prenda y Total */}
                <div className="grid grid-cols-3 gap-2 rounded-lg bg-stone-50 p-2.5 text-xs">
                  <div>
                    <span className="text-stone-500 block text-[10px]">Prendas</span>
                    <strong className="text-sm text-stone-900 font-bold">{c.cantidadPrendas}</strong>
                  </div>
                  <div>
                    <span className="text-stone-500 block text-[10px]">$/prenda</span>
                    <div className="flex items-center gap-0.5 mt-0.5">
                      <span className="text-stone-400 text-xs">$</span>
                      <input
                        type="number"
                        min="0"
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
                        className="h-6 w-16 rounded border border-stone-300 bg-white px-1 text-right text-xs font-medium text-stone-900 focus:border-amber-600 focus:outline-none"
                      />
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-stone-500 block text-[10px]">Total taller</span>
                    <span className="text-sm font-bold text-amber-900 block mt-0.5">
                      <Money value={totalTaller} />
                    </span>
                  </div>
                </div>

                {/* Estado de pago calculado (independiente del estado del corte) */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between rounded-lg bg-stone-50 px-2.5 py-2 text-xs">
                    <span
                      className={`inline-flex rounded-full border px-2 py-0.5 text-[11px] font-semibold ${
                        ESTADO_PAGO_STYLES[resumenPago.estado]
                      }`}
                    >
                      {ESTADO_PAGO_LABEL[resumenPago.estado]}
                    </span>
                    <span className="text-stone-500">
                      Pagado <Money value={resumenPago.pagado} /> /{' '}
                      <Money value={resumenPago.total} />
                    </span>
                  </div>

                  {resumenPago.saldo > 0 && (
                    <p className="text-[11px] font-medium text-amber-800">
                      Saldo pendiente: <Money value={resumenPago.saldo} />
                    </p>
                  )}
                  {resumenPago.saldo < 0 && (
                    <p className="text-[11px] font-medium text-emerald-700">
                      Saldo a favor: <Money value={-resumenPago.saldo} />
                    </p>
                  )}

                  {sinTaller ? (
                    <div className="flex h-9 w-full items-center justify-center rounded-lg border border-amber-200 bg-amber-50 px-3 text-xs font-semibold text-amber-800">
                      Asigná un taller para registrar pagos
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => navigate(`/pagos?corte=${encodeURIComponent(c.id)}`)}
                      className="flex h-9 w-full items-center justify-center gap-2 rounded-lg bg-emerald-600 px-3 text-xs font-semibold text-white shadow-sm hover:bg-emerald-700 active:bg-emerald-800 transition-colors"
                    >
                      <span>{resumenPago.saldo > 0 ? 'Registrar pago' : 'Agregar pago'}</span>
                      <span className="opacity-80">·</span>
                      <span>
                        {resumenPago.saldo > 0 ? (
                          <>Saldo <Money value={resumenPago.saldo} /></>
                        ) : resumenPago.saldo < 0 ? (
                          <>A favor <Money value={-resumenPago.saldo} /></>
                        ) : (
                          'Sin saldo'
                        )}
                      </span>
                    </button>
                  )}
                </div>

                {/* Seguimiento */}
                <div className="text-[11px] text-stone-400 pt-0.5">
                  Seguimiento: Env. {c.seguimiento?.enviadas ?? c.cantidadPrendas} / Ent. {c.seguimiento?.entregadas ?? 0}
                </div>
              </div>
            )
          })
        )}
      </div>

      {/* Vista Escritorio: Tabla completa */}
      <div className="hidden md:block overflow-x-auto rounded-lg border border-stone-200 bg-white shadow-sm">
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
                  No hay cortes registrados en este estado.
                </td>
              </tr>
            ) : (
              cortesFiltrados.map((c) => {
                const totalTaller =
                  (Number(c.cantidadPrendas) || 0) * (Number(c.precioPorPrenda) || 0)
                const sinTaller = !c.tallerId || c.tallerId === 'sin-taller'
                const resumenPago = resumenPagoCorte(c, pagos)

                return (
                  <tr key={c.id} className="hover:bg-stone-50/80 transition-colors">
                    <td className={`${td} font-medium`}>{c.codigo}</td>
                    <td className={`${td} text-stone-500`}>{formatDate(c.fecha)}</td>
                    <td className={`${td} font-medium text-stone-900`}>{c.modeloNombre}</td>

                    {/* Selector de Taller asignado */}
                    <td className="px-4 py-2">
                      <select
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
                        className={`h-8 w-full max-w-[180px] rounded border px-2 text-xs font-medium focus:border-amber-600 focus:outline-none transition-colors ${
                          sinTaller
                            ? 'border-amber-300 bg-amber-50 text-amber-900 font-semibold'
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

                    <td className={tdRight}>{c.cantidadPrendas}</td>

                    {/* Precio por prenda editable */}
                    <td className="px-3 py-2 text-right">
                      <div className="inline-flex items-center justify-end gap-1">
                        <span className="text-xs text-stone-400">$</span>
                        <input
                          type="number"
                          min="0"
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
                        value={c.estado}
                        onChange={(e) =>
                          changeEstadoCorte(c.id, e.target.value as EstadoCorte)
                        }
                        className={`cursor-pointer rounded-full border px-2.5 py-1 text-xs font-semibold focus:outline-none transition-colors ${
                          ESTADO_STYLES[c.estado] || 'bg-stone-100 text-stone-800'
                        }`}
                      >
                        <option value="PREPARADO">Preparado</option>
                        <option value="EN_TALLER">En taller</option>
                        <option value="ENTREGADO">Entregado</option>
                        <option value="PAGADO">Pagado</option>
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
                        Pagado <Money value={resumenPago.pagado} /> /{' '}
                        <Money value={resumenPago.total} />
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
                        <div className="mt-1 text-[11px] text-amber-700">
                          Asigná taller
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() =>
                            navigate(`/pagos?corte=${encodeURIComponent(c.id)}`)
                          }
                          className="mt-1 text-[11px] font-semibold text-emerald-700 hover:underline"
                        >
                          Registrar pago
                        </button>
                      )}
                    </td>

                    <td className="px-4 py-2 text-xs text-stone-500">
                      Env: {c.seguimiento?.enviadas ?? c.cantidadPrendas} / Ent:{' '}
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
