interface PaginationProps {
  page: number
  pageSize: number
  totalItems: number
  onPageChange: (page: number) => void
  onPageSizeChange: (size: number) => void
  pageSizeOptions?: number[]
  itemLabel?: string
}

export function Pagination({
  page,
  pageSize,
  totalItems,
  onPageChange,
  onPageSizeChange,
  pageSizeOptions = [10, 20, 50],
  itemLabel = 'filas',
}: PaginationProps) {
  if (totalItems === 0) return null

  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize))
  const current = Math.min(Math.max(1, page), totalPages)
  const start = (current - 1) * pageSize + 1
  const end = Math.min(current * pageSize, totalItems)

  return (
    <div className="flex flex-col items-center justify-between gap-3 rounded-lg border border-stone-200 bg-white px-4 py-2.5 text-xs text-stone-600 sm:flex-row">
      <div className="flex items-center gap-3">
        <span>
          Mostrando <strong className="text-stone-900">{start}</strong> a{' '}
          <strong className="text-stone-900">{end}</strong> de{' '}
          <strong className="text-stone-900">{totalItems}</strong> {itemLabel}
        </span>
        <div className="hidden items-center gap-1.5 border-l border-stone-200 pl-3 sm:flex">
          <span className="text-stone-400">Por página:</span>
          {pageSizeOptions.map((num) => (
            <button
              key={num}
              type="button"
              onClick={() => onPageSizeChange(num)}
              className={`rounded px-1.5 py-0.5 text-xs font-medium transition-colors ${
                pageSize === num
                  ? 'bg-stone-900 text-white'
                  : 'text-stone-600 hover:bg-stone-100'
              }`}
            >
              {num}
            </button>
          ))}
        </div>
      </div>

      <div className="flex items-center gap-1.5">
        <button
          type="button"
          disabled={current <= 1}
          onClick={() => onPageChange(current - 1)}
          className="inline-flex h-8 items-center justify-center rounded border border-stone-200 bg-white px-2.5 text-xs font-medium text-stone-700 transition-colors hover:bg-stone-50 disabled:cursor-not-allowed disabled:opacity-40"
        >
          ← Anterior
        </button>

        <span className="px-2 text-xs font-semibold text-stone-800">
          {current} / {totalPages}
        </span>

        <button
          type="button"
          disabled={current >= totalPages}
          onClick={() => onPageChange(current + 1)}
          className="inline-flex h-8 items-center justify-center rounded border border-stone-200 bg-white px-2.5 text-xs font-medium text-stone-700 transition-colors hover:bg-stone-50 disabled:cursor-not-allowed disabled:opacity-40"
        >
          Siguiente →
        </button>
      </div>
    </div>
  )
}
