import { useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Button } from '../../../shared/components/Button'
import { Money } from '../../../shared/components/Money'
import { formatDate } from '../../../utils/format'
import { useErpStore } from '../../../data/erpStore'
import { ordenarPorFechaYCodigoDesc } from '../../../utils/orden'
import type { EstadoPagoCorte } from '../pagos.utils'
import {
  ESTADO_PAGO_LABEL,
  ESTADO_PAGO_STYLES,
  TIPO_PAGO_LABEL,
  TIPO_PAGO_STYLES,
  resumenPagoCorte,
  resumenPagosPorTaller,
} from '../pagos.utils'
import { RegistrarPagoModal } from '../components/RegistrarPagoModal'

const th = 'px-4 py-2.5 text-xs font-semibold uppercase tracking-wide text-stone-500'
const thRight = `${th} text-right`
const td = 'px-4 py-2.5 text-sm text-stone-900'
const tdRight = `${td} text-right tabular-nums`

const selectCls =
  'h-9 rounded-md border border-stone-300 bg-white px-3 text-sm text-stone-900 focus:border-amber-600 focus:outline-none'

function Kpi({ label, value, accent }: { label: string; value: number; accent: string }) {
  return (
    <div className={`rounded-lg border border-t-2 border-stone-200 bg-white p-4 ${accent}`}>
      <div className="text-xs text-stone-500">{label}</div>
      <div className="mt-1 text-lg font-semibold text-stone-900">
        <Money value={value} />
      </div>
    </div>
  )
}

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

