import { useErpStore } from '../../data/erpStore'
import { colorTallerAsignado, estiloTagTaller } from '../../utils/talleres'

interface Props {
  tallerId?: string
  tallerNombre?: string
  className?: string
}

export function TallerTag({ tallerId, tallerNombre, className = '' }: Props) {
  const { talleres } = useErpStore()
  const sinTaller = !tallerId || tallerId === 'sin-taller'

  return (
    <span
      className={`inline-flex items-center rounded-full border px-1.5 py-0.5 text-[10px] font-medium ${
        sinTaller ? 'border-stone-200 bg-stone-50 text-stone-500' : ''
      } ${className}`}
      style={
        sinTaller
          ? undefined
          : estiloTagTaller(colorTallerAsignado(talleres, tallerId, tallerNombre))
      }
    >
      {sinTaller ? 'Sin asignar' : tallerNombre}
    </span>
  )
}
