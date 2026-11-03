import { formatARS } from '../../utils/format'

interface Props {
  value: number
  className?: string
}

export function Money({ value, className = '' }: Props) {
  return <span className={className}>{formatARS(value)}</span>
}
