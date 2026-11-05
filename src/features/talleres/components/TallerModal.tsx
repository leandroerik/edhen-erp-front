import { useState } from 'react'
import { Button } from '../../../shared/components/Button'
import type { Taller } from '../../../types'

interface Props {
  taller: Taller | null
  idSugerido: string
  onClose: () => void
  onSave: (taller: Taller) => void
}

const inputCls =
  'h-9 w-full rounded-md border border-stone-300 bg-white px-3 text-sm text-stone-900 focus:border-amber-600 focus:outline-none'
const labelCls = 'mb-1 block text-xs font-medium text-stone-500'

export function TallerModal({ taller, idSugerido, onClose, onSave }: Props) {
  const [nombre, setNombre] = useState(taller?.nombre ?? '')
  const [telefono, setTelefono] = useState(taller?.telefono ?? '')
  const [especialidad, setEspecialidad] = useState(taller?.especialidad ?? '')
  const [direccion, setDireccion] = useState(taller?.direccion ?? '')
  const [nota, setNota] = useState(taller?.nota ?? '')

  const nombreLimpio = nombre.trim()
  const puedeGuardar = nombreLimpio.length > 0

  const handleSave = () => {
    if (!puedeGuardar) return
    onSave({
      id: taller?.id ?? idSugerido,
      nombre: nombreLimpio,
      telefono: telefono.trim(),
      direccion: direccion.trim() || undefined,
      especialidad: especialidad.trim() || undefined,
      nota: nota.trim() || undefined,
      precioPorPrendaPorModelo: taller?.precioPorPrendaPorModelo ?? {},
    })
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-stretch justify-center bg-black/40 sm:items-center sm:p-4">
      <div className="flex h-[100dvh] w-full max-w-lg flex-col bg-white shadow-2xl sm:h-auto sm:max-h-[92vh] sm:rounded-xl">
        {/* Cabecera */}
        <div className="flex items-start justify-between gap-2 border-b border-stone-200 px-4 py-3 sm:items-center sm:px-6 sm:py-4">
          <div>
            <h2 className="text-base font-semibold text-stone-900 sm:text-lg">
              {taller ? 'Editar taller' : 'Nuevo taller'}
            </h2>
            <p className="mt-0.5 text-xs text-stone-500">
              Contacto, especialidad y datos para asignar cortes.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded text-stone-400 hover:bg-stone-100 hover:text-stone-700"
          >
            ✕
          </button>
        </div>

        {/* Formulario */}
        <div className="flex-1 space-y-3 overflow-y-auto p-4 sm:p-6">
          <div>
            <label className={labelCls}>Nombre *</label>
            <input
              className={inputCls}
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              placeholder="Ej: Taller Ana"
              autoFocus
            />
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div>
              <label className={labelCls}>Teléfono</label>
              <input
                type="tel"
                className={inputCls}
                value={telefono}
                onChange={(e) => setTelefono(e.target.value)}
                placeholder="5491155551234"
              />
            </div>
            <div>
              <label className={labelCls}>Especialidad</label>
              <input
                className={inputCls}
                value={especialidad}
                onChange={(e) => setEspecialidad(e.target.value)}
                placeholder="Camisas, pantalones..."
              />
            </div>
          </div>

          <div>
            <label className={labelCls}>Dirección</label>
            <input
              className={inputCls}
              value={direccion}
              onChange={(e) => setDireccion(e.target.value)}
              placeholder="Av. Cabildo 1234"
            />
          </div>

          <div>
            <label className={labelCls}>Nota</label>
            <textarea
              className="w-full rounded-md border border-stone-300 bg-white px-3 py-2 text-sm text-stone-900 focus:border-amber-600 focus:outline-none"
              rows={3}
              value={nota}
              onChange={(e) => setNota(e.target.value)}
              placeholder="Horarios, condiciones de pago, observaciones..."
            />
          </div>
        </div>

        {/* Acciones */}
        <div className="flex gap-2 border-t border-stone-200 p-3 sm:justify-end sm:p-4">
          <Button variant="secondary" className="flex-1 sm:flex-none" onClick={onClose}>
            Cancelar
          </Button>
          <Button className="flex-1 sm:flex-none" onClick={handleSave} disabled={!puedeGuardar}>
            {taller ? 'Guardar cambios' : 'Crear taller'}
          </Button>
        </div>
      </div>
    </div>
  )
}
