import type { UnidadTela } from '../../types'
import { formatCantidad, getStockInfo } from '../../utils/stock'

interface StockIndicatorProps {
  comprado: number
  usado: number
  unidad: UnidadTela
  detalle?: boolean
  className?: string
}

export function StockIndicator({
  comprado,
  usado,
  unidad,
  detalle = true,
  className = '',
}: StockIndicatorProps) {
  const info = getStockInfo(comprado, usado)
  const width = Math.max(0, Math.min(100, info.disponiblePct * 100))

  return (
    <div
      className={`min-w-[110px] ${className}`}
      title={`Consumido ${Math.round(info.consumidoPct * 100)}%`}
    >
      <div className="flex items-center justify-between gap-2">
        <span
          className={`inline-flex rounded-full border px-2 py-0.5 text-[10px] font-semibold ${info.badgeClass}`}
        >
          {info.label}
        </span>
        <span className="text-[11px] font-semibold tabular-nums text-stone-600">
          {Math.round(info.disponiblePct * 100)}%
        </span>
      </div>
      <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-stone-200">
        <div
          className={`h-full rounded-full transition-all ${info.barClass}`}
          style={{ width: `${width}%` }}
        />
      </div>
      <div className="mt-0.5 text-[10px] text-stone-500">
        {detalle ? (
          <>
            Usado {formatCantidad(info.usado, unidad)} · Quedan{' '}
            {formatCantidad(info.disponible, unidad)}
          </>
        ) : (
          <>Quedan {formatCantidad(info.disponible, unidad)}</>
        )}
      </div>
    </div>
  )
}
