import type { UnidadTela } from '../../../types'
import { formatCantidad, formatRollos } from '../../../utils/stock'

export interface ColorDisponible {
  colorId: string
  colorNombre: string
  disponibleCantidad: number
  disponibleRollos: number
}

interface Props {
  telaNombre: string
  unidad: UnidadTela
  disponibleCantidad: number
  disponibleRollos: number
  colores: ColorDisponible[]
  onClose: () => void
}

export function DisponibilidadTelaModal({
  telaNombre,
  unidad,
  disponibleCantidad,
  disponibleRollos,
  colores,
  onClose,
}: Props) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 sm:items-center sm:p-4"
      onClick={onClose}
    >
      <div
        className="flex max-h-[90vh] w-full flex-col rounded-t-2xl bg-white shadow-xl sm:max-h-[85vh] sm:max-w-md sm:rounded-xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Cabecera */}
        <div className="flex items-start justify-between gap-2 border-b border-stone-200 px-4 py-3 sm:px-5">
          <div className="min-w-0">
            <h2 className="truncate text-base font-semibold text-stone-900">{telaNombre}</h2>
            <p className="mt-0.5 text-xs text-stone-500">Colores y rollos disponibles</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar"
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded text-stone-400 hover:bg-stone-100 hover:text-stone-700"
          >
            ✕
          </button>
        </div>

        {/* Resumen */}
        <div className="grid grid-cols-2 gap-2 px-4 py-3 sm:px-5">
          <div className="rounded-lg border border-stone-200 bg-stone-50 px-3 py-2">
            <div className="text-[10px] font-medium uppercase tracking-wide text-stone-500">
              Disponible
            </div>
            <div className="mt-0.5 text-base font-semibold text-stone-900">
              {formatCantidad(disponibleCantidad, unidad)}
            </div>
          </div>
          <div className="rounded-lg border border-stone-200 bg-stone-50 px-3 py-2">
            <div className="text-[10px] font-medium uppercase tracking-wide text-stone-500">
              Rollos
            </div>
            <div className="mt-0.5 text-base font-semibold text-stone-900">
              {formatRollos(disponibleRollos)}
            </div>
          </div>
        </div>

        {/* Colores con stock */}
        <div className="flex-1 overflow-y-auto px-4 pb-4 sm:px-5">
          {colores.length === 0 ? (
            <p className="rounded-lg border border-dashed border-stone-200 px-3 py-6 text-center text-sm text-stone-400">
              Esta tela no tiene stock disponible.
            </p>
          ) : (
            <div className="divide-y divide-stone-100 overflow-hidden rounded-lg border border-stone-200">
              {colores.map((color) => (
                <div
                  key={color.colorId}
                  className="flex items-center justify-between gap-3 px-3 py-2.5"
                >
                  <div className="min-w-0">
                    <div className="truncate text-sm font-medium text-stone-900">
                      {color.colorNombre}
                    </div>
                    <div className="text-[11px] text-stone-500">
                      {formatCantidad(color.disponibleCantidad, unidad)}
                    </div>
                  </div>
                  <span className="shrink-0 rounded-full bg-stone-100 px-2 py-0.5 text-[11px] font-semibold text-stone-700">
                    {formatRollos(color.disponibleRollos)}{' '}
                    {color.disponibleRollos === 1 ? 'rollo' : 'rollos'}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
