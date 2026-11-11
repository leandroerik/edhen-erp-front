import { Button } from '../../../shared/components/Button'
import { formatDate } from '../../../utils/format'
import type { Encimada } from '../../../types'

interface Props {
  encimada: Encimada
  onClose: () => void
  onEdit: () => void
  onDelete: () => void
}

const th = 'px-3 py-2 text-xs font-semibold uppercase tracking-wide text-stone-500'
const thRight = `${th} text-right`
const td = 'px-3 py-2.5 text-sm text-stone-900'
const tdRight = `${td} text-right tabular-nums`

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

export function EncimadaDetalleModal({ encimada, onClose, onEdit, onDelete }: Props) {
  const itemsValidos = encimada.items.filter(
    (item) => item.modeloNombre.trim() && item.cantidad > 0,
  )
  const capasTotales = encimada.cargas.reduce((a, c) => a + (Number(c.capas) || 0), 0)
  const tallesPorCapa = itemsValidos.reduce((a, i) => a + (Number(i.cantidad) || 0), 0)
  const prendasTotales = capasTotales * tallesPorCapa

  const capasPorColor = new Map<
    string,
    { key: string; nombre: string; capas: number }
  >()
  for (const carga of encimada.cargas) {
    const nombre = carga.colorNombre.trim()
    if (!nombre || carga.capas <= 0) continue
    const key = nombre.toLowerCase()
    const actual = capasPorColor.get(key)
    if (actual) actual.capas += carga.capas
    else capasPorColor.set(key, { key, nombre, capas: carga.capas })
  }
  const colores = Array.from(capasPorColor.values())

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 sm:items-center sm:p-4">
      <div className="flex max-h-[95vh] w-full flex-col rounded-t-2xl bg-white shadow-xl sm:max-h-[92vh] sm:max-w-2xl sm:rounded-lg">
        {/* Cabecera */}
        <div className="flex items-start justify-between gap-2 border-b border-stone-200 px-4 py-3">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-base font-semibold text-stone-900">{encimada.codigo}</h2>
              <span
                className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                  encimada.estado === 'EN_CORTE'
                    ? 'bg-amber-100 text-amber-800'
                    : 'bg-emerald-100 text-emerald-800'
                }`}
              >
                {encimada.estado === 'EN_CORTE' ? 'En corte' : 'Cerrada'}
              </span>
              <span className="inline-flex items-center rounded-full border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold text-emerald-800">
                {prendasTotales} prendas
              </span>
            </div>
            <p className="mt-0.5 text-xs text-stone-500">{formatDate(encimada.fecha)}</p>
            {encimada.notas && (
              <p className="mt-0.5 text-xs text-stone-500">{encimada.notas}</p>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-stone-400 hover:bg-stone-100 hover:text-stone-700"
          >
            ✕
          </button>
        </div>

        {/* Cuerpo */}
        <div className="flex-1 space-y-4 overflow-y-auto p-4">
          {/* Capas por color */}
          <div className="overflow-hidden rounded-lg border border-stone-200 bg-white">
            <div className="flex items-center justify-between gap-2 border-b border-stone-200 bg-stone-50 px-3.5 py-2.5">
              <span className="text-xs font-semibold uppercase tracking-wide text-stone-700">
                Capas por color
              </span>
              <span className="text-[11px] text-stone-500">{capasTotales} capas</span>
            </div>
            <table className="w-full divide-y divide-stone-200">
              <thead className="bg-white">
                <tr>
                  <th className={`${th} text-left`}>Color</th>
                  <th className={thRight}>Capas</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {colores.length === 0 ? (
                  <tr>
                    <td colSpan={2} className="px-3 py-4 text-center text-xs text-stone-400">
                      Sin capas cargadas.
                    </td>
                  </tr>
                ) : (
                  colores.map((color) => (
                    <tr key={color.key}>
                      <td className={td}>
                        <div className="flex items-center gap-1.5">
                          <span
                            className={`h-2.5 w-2.5 shrink-0 rounded-full border border-stone-300 ${
                              COLOR_SWATCH[color.nombre] ?? 'bg-stone-200'
                            }`}
                          />
                          {color.nombre}
                        </div>
                      </td>
                      <td className={tdRight}>{color.capas}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Prendas por modelo y color */}
          <div className="overflow-hidden rounded-lg border border-stone-200 bg-white">
            <div className="border-b border-stone-200 bg-stone-50 px-3.5 py-2.5">
              <span className="text-xs font-semibold uppercase tracking-wide text-stone-700">
                Prendas por modelo y color
              </span>
            </div>

            {/* Mobile: resumen por modelo con desglose de colores */}
            <div className="space-y-2 p-2 sm:hidden">
              {itemsValidos.length === 0 ? (
                <div className="rounded-lg border border-dashed border-stone-200 px-3 py-4 text-center text-xs text-stone-400">
                  Sin modelos cargados.
                </div>
              ) : (
                itemsValidos.map((item) => {
                  const cantidad = Number(item.cantidad) || 0
                  return (
                    <div
                      key={item.id}
                      className="rounded-lg border border-stone-200 bg-stone-50/60 p-2.5 text-xs"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <div className="truncate font-medium text-stone-900">
                            {item.modeloNombre}
                          </div>
                          <div className="text-[10px] text-stone-500">
                            {cantidad} {cantidad === 1 ? 'talle' : 'talles'} por capa
                          </div>
                        </div>
                        <div className="shrink-0 text-right">
                          <div className="font-semibold text-stone-900">
                            {capasTotales * cantidad} prendas
                          </div>
                          <div className="text-[10px] text-stone-500">total del modelo</div>
                        </div>
                      </div>
                      {colores.length > 0 && (
                        <div className="mt-1.5 flex flex-wrap gap-1">
                          {colores.map((color) => (
                            <span
                              key={color.key}
                              className="inline-flex items-center gap-1 rounded-full border border-stone-200 bg-white px-1.5 py-0.5 text-[10px] text-stone-600"
                            >
                              <span
                                className={`h-1.5 w-1.5 shrink-0 rounded-full border border-stone-300 ${
                                  COLOR_SWATCH[color.nombre] ?? 'bg-stone-200'
                                }`}
                              />
                              {color.nombre}:{' '}
                              <strong className="font-semibold text-stone-800">
                                {color.capas * cantidad}
                              </strong>
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  )
                })
              )}
              {itemsValidos.length > 0 && (
                <div className="flex items-center justify-between rounded-lg border border-stone-200 bg-stone-50 px-2.5 py-2 text-xs">
                  <span className="font-semibold text-stone-900">Total</span>
                  <span className="font-bold text-stone-900">{prendasTotales} prendas</span>
                </div>
              )}
            </div>

            <div className="hidden overflow-x-auto sm:block">
              <table className="w-full min-w-[420px] divide-y divide-stone-200">
                <thead className="bg-white">
                  <tr>
                    <th className={`${th} text-left`}>Modelo</th>
                    {colores.map((color) => (
                      <th key={color.key} className={thRight}>
                        <div>{color.nombre}</div>
                        <div className="text-[10px] font-normal normal-case text-stone-400">
                          {color.capas} capas
                        </div>
                      </th>
                    ))}
                    <th className={thRight}>Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100">
                  {itemsValidos.length === 0 ? (
                    <tr>
                      <td
                        colSpan={colores.length + 2}
                        className="px-3 py-4 text-center text-xs text-stone-400"
                      >
                        Sin modelos cargados.
                      </td>
                    </tr>
                  ) : (
                    itemsValidos.map((item) => {
                      const cantidad = Number(item.cantidad) || 0
                      return (
                        <tr key={item.id}>
                          <td className={td}>
                            <div className="font-medium text-stone-900">
                              {item.modeloNombre}
                            </div>
                            <div className="text-[10px] text-stone-500">
                              {cantidad} {cantidad === 1 ? 'talle' : 'talles'} por capa
                            </div>
                          </td>
                          {colores.map((color) => (
                            <td key={color.key} className={tdRight}>
                              {color.capas * cantidad}
                            </td>
                          ))}
                          <td className={`${tdRight} font-semibold text-stone-900`}>
                            {capasTotales * cantidad}
                          </td>
                        </tr>
                      )
                    })
                  )}
                </tbody>
                {itemsValidos.length > 0 && colores.length > 0 && (
                  <tfoot className="bg-stone-50">
                    <tr>
                      <td className={`${td} font-semibold text-stone-900`}>Total</td>
                      {colores.map((color) => (
                        <td
                          key={color.key}
                          className={`${tdRight} font-semibold text-stone-900`}
                        >
                          {color.capas * tallesPorCapa}
                        </td>
                      ))}
                      <td className={`${tdRight} font-bold text-stone-900`}>
                        {prendasTotales}
                      </td>
                    </tr>
                  </tfoot>
                )}
              </table>
            </div>
          </div>
        </div>

        {/* Pie */}
        <div className="flex flex-col gap-2 border-t border-stone-200 bg-white px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="order-2 text-center text-[11px] text-stone-500 sm:order-1 sm:text-left">
            {capasTotales} capas
          </div>
          <div className="order-1 flex gap-2">
            <Button variant="danger" className="flex-1 sm:flex-none" onClick={onDelete}>
              Eliminar
            </Button>
            <Button variant="secondary" className="flex-1 sm:flex-none" onClick={onClose}>
              Cerrar
            </Button>
            <Button className="flex-1 sm:flex-none" onClick={onEdit}>
              Editar
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
