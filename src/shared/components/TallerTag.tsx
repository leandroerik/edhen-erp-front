import { useNavigate } from 'react-router-dom'
import { useErpStore } from '../../data/erpStore'
import { colorTallerAsignado, estiloTagTaller } from '../../utils/talleres'

interface Props {
  tallerId?: string
  tallerNombre?: string
  className?: string
}

export function TallerTag({ tallerId, tallerNombre, className = '' }: Props) {
  const navigate = useNavigate()
  const { talleres } = useErpStore()
  const sinTaller = !tallerId || tallerId === 'sin-taller'
  const clases = `inline-flex items-center rounded-full border px-1.5 py-0.5 text-[10px] font-medium ${
    sinTaller
      ? 'border-stone-200 bg-stone-50 text-stone-500'
      : 'cursor-pointer transition-opacity hover:opacity-80'
  } ${className}`

  if (sinTaller || (!tallerId && !tallerNombre)) {
    return <span className={clases}>{sinTaller ? 'Sin asignar' : tallerNombre}</span>
  }

  const destino = tallerId || tallerNombre || ''

  return (
    <button
      type="button"
      title={`Ver taller ${tallerNombre || ''}`.trim()}
      onClick={(e) => {
        e.stopPropagation()
        navigate(`/talleres?taller=${encodeURIComponent(destino)}`)
      }}
      className={clases}
      style={estiloTagTaller(colorTallerAsignado(talleres, tallerId, tallerNombre))}
    >
      {tallerNombre}
    </button>
  )
}
