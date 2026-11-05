import { useState } from 'react'
import { Button } from '../../../shared/components/Button'
import { Money } from '../../../shared/components/Money'
import { mockTelas, mockColores } from '../../../data/mock'
import { useErpStore } from '../../../data/erpStore'
import { hoyISO } from '../../../utils/format'
import type { LoteColor, UnidadTela } from '../../../types'

interface Props {
  open: boolean
  onClose: () => void
  onSave: (data: any) => void
}

const inputCls =
  'h-8 w-full rounded border border-stone-300 bg-white px-2 text-sm text-stone-900 focus:border-amber-600 focus:outline-none'
const numberInputCls =
  'h-8 w-24 rounded border border-stone-300 bg-white px-2 text-center text-sm font-semibold text-stone-900 focus:border-amber-600 focus:outline-none'
const labelCls = 'mb-1 block text-xs font-medium text-stone-500'
const th = 'px-3 py-1.5 text-xs font-semibold uppercase tracking-wide text-stone-500'
const thRight = `${th} text-right`
const tdRight = 'px-3 py-1.5 text-right text-sm tabular-nums'

function newLote(): LoteColor {
  return {
    id: `lote-${Date.now()}-${Math.random().toString(36).slice(2, 5)}`,
    colorId: '',
    colorNombre: '',
    rollos: 0,
    cantidad: 0,
    subtotal: 0,
  }
}

