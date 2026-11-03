interface Props {
  children: React.ReactNode
  className?: string
}

export function Card({ children, className = '' }: Props) {
  return (
    <div className={`rounded-lg border border-stone-200 bg-white ${className}`}>
      {children}
    </div>
  )
}

export function CardHeader({ children, className = '' }: Props) {
  return <div className={`border-b border-stone-200 px-4 py-3 ${className}`}>{children}</div>
}

export function CardTitle({ children, className = '' }: Props) {
  return <h2 className={`text-base font-semibold text-stone-900 ${className}`}>{children}</h2>
}

export function CardContent({ children, className = '' }: Props) {
  return <div className={`p-4 ${className}`}>{children}</div>
}