export function PagosPage() {
  const { cortes, pagos, addPagoTaller, deletePagoTaller } = useErpStore()
  const [searchParams, setSearchParams] = useSearchParams()
  const corteParam = searchParams.get('corte') ?? undefined
  const [busqueda, setBusqueda] = useState('')
  const [filtroTaller, setFiltroTaller] = useState('')
  const [filtroEstado, setFiltroEstado] = useState<EstadoPagoCorte | 'TODOS'>('TODOS')
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

  const total = resumenes.reduce((acumulado, resumen) => acumulado + resumen.total, 0)
  const pagado = resumenes.reduce((acumulado, resumen) => acumulado + resumen.pagado, 0)
  const saldoPendiente = resumenes.reduce(
    (acumulado, resumen) => acumulado + Math.max(0, resumen.saldo),
    0,
  )
  const saldoAFavor = resumenes.reduce(
    (acumulado, resumen) => acumulado + Math.max(0, -resumen.saldo),
    0,
  )

  const talleres = Array.from(
    new Map(cortesPagables.map((corte) => [corte.tallerId, corte.tallerNombre])).entries(),
  )
    .map(([id, nombre]) => ({ id, nombre }))
    .sort((a, b) => a.nombre.localeCompare(b.nombre))

  const texto = busqueda.trim().toLowerCase()
  const resumenesFiltrados = resumenes.filter(({ corte, estado }) => {
    if (filtroTaller && corte.tallerId !== filtroTaller) return false
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

  const saldosPorTaller = resumenPagosPorTaller(cortesPagables, pagos)

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
            Adelantos y pagos parciales imputados a cada corte. Base: prendas del corte × precio
            por prenda.
          </p>
        </div>
        <Button onClick={() => abrirPago()} disabled={cortesPagables.length === 0}>
          + Registrar pago
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-4">
        <Kpi label="Total mano de obra" value={total} accent="border-t-amber-600/70" />
        <Kpi label="Pagado" value={pagado} accent="border-t-emerald-600/70" />
        <Kpi label="Saldo pendiente" value={saldoPendiente} accent="border-t-amber-600/70" />
        <Kpi label="Saldo a favor" value={saldoAFavor} accent="border-t-violet-600/70" />
      </div>

      <div className="flex flex-col gap-2 rounded-lg border border-stone-200 bg-white p-3 sm:flex-row sm:items-center">
        <input
          className="h-9 flex-1 rounded-md border border-stone-300 bg-white px-3 text-sm focus:border-amber-600 focus:outline-none"
          placeholder="Buscar por corte, modelo, taller o concepto..."
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
        />
        <select
          className={selectCls}
          value={filtroTaller}
          onChange={(e) => setFiltroTaller(e.target.value)}
        >
          <option value="">Todos los talleres</option>
          {talleres.map((taller) => (
            <option key={taller.id} value={taller.id}>
              {taller.nombre}
            </option>
          ))}
        </select>
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
      </div>

      <div>
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-stone-900">Cortes a pagar</h2>
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
                <th className={thRight}>Prendas</th>
                <th className={thRight}>$/prenda</th>
                <th className={thRight}>Total</th>
                <th className={thRight}>Pagado</th>
                <th className={thRight}>Saldo</th>
                <th className={`${th} text-left`}>Estado pago</th>
                <th className="px-4 py-2.5 text-center text-xs font-semibold uppercase tracking-wide text-stone-500">
                  Acción
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {resumenesFiltrados.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-4 py-12 text-center text-sm text-stone-400">
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
                      <td className={tdRight}>{corte.cantidadPrendas}</td>
                      <td className={tdRight}>
                        <Money value={corte.precioPorPrenda} />
                      </td>
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

      <div>
        <h2 className="text-sm font-semibold text-stone-900">Pagos registrados</h2>
        
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
          <div className="border-t border-stone-100 px-4 py-2.5 text-xs text-stone-400">
            Base de pago: prendas del corte × precio por prenda. Los adelantos y pagos parciales
            se descuentan del total; si el monto supera el saldo, el excedente queda como saldo a
            favor del taller.
          </div>
        </div>
      </div>

      <div>
        <h2 className="text-sm font-semibold text-stone-900">Saldo por taller</h2>
        
        {/* Vista Mobile: Tarjetas de Saldo por taller */}
        <div className="mt-2 space-y-2.5 md:hidden">
          {saldosPorTaller.length === 0 ? (
            <div className="rounded-lg border border-stone-200 bg-white p-6 text-center text-sm text-stone-400">
              No hay talleres con cortes asignados.
            </div>
          ) : (
            saldosPorTaller.map((taller) => (
              <div
                key={taller.tallerId}
                className="rounded-lg border border-stone-200 bg-white p-3 shadow-sm space-y-2"
              >
                <div className="flex items-center justify-between border-b border-stone-100 pb-1.5">
                  <span className="font-semibold text-stone-900">{taller.tallerNombre}</span>
                  <span className="text-xs text-stone-500">{taller.cortes} cortes</span>
                </div>
                <div className="grid grid-cols-3 gap-2 text-xs">
                  <div>
                    <span className="text-stone-400 block text-[10px]">Debe</span>
                    <strong className="text-stone-800"><Money value={taller.total} /></strong>
                  </div>
                  <div>
                    <span className="text-stone-400 block text-[10px]">Pagado</span>
                    <strong className="text-stone-800"><Money value={taller.pagado} /></strong>
                  </div>
                  <div className="text-right">
                    <span className="text-stone-400 block text-[10px]">Saldo</span>
                    <SaldoCell saldo={taller.saldo} />
                  </div>
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
                <th className={`${th} text-left`}>Taller</th>
                <th className={thRight}>Cortes</th>
                <th className={thRight}>Debe</th>
                <th className={thRight}>Pagado</th>
                <th className={thRight}>Saldo</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {saldosPorTaller.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-10 text-center text-sm text-stone-400">
                    No hay talleres con cortes asignados.
                  </td>
                </tr>
              ) : (
                saldosPorTaller.map((taller) => (
                  <tr key={taller.tallerId} className="hover:bg-stone-50">
                    <td className={`${td} font-medium`}>{taller.tallerNombre}</td>
                    <td className={tdRight}>{taller.cortes}</td>
                    <td className={tdRight}>
                      <Money value={taller.total} />
                    </td>
                    <td className={tdRight}>
                      <Money value={taller.pagado} />
                    </td>
                    <td className={tdRight}>
                      <SaldoCell saldo={taller.saldo} />
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

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