export function NuevaCompraModal({ open, onClose, onSave }: Props) {
  const { proveedores, compras } = useErpStore()
  const proveedoresSugeridos = (() => {
    const mapa = new Map<string, string>()
    for (const p of proveedores) {
      const nombre = p.nombre.trim()
      if (nombre) mapa.set(nombre.toLowerCase(), nombre)
    }
    for (const compra of compras) {
      const nombre = (compra.proveedorNombre || '').trim()
      if (nombre) mapa.set(nombre.toLowerCase(), nombre)
    }
    return Array.from(mapa.entries()).map(([id, nombre]) => ({ id, nombre }))
  })()
  const [fecha, setFecha] = useState(() => hoyISO())
  const [proveedor, setProveedor] = useState(proveedoresSugeridos[0]?.nombre || '')
  const [tela, setTela] = useState(mockTelas[0]?.nombre || '')
  const [unidad, setUnidad] = useState<UnidadTela>('METRO')
  const [precioUnitario, setPrecioUnitario] = useState<number>(0)
  const [notaRemito, setNotaRemito] = useState('')
  const [flete, setFlete] = useState<number>(0)
  const [lotes, setLotes] = useState<LoteColor[]>([newLote()])

  if (!open) return null

  const pUnitario = Math.max(0, Number(precioUnitario) || 0)
  const unidadLabel = unidad === 'METRO' ? 'm' : 'kg'

  const lotesCalculados = lotes.map((l) => {
    const cant = Math.max(0, Number(l.cantidad) || 0)
    const rollos = Math.max(0, Number(l.rollos) || 0)
    const subtotal = cant * pUnitario
    return {
      ...l,
      rollos,
      cantidad: cant,
      subtotal,
    }
  })

  const totalRollos = lotesCalculados.reduce((a, l) => a + l.rollos, 0)
  const totalCantidad = lotesCalculados.reduce((a, l) => a + l.cantidad, 0)
  const subtotalColores = lotesCalculados.reduce((a, l) => a + l.subtotal, 0)
  const totalCompra = subtotalColores + (Number(flete) || 0)

  const filasConDatos = lotesCalculados.filter(
    (l) => l.colorNombre.trim() || l.cantidad > 0 || l.rollos > 0,
  )
  const lotesValidos = lotesCalculados.filter(
    (l) => l.colorNombre.trim() && (l.rollos > 0 || l.cantidad > 0),
  )
  const puedeGuardar =
    filasConDatos.length > 0 &&
    filasConDatos.every(
      (l) => l.colorNombre.trim() && (l.rollos > 0 || l.cantidad > 0),
    )

  const updateLote = (id: string, patch: Partial<LoteColor>) => {
    setLotes((prev) => prev.map((l) => (l.id === id ? { ...l, ...patch } : l)))
  }

  const addLote = () => {
    setLotes((prev) => [...prev, newLote()])
  }

  const removeLote = (id: string) => {
    setLotes((prev) => {
      const next = prev.filter((l) => l.id !== id)
      return next.length ? next : [newLote()]
    })
  }

  const handleTelaChange = (telaNombre: string) => {
    setTela(telaNombre)
    const telaObj = mockTelas.find((t) => t.nombre.toLowerCase() === telaNombre.toLowerCase())
    if (telaObj) {
      setUnidad(telaObj.unidadCompra)
    }
  }

  const handleSave = () => {
    onSave({
      fecha,
      proveedor: proveedor.trim() || 'Proveedor',
      tela: tela.trim() || 'Tela',
      unidad,
      precioUnitario: pUnitario,
      notaRemito: notaRemito.trim() || undefined,
      flete: Number(flete) || 0,
      total: totalCompra,
      totalRollos,
      totalCantidad,
      lotes: lotesValidos,
    })
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="flex max-h-[92vh] w-full max-w-3xl flex-col rounded-lg bg-white shadow-xl">
        {/* Cabecera */}
        <div className="flex items-center justify-between border-b border-stone-200 px-5 py-3">
          <h2 className="text-base font-semibold text-stone-900">Nueva compra de tela</h2>
          <button
            onClick={onClose}
            className="flex h-7 w-7 items-center justify-center rounded text-stone-400 hover:bg-stone-100 hover:text-stone-700"
          >
            ✕
          </button>
        </div>

        {/* Datos generales de la compra */}
        <div className="space-y-2 border-b border-stone-200 bg-stone-50 px-5 py-3">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <div>
              <label className={labelCls}>Fecha</label>
              <input
                type="date"
                className={inputCls}
                value={fecha}
                onChange={(e) => setFecha(e.target.value)}
              />
            </div>

            <div>
              <label className={labelCls}>Proveedor</label>
              <input
                list="proveedores-compra"
                className={inputCls}
                value={proveedor}
                onChange={(e) => setProveedor(e.target.value)}
                placeholder="Proveedor"
              />
              <datalist id="proveedores-compra">
                {proveedoresSugeridos.map((p) => (
                  <option key={p.id} value={p.nombre} />
                ))}
              </datalist>
              <p className="mt-0.5 text-[10px] leading-tight text-stone-400">
                Si escribís uno nuevo, se guarda al confirmar la compra.
              </p>
            </div>

            <div>
              <label className={labelCls}>Tela</label>
              <input
                list="telas-compra"
                className={inputCls}
                value={tela}
                onChange={(e) => handleTelaChange(e.target.value)}
                placeholder="Ej. Morley"
              />
              <datalist id="telas-compra">
                {mockTelas.map((t) => (
                  <option key={t.id} value={t.nombre} />
                ))}
              </datalist>
            </div>

            <div>
              <label className={labelCls}>Precio ($)</label>
              <div className="flex gap-1.5">
                <input
                  type="number"
                  min="0"
                  className={`${inputCls} min-w-0 flex-1`}
                  value={precioUnitario || ''}
                  onChange={(e) => setPrecioUnitario(Number(e.target.value) || 0)}
                  placeholder="0"
                />
                <select
                  className="h-8 w-14 rounded border border-stone-300 bg-white px-1 text-sm text-stone-900 focus:border-amber-600 focus:outline-none"
                  value={unidad}
                  onChange={(e) => setUnidad(e.target.value as UnidadTela)}
                  title="Unidad de compra"
                >
                  <option value="METRO">m</option>
                  <option value="KILO">kg</option>
                </select>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <div className="col-span-2">
              <label className={labelCls}>N° remito o nota (opcional)</label>
              <input
                className={inputCls}
                value={notaRemito}
                onChange={(e) => setNotaRemito(e.target.value)}
                placeholder="Ej. Remito #1042"
              />
            </div>
            <div className="col-span-2">
              <label className={labelCls}>Flete ($ - opcional)</label>
              <input
                type="number"
                min="0"
                className={inputCls}
                value={flete || ''}
                onChange={(e) => setFlete(Number(e.target.value) || 0)}
                placeholder="0"
              />
            </div>
          </div>
        </div>

        {/* Tabla de lotes por color */}
        <div className="flex-1 overflow-y-auto p-4">
          <div className="overflow-x-auto rounded border border-stone-200">
            <table className="w-full min-w-[520px] divide-y divide-stone-200">
              <thead className="bg-stone-50">
                <tr>
                  <th className={`${th} text-left`}>Color</th>
                  <th className={thRight}>Rollos</th>
                  <th className={thRight}>Cantidad total ({unidadLabel})</th>
                  <th className={thRight}>Subtotal ($)</th>
                  <th className="w-8"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {lotesCalculados.map((l) => (
                  <tr key={l.id}>
                    <td className="p-1.5">
                      <input
                        list="colores-compra"
                        className={inputCls}
                        value={l.colorNombre}
                        onChange={(e) =>
                          updateLote(l.id, { colorNombre: e.target.value })
                        }
                        placeholder="Color (ej. Negro)"
                      />
                    </td>
                    <td className="p-1.5 text-right">
                      <input
                        type="number"
                        min="1"
                        className={numberInputCls}
                          value={l.rollos || ''}
                          onFocus={(e) => e.currentTarget.select()}
                          onChange={(e) =>
                            updateLote(l.id, { rollos: Number(e.target.value) || 0 })
                          }
                          placeholder="1"
                      />
                    </td>
                    <td className="p-1.5 text-right">
                      <input
                        type="number"
                        step="0.1"
                        min="0"
                        className={numberInputCls}
                        value={l.cantidad || ''}
                        onFocus={(e) => e.currentTarget.select()}
                        onChange={(e) =>
                          updateLote(l.id, { cantidad: Number(e.target.value) || 0 })
                        }
                        placeholder="0"
                      />
                    </td>
                    <td className={`${tdRight} font-medium text-stone-900`}>
                      <Money value={l.subtotal} />
                    </td>
                    <td className="p-1.5 text-center">
                      <button
                        type="button"
                        onClick={() => removeLote(l.id)}
                        className="text-xs text-stone-400 hover:text-red-600"
                        title="Quitar fila"
                      >
                        ✕
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot className="border-t-2 border-stone-300 bg-amber-50 font-semibold text-stone-900">
                <tr>
                  <td className="px-3 py-2 text-xs">
                    <div>Total final</div>
                    {flete > 0 ? (
                      <div className="mt-0.5 text-[10px] font-normal text-stone-600">
                        Incluye flete <Money value={flete} />
                      </div>
                    ) : null}
                  </td>
                  <td className="px-3 py-2 text-right text-xs tabular-nums">
                    {totalRollos}
                  </td>
                  <td className="px-3 py-2 text-right text-xs tabular-nums">
                    {totalCantidad.toFixed(2)} {unidadLabel}
                  </td>
                  <td className="px-3 py-2 text-right text-sm font-bold text-amber-800 tabular-nums">
                    <Money value={totalCompra} />
                  </td>
                  <td></td>
                </tr>
              </tfoot>
            </table>
          </div>

          <datalist id="colores-compra">
            {mockColores.map((c) => (
              <option key={c.id} value={c.nombre} />
            ))}
          </datalist>

          <div className="mt-2">
            <button
              type="button"
              onClick={addLote}
              className="text-xs font-medium text-amber-700 hover:text-amber-800"
            >
              + Agregar otro color
            </button>
          </div>
        </div>

        {/* Pie */}
        <div className="flex justify-end gap-2 border-t border-stone-200 bg-white px-5 py-2.5">
          <Button variant="secondary" onClick={onClose}>
            Cancelar
          </Button>
          <Button onClick={handleSave} disabled={!puedeGuardar}>
            Guardar compra
          </Button>
        </div>
      </div>
    </div>
  )
}
