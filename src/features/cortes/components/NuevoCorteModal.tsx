import { useState } from 'react'
import { Button } from '../../../shared/components/Button'
import { useErpStore } from '../../../data/erpStore'
import { hoyISO, toISODate } from '../../../utils/format'
import { siguienteIdCorte } from '../../../utils/codigos'
import type { Corte, EstadoCorte } from '../../../types'

interface Props {
  open: boolean
  codigoSugerido: string
  onClose: () => void
  onSave: (corte: Corte) => void
}

const inputCls =
  'h-8 w-full rounded border border-stone-300 bg-white px-2 text-sm text-stone-900 focus:border-amber-600 focus:outline-none'
const labelCls = 'mb-1 block text-xs font-medium text-stone-500'

export function NuevoCorteModal({ open, codigoSugerido, onClose, onSave }: Props) {
  const { cortes, talleres } = useErpStore()
  const [codigo, setCodigo] = useState(codigoSugerido)
  const [fecha, setFecha] = useState(() => hoyISO())
  const [fechaEntrega, setFechaEntrega] = useState(() => {
    const entrega = new Date()
    entrega.setDate(entrega.getDate() + 7)
    return toISODate(entrega)
  })
  const [modeloNombre, setModeloNombre] = useState('')
  const [cantidadPrendas, setCantidadPrendas] = useState<number>(20)
  const [tallerId, setTallerId] = useState('')
  const [precioPorPrenda, setPrecioPorPrenda] = useState<number>(0)
  const [estado, setEstado] = useState<EstadoCorte>('PREPARADO')

  if (!open) return null

  const handleTallerChange = (id: string) => {
    setTallerId(id)
    const tObj = talleres.find((t) => t.id === id)
    if (tObj && precioPorPrenda === 0) {
      const sugerido = Object.values(tObj.precioPorPrendaPorModelo)[0] || 0
      if (sugerido > 0) setPrecioPorPrenda(sugerido)
    }
  }

  const handleSave = () => {
    const cant = Math.max(1, Number(cantidadPrendas) || 1)
    const precio = Math.max(0, Number(precioPorPrenda) || 0)
    const tObj = talleres.find((t) => t.id === tallerId)
    const tallerNombre = tObj ? tObj.nombre : 'Sin asignar'
    const costoManoObra = cant * precio

    const nuevoCorte: Corte = {
      id: siguienteIdCorte(cortes),
      codigo: codigo.trim() || codigoSugerido,
      fecha,
      fechaEntregaPrometida: fechaEntrega,
      modeloId: `mod-${Date.now()}`,
      modeloNombre: modeloNombre.trim() || 'Corte confección',
      tallerId,
      tallerNombre,
      cantidadPrendas: cant,
      precioPorPrenda: precio,
      telasUsadas: [],
      seguimiento: {
        enviadas: cant,
        entregadas: 0,
        falladas: 0,
      },
      estado,
      costoTela: 0,
      costoManoObra,
      costoTotal: costoManoObra,
      costoPorPrenda: precio,
    }

    onSave(nuevoCorte)
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="flex max-h-[92vh] w-full max-w-lg flex-col rounded-lg bg-white shadow-xl">
        {/* Cabecera */}
        <div className="flex items-center justify-between border-b border-stone-200 px-5 py-3">
          <div>
            <h2 className="text-base font-semibold text-stone-900">Nuevo corte</h2>
            <p className="text-xs text-stone-500">
              Registrá un corte para confección y asigná el taller.
            </p>
          </div>
          <button
            onClick={onClose}
            className="flex h-7 w-7 items-center justify-center rounded text-stone-400 hover:bg-stone-100 hover:text-stone-700"
          >
            ✕
          </button>
        </div>

        {/* Formulario */}
        <div className="p-5 space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelCls}>Código</label>
              <input
                className={inputCls}
                value={codigo}
                onChange={(e) => setCodigo(e.target.value)}
              />
            </div>
            <div>
              <label className={labelCls}>Fecha de corte</label>
              <input
                type="date"
                className={inputCls}
                value={fecha}
                onChange={(e) => setFecha(e.target.value)}
              />
            </div>
          </div>

          <div>
            <label className={labelCls}>Prenda / Modelo</label>
            <input
              className={inputCls}
              value={modeloNombre}
              onChange={(e) => setModeloNombre(e.target.value)}
              placeholder="Ej. Remera básica, Camisa corta..."
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelCls}>Cantidad de prendas</label>
              <input
                type="number"
                min="1"
                className={inputCls}
                value={cantidadPrendas || ''}
                onChange={(e) => setCantidadPrendas(Number(e.target.value) || 0)}
              />
            </div>
            <div>
              <label className={labelCls}>Fecha entrega prometida</label>
              <input
                type="date"
                className={inputCls}
                value={fechaEntrega}
                onChange={(e) => setFechaEntrega(e.target.value)}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelCls}>Taller asignado</label>
              <select
                className={inputCls}
                value={tallerId}
                onChange={(e) => handleTallerChange(e.target.value)}
              >
                <option value="">-- Sin asignar --</option>
                {talleres.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.nombre} ({t.especialidad || 'General'})
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className={labelCls}>Precio / prenda mano de obra ($)</label>
              <input
                type="number"
                min="0"
                className={inputCls}
                value={precioPorPrenda || ''}
                onChange={(e) => setPrecioPorPrenda(Number(e.target.value) || 0)}
                placeholder="0"
              />
            </div>
          </div>

          <div>
            <label className={labelCls}>Estado inicial</label>
            <select
              className={inputCls}
              value={estado}
              onChange={(e) => setEstado(e.target.value as EstadoCorte)}
            >
              <option value="PREPARADO">Preparado</option>
              <option value="EN_TALLER">En taller</option>
              <option value="ENTREGADO">Entregado</option>
              <option value="PAGADO">Pagado</option>
            </select>
          </div>
        </div>

        {/* Pie */}
        <div className="flex items-center justify-between border-t border-stone-200 bg-white px-5 py-3">
          <div className="text-xs text-stone-500">
            Total taller estimado:{' '}
            <strong className="text-stone-800">
              ${(Number(cantidadPrendas || 0) * Number(precioPorPrenda || 0)).toLocaleString('es-AR')}
            </strong>
          </div>
          <div className="flex gap-2">
            <Button variant="secondary" onClick={onClose}>
              Cancelar
            </Button>
            <Button onClick={handleSave}>
              Guardar corte
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}

