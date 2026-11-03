import { useState } from 'react'
import { Button } from '../../../shared/components/Button'
import { formatDate } from '../../../utils/format'
import { useErpStore } from '../../../data/erpStore'
import type { Encimada } from '../../../types'
import { EncimadaModal } from '../components/EncimadaModal'

const th = 'px-4 py-2.5 text-xs font-semibold uppercase tracking-wide text-stone-500'
const thRight = `${th} text-right`
const td = 'px-4 py-2.5 text-sm text-stone-900'
const tdRight = `${td} text-right tabular-nums`

function totales(encimada: Encimada) {
  const capas = encimada.cargas.reduce((a, c) => a + c.capas, 0)
  const prendas = capas * encimada.items.reduce((a, i) => a + i.cantidad, 0)
  return {
    capas,
    prendas,
    modelos: encimada.items.length,
  }
}

export function CargaCapasPage() {
  const { encimadas, saveEncimada } = useErpStore()
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState<Encimada | null>(null)
  const nextCodigo = `ENC-${String(encimadas.length + 1).padStart(4, '0')}`

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
        {encimadas.length === 0 ? (
          <div className="rounded-lg border border-stone-200 bg-white p-6 text-center text-sm text-stone-400">
            No hay encimadas cargadas.
          </div>
        ) : (
          encimadas.map((encimada) => {
            const t = totales(encimada)
            const modelosTexto = encimada.items
              .map(
                (i) =>
                  `${i.modeloNombre}${
                    typeof i.porcentaje === 'number'
                      ? ` (${i.porcentaje}%)`
                      : i.cantidad
                      ? ` (${i.cantidad} t.)`
                      : ''
                  }`,
              )
              .filter(Boolean)
              .join(', ')

            return (
              <div
                key={encimada.id}
                onClick={() => setEditing(encimada)}
                className="cursor-pointer rounded-lg border border-stone-200 bg-white p-3.5 shadow-sm active:bg-stone-50 transition-colors"
              >
                <div className="flex items-center justify-between border-b border-stone-100 pb-2">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-stone-900">{encimada.codigo}</span>
                    <span className="text-xs text-stone-500">{formatDate(encimada.fecha)}</span>
                  </div>
                  <span
                    className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                      encimada.estado === 'EN_CORTE'
                        ? 'bg-amber-100 text-amber-800'
                        : 'bg-emerald-100 text-emerald-800'
                    }`}
                  >
                    {encimada.estado === 'EN_CORTE' ? 'En corte' : 'Cerrada'}
                  </span>
                </div>

                <div className="mt-2 text-xs text-stone-600">
                  <span className="font-medium text-stone-700">Modelos:</span> {modelosTexto || '-'}
                </div>

                <div className="mt-3 flex items-center justify-between rounded bg-stone-50 px-2.5 py-1.5 text-xs">
                  <span className="text-stone-500">
                    Capas: <strong className="text-stone-800">{t.capas}</strong>
                  </span>
                  <span className="text-stone-500">
                    Total prendas: <strong className="text-stone-900">{t.prendas}</strong>
                  </span>
                  <span className="font-medium text-amber-700">Editar →</span>
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
              <th className={`${th} text-left`}>Código</th>
              <th className={`${th} text-left`}>Fecha</th>
              <th className={`${th} text-left`}>Estado</th>
              <th className={thRight}>Capas</th>
              <th className={`${th} text-left`}>Modelos</th>
              <th className={thRight}>Total prendas</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-stone-100">
            {encimadas.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-sm text-stone-400">
                  No hay encimadas cargadas.
                </td>
              </tr>
            ) : (
              encimadas.map((encimada) => {
                const t = totales(encimada)
                return (
                  <tr
                    key={encimada.id}
                    onClick={() => setEditing(encimada)}
                    className="cursor-pointer hover:bg-stone-50"
                  >
                    <td className={`${td} font-medium`}>{encimada.codigo}</td>
                    <td className={`${td} text-stone-600`}>{formatDate(encimada.fecha)}</td>
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
                    <td className={tdRight}>{t.capas}</td>
                    <td className={`${td} text-stone-600`}>
                      {encimada.items
                        .map(
                          (i) =>
                            `${i.modeloNombre}${
                              typeof i.porcentaje === 'number'
                                ? ` (${i.porcentaje}%)`
                                : i.cantidad
                                ? ` (${i.cantidad} talles)`
                                : ''
                            }`,
                        )
                        .filter(Boolean)
                        .join(', ') || '-'}
                    </td>
                    <td className={`${tdRight} font-semibold text-stone-900`}>{t.prendas}</td>
                  </tr>
                )
              })
            )}
          </tbody>
        </table>
      </div>

      {open && (
        <EncimadaModal
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
