import { useState, useMemo } from 'react'
import { Button } from '../../../shared/components/Button'
import { formatDate } from '../../../utils/format'
import { siguienteCodigo, siguienteId } from '../../../utils/codigos'
import { ordenarPorFechaYCodigoDesc } from '../../../utils/orden'
import { useErpStore } from '../../../data/erpStore'
import type { Encimada } from '../../../types'
import { EncimadaModal } from '../components/EncimadaModal'
import { EncimadaDetalleModal } from '../components/EncimadaDetalleModal'

const th = 'px-4 py-2.5 text-xs font-semibold uppercase tracking-wide text-stone-500'
const thRight = `${th} text-right`
const td = 'px-4 py-2.5 text-sm text-stone-900'
const tdRight = `${td} text-right tabular-nums`

function totales(encimada: Encimada) {
  const capas = encimada.cargas.reduce((a, c) => a + c.capas, 0)
  const prendas = capas * encimada.items.reduce((a, i) => a + i.cantidad, 0)
  return { capas, prendas }
}

export function CargaCapasPage() {
  const { encimadas, articulos, saveEncimada, deleteEncimada } = useErpStore()
  const [open, setOpen] = useState(false)
  const [viewing, setViewing] = useState<Encimada | null>(null)
  const [editing, setEditing] = useState<Encimada | null>(null)
  const nextCodigo = siguienteCodigo(
    'ENC',
    encimadas.map((e) => e.codigo),
  )
  const nextId = siguienteId(
    'enc',
    encimadas.map((e) => e.id),
  )

  // Más nuevas primero
  const encimadasOrdenadas = useMemo(
    () => ordenarPorFechaYCodigoDesc(encimadas, (e) => e.fecha, (e) => e.codigo),
    [encimadas],
  )

  const handleEliminar = (encimada: Encimada) => {
    const vinculados = articulos.filter((a) => a.encimadaId === encimada.id).length
    const extra = vinculados
      ? ` Los ${vinculados} ${vinculados === 1 ? 'artículo generado' : 'artículos generados'} desde ella se mantienen.`
      : ''
    if (
      !window.confirm(
        `¿Eliminar la encimada ${encimada.codigo}? Se liberan los rollos usados.${extra} Las encimadas posteriores se renumeran para mantener la secuencia.`,
      )
    ) {
      return
    }
    deleteEncimada(encimada.id)
    if (viewing?.id === encimada.id) setViewing(null)
    if (editing?.id === encimada.id) setEditing(null)
  }

  return (
    <div>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl sm:text-2xl font-semibold text-stone-900">Carga de capas</h1>
          <p className="mt-0.5 text-xs sm:text-sm text-stone-500">
            Cargá capas por color y definí la cantidad de prendas por tizada.
          </p>
        </div>
        <Button
          onClick={() => {
            setEditing(null)
            setOpen(true)
          }}
        >
          + Nueva encimada
        </Button>
      </div>

      {/* Vista Mobile: Tarjetas compactas */}
      <div className="mt-4 space-y-3 sm:hidden">
        {encimadasOrdenadas.length === 0 ? (
          <div className="rounded-lg border border-stone-200 bg-white p-6 text-center text-sm text-stone-400">
            No hay encimadas cargadas.
          </div>
        ) : (
          encimadasOrdenadas.map((encimada) => {
            const t = totales(encimada)
            const items = encimada.items.filter((i) => i.modeloNombre.trim())

            return (
              <div
                key={encimada.id}
                onClick={() => setViewing(encimada)}
                className="cursor-pointer rounded-lg border border-stone-200 bg-white p-3.5 shadow-sm active:bg-stone-50 transition-colors"
              >
                <div className="flex items-center justify-between border-b border-stone-100 pb-2">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-stone-900">{encimada.codigo}</span>
                    <span className="text-xs text-stone-500">{formatDate(encimada.fecha)}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span
                      className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                        encimada.estado === 'EN_CORTE'
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-emerald-100 text-emerald-800'
                      }`}
                    >
                      {encimada.estado === 'EN_CORTE' ? 'En corte' : 'Cerrada'}
                    </span>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation()
                        handleEliminar(encimada)
                      }}
                      className="rounded px-1.5 py-0.5 text-[11px] font-medium text-red-700 hover:bg-red-50"
                    >
                      Eliminar
                    </button>
                  </div>
                </div>

                <div className="mt-2 space-y-1 text-xs text-stone-600">
                  {items.length === 0 ? (
                    <div className="text-stone-400">Sin modelos cargados.</div>
                  ) : (
                    items.map((item) => (
                      <div key={item.id} className="flex items-baseline justify-between gap-3">
                        <span className="font-medium text-stone-700">{item.modeloNombre}</span>
                        <span className="shrink-0 tabular-nums text-stone-500">
                          {t.capas} capas × {item.cantidad} ={' '}
                          <strong className="text-stone-800">
                            {t.capas * (Number(item.cantidad) || 0)}
                          </strong>{' '}
                          prendas
                        </span>
                      </div>
                    ))
                  )}
                </div>

                <div className="mt-3 flex items-center justify-between rounded bg-stone-50 px-2.5 py-1.5 text-xs">
                  <span className="text-stone-500">
                    Capas totales: <strong className="text-stone-800">{t.capas}</strong>
                  </span>
                  <span className="text-stone-500">
                    Total prendas: <strong className="text-stone-900">{t.prendas}</strong>
                  </span>
                </div>
              </div>
            )
          })
        )}
      </div>

      {/* Vista Escritorio: Tabla completa */}
      <div className="mt-4 hidden sm:block overflow-x-auto rounded-lg border border-stone-200 bg-white">
        <table className="w-full divide-y divide-stone-200">
          <thead className="bg-stone-50">
            <tr>
              <th className={`${th} text-left`}>Encimada</th>
              <th className={`${th} text-left`}>Estado</th>
              <th className={thRight}>Capas</th>
              <th className={`${th} text-left`}>Modelos / capas por modelo</th>
              <th className={thRight}>Total prendas</th>
              <th className={`${th} text-right`}>Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-stone-100">
            {encimadasOrdenadas.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-sm text-stone-400">
                  No hay encimadas cargadas.
                </td>
              </tr>
            ) : (
              encimadasOrdenadas.map((encimada) => {
                const t = totales(encimada)
                const items = encimada.items.filter((i) => i.modeloNombre.trim())
                return (
                  <tr
                    key={encimada.id}
                    onClick={() => setViewing(encimada)}
                    className="cursor-pointer hover:bg-stone-50"
                  >
                    <td className="px-4 py-2.5">
                      <div className="text-sm font-medium text-stone-900">{encimada.codigo}</div>
                      <div className="text-xs text-stone-500">{formatDate(encimada.fecha)}</div>
                    </td>
                    <td className="px-4 py-2.5">
                      <span
                        className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${
                          encimada.estado === 'EN_CORTE'
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-emerald-100 text-emerald-800'
                        }`}
                      >
                        {encimada.estado === 'EN_CORTE' ? 'En corte' : 'Cerrada'}
                      </span>
                    </td>
                    <td className={`${tdRight} font-semibold`}>{t.capas}</td>
                    <td className="px-4 py-2.5">
                      {items.length === 0 ? (
                        <span className="text-xs text-stone-400">Sin modelos</span>
                      ) : (
                        <div className="space-y-1">
                          {items.map((item) => (
                            <div
                              key={item.id}
                              className="flex items-baseline justify-between gap-4 text-xs"
                            >
                              <span className="min-w-0 truncate font-medium text-stone-800">
                                {item.modeloNombre}
                              </span>
                              <span className="shrink-0 tabular-nums text-stone-500">
                                {t.capas} capas × {item.cantidad} ={' '}
                                <strong className="text-stone-900">
                                  {t.capas * (Number(item.cantidad) || 0)}
                                </strong>{' '}
                                prendas
                              </span>
                            </div>
                          ))}
                        </div>
                      )}
                    </td>
                    <td className={`${tdRight} font-semibold text-stone-900`}>{t.prendas}</td>
                    <td className="px-4 py-2.5 text-right">
                      <div
                        className="flex items-center justify-end gap-1.5"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <button
                          type="button"
                          onClick={() => setEditing(encimada)}
                          className="rounded px-2 py-1 text-xs font-medium text-stone-600 hover:bg-stone-100 hover:text-stone-900"
                        >
                          Editar
                        </button>
                        <button
                          type="button"
                          onClick={() => handleEliminar(encimada)}
                          className="rounded px-2 py-1 text-xs font-medium text-red-700 hover:bg-red-50"
                        >
                          Eliminar
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              })
            )}
          </tbody>
        </table>
      </div>

      {viewing && (
        <EncimadaDetalleModal
          encimada={viewing}
          onClose={() => setViewing(null)}
          onEdit={() => {
            const enc = viewing
            setViewing(null)
            setEditing(enc)
          }}
          onDelete={() => handleEliminar(viewing)}
        />
      )}

      {open && (
        <EncimadaModal
          idSugerido={nextId}
          codigoSugerido={nextCodigo}
          onClose={() => setOpen(false)}
          onSave={saveEncimada}
        />
      )}

      {editing && (
        <EncimadaModal
          encimada={editing}
          codigoSugerido={editing.codigo}
          onClose={() => setEditing(null)}
          onSave={saveEncimada}
        />
      )}
    </div>
  )
}
