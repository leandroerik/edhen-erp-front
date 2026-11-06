import { useState } from 'react'
import { Button } from '../../../shared/components/Button'
import { Money } from '../../../shared/components/Money'
import { formatDate, toISODate, uid } from '../../../utils/format'
import type { Corte, PagoTaller, TipoPagoTaller } from '../../../types'
import { TIPO_PAGO_LABEL, resumenPagoCorte } from '../pagos.utils'

interface Props {
  cortes: Corte[]
  pagos: PagoTaller[]
  corteIdInicial?: string
  onClose: () => void
  onSave: (pago: PagoTaller) => void
}

const inputCls =
  'h-9 w-full rounded border border-stone-300 bg-white px-2 text-sm text-stone-900 focus:border-amber-600 focus:outline-none'
const labelCls = 'mb-1 block text-xs font-medium text-stone-500'

export function RegistrarPagoModal({
  cortes,
  pagos,
  corteIdInicial,
  onClose,
  onSave,
}: Props) {
  const corteInicial = corteIdInicial || cortes[0]?.id || ''
  const [corteId, setCorteId] = useState(corteInicial)
  const [fecha, setFecha] = useState(() => toISODate(new Date()))
  const [monto, setMonto] = useState(0)
  const [concepto, setConcepto] = useState('')

  const corte = cortes.find((item) => item.id === corteId)
  const resumen = corte ? resumenPagoCorte(corte, pagos) : null
  const saldo = resumen?.saldo ?? 0
  const saldoAFavor = saldo < -0.005 ? Math.abs(saldo) : 0
  const exceso = saldo > 0 ? Math.max(0, monto - saldo) : monto
  const sinSaldo = saldo <= 0.005

  const handleCorteChange = (id: string) => {
    setCorteId(id)
    setMonto(0)
  }

  const aplicarPorcentaje = (porcentaje: number) => {
    if (saldo <= 0) return
    setMonto(Math.round(saldo * porcentaje) / 100)
  }

  const handleSave = () => {
    if (!corte) return
    const montoFinal = Math.round((Number(monto) || 0) * 100) / 100
    if (montoFinal <= 0 || !fecha) return

    const tipo: TipoPagoTaller =
      (resumen?.pagos.length ?? 0) === 0
        ? 'ADELANTO'
        : montoFinal >= saldo - 0.005
          ? 'FINAL'
          : 'PARCIAL'

    onSave({
      id: uid('pago'),
      fecha,
      tallerId: corte.tallerId,
      tallerNombre: corte.tallerNombre,
      corteId: corte.id,
      corteCodigo: corte.codigo,
      monto: montoFinal,
      tipo,
      concepto: concepto.trim() || undefined,
    })
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-2 sm:p-4">
      <div className="flex max-h-[96vh] sm:max-h-[92vh] w-full max-w-lg flex-col rounded-lg bg-white shadow-xl">
        <div className="flex items-center justify-between border-b border-stone-200 px-5 py-3">
          <div>
            <h2 className="text-base font-semibold text-stone-900">Registrar pago a taller</h2>
            <p className="text-xs text-stone-500">
              Se imputa al corte seleccionado. Abajo ves su historial.
            </p>
          </div>
          <button
            onClick={onClose}
            className="flex h-7 w-7 items-center justify-center rounded text-stone-400 hover:bg-stone-100 hover:text-stone-700"
          >
            ✕
          </button>
        </div>

        {cortes.length === 0 ? (
          <div className="p-5">
            <div className="rounded border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900">
              No hay cortes con taller asignado. Asigná un taller desde la sección Cortes para
              poder registrar pagos.
            </div>
            <div className="mt-4 flex justify-end">
              <Button variant="secondary" onClick={onClose}>
                Cerrar
              </Button>
            </div>
          </div>
        ) : (
          <>
            <div className="space-y-3 overflow-y-auto p-5">
              <div>
                <label className={labelCls}>Corte</label>
                <select
                  className={inputCls}
                  value={corteId}
                  onChange={(e) => handleCorteChange(e.target.value)}
                >
                  {cortes.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.codigo} · {item.modeloNombre} · {item.tallerNombre}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-3 gap-2 rounded-lg border border-stone-200 bg-stone-50 p-3">
                <div>
                  <div className="text-[11px] text-stone-500">Total corte</div>
                  <div className="mt-0.5 text-sm font-semibold text-stone-900">
                    <Money value={resumen?.total ?? 0} />
                  </div>
                </div>
                <div>
                  <div className="text-[11px] text-stone-500">Pagado</div>
                  <div className="mt-0.5 text-sm font-semibold text-stone-900">
                    <Money value={resumen?.pagado ?? 0} />
                  </div>
                </div>
                <div>
                  <div className="text-[11px] text-stone-500">
                    {saldo < 0 ? 'Saldo a favor' : 'Saldo pendiente'}
                  </div>
                  <div
                    className={`mt-0.5 text-sm font-semibold ${
                      saldo > 0
                        ? 'text-amber-800'
                        : saldo < 0
                          ? 'text-emerald-700'
                          : 'text-stone-900'
                    }`}
                  >
                    <Money value={saldoAFavor || Math.max(0, saldo)} />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={labelCls}>Fecha del pago</label>
                  <input
                    type="date"
                    className={inputCls}
                    value={fecha}
                    onChange={(e) => setFecha(e.target.value)}
                  />
                </div>
                <div>
                  <label className={labelCls}>Monto ($)</label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    className={inputCls}
                    value={monto || ''}
                    onChange={(e) => setMonto(Number(e.target.value) || 0)}
                    placeholder="0"
                  />
                </div>
              </div>

              <div className="flex flex-wrap gap-2">
                <Button
                  type="button"
                  size="sm"
                  variant="secondary"
                  disabled={saldo <= 0}
                  onClick={() => aplicarPorcentaje(50)}
                >
                  50% del saldo
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant="secondary"
                  disabled={saldo <= 0}
                  onClick={() => aplicarPorcentaje(100)}
                >
                  Saldo total
                </Button>
              </div>

              <div>
                <label className={labelCls}>Concepto / nota</label>
                <input
                  className={inputCls}
                  value={concepto}
                  onChange={(e) => setConcepto(e.target.value)}
                  placeholder="Opcional. Ej. adelanto para telas"
                />
              </div>

              <div className="rounded-lg border border-stone-200 bg-white">
                <div className="flex items-center justify-between border-b border-stone-100 px-3 py-2">
                  <span className="text-xs font-semibold uppercase tracking-wide text-stone-500">
                    Historial del corte
                  </span>
                  <span className="text-[11px] text-stone-400">
                    {resumen?.pagos.length ?? 0} pago(s)
                  </span>
                </div>
                {resumen && resumen.pagos.length > 0 ? (
                  <div className="divide-y divide-stone-100">
                    {resumen.pagos.map((pago) => (
                      <div
                        key={pago.id}
                        className="flex items-center justify-between gap-3 px-3 py-2"
                      >
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5 text-xs font-medium text-stone-800">
                            <span>{TIPO_PAGO_LABEL[pago.tipo]}</span>
                            <span className="text-stone-300">·</span>
                            <span className="font-normal text-stone-500">
                              {formatDate(pago.fecha)}
                            </span>
                          </div>
                          {pago.concepto && (
                            <div className="mt-0.5 truncate text-[11px] text-stone-400">
                              {pago.concepto}
                            </div>
                          )}
                        </div>
                        <span className="shrink-0 text-sm font-semibold text-stone-900">
                          <Money value={pago.monto} />
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="px-3 py-3 text-sm text-stone-400">
                    Todavía no hay pagos registrados para este corte.
                  </p>
                )}
              </div>

              {exceso > 0 ? (
                <div className="rounded border border-amber-300 bg-amber-50 px-3 py-2 text-xs text-amber-900">
                  {sinSaldo ? (
                    <>
                      {saldoAFavor > 0
                        ? 'Este corte ya tiene saldo a favor. El nuevo pago se sumará al favor.'
                        : 'Este corte no tiene saldo pendiente. El pago quedará como saldo a favor.'}{' '}
                      Monto: <Money value={monto} />
                    </>
                  ) : (
                    <>
                      El monto supera el saldo por <strong><Money value={exceso} /></strong>. El
                      excedente quedará como saldo a favor del taller.
                    </>
                  )}
                </div>
              ) : null}
            </div>

            <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between border-t border-stone-200 bg-white px-4 sm:px-5 py-3">
              <div className="text-xs text-stone-500">
                Pago a registrar:{' '}
                <strong className="text-stone-900">
                  <Money value={monto} />
                </strong>
              </div>
              <div className="flex items-center gap-2">
                <Button className="flex-1 sm:flex-none" variant="secondary" onClick={onClose}>
                  Cancelar
                </Button>
                <Button className="flex-1 sm:flex-none" onClick={handleSave} disabled={!corte || monto <= 0 || !fecha}>
                  Guardar pago
                </Button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
