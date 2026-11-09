interface Props {
  telaNombre: string
  compact?: boolean
  className?: string
}

export function TelaTag({ telaNombre, compact = false, className = '' }: Props) {
  const tela = telaNombre.trim() || 'Sin tela'
  const size = compact ? 'px-1.5 py-0 text-[10px]' : 'px-2 py-0.5 text-[11px]'

  return (
    <span
      title={tela}
      className={`inline-flex max-w-full items-center rounded-full border border-stone-200 bg-stone-50 font-medium text-stone-700 ${size} ${className}`}
    >
      <span className="truncate">{tela}</span>
    </span>
  )
}
