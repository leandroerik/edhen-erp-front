import { Button } from '../../../shared/components/Button'
import { Money } from '../../../shared/components/Money'
import { formatDate } from '../../../utils/format'
import { formatCantidad, getStockInfo } from '../../../utils/stock'
import { mockStock } from '../../../data/mock'
import type { Compra } from '../../../types'

interface Props {
  compra: Compra
  onClose: () => void
}

const th = 'px-3 py-1.5 text-xs font-semibold uppercase tracking-wide text-stone-500'
const thRight = `${th} text-right`
const td = 'px-3 py-1.5 text-sm text-stone-900'
const tdRight = `${td} text-right tabular-nums`

const COLOR_SWATCH: Record<string, string> = {
  Negro: 'bg-stone-900',
  Blanco: 'bg-white',
  Crudo: 'bg-amber-50',
  Azul: 'bg-blue-600',
  Beige: 'bg-amber-100',
  Rojo: 'bg-red-600',
  Verde: 'bg-emerald-600',
  Gris: 'bg-stone-400',
  Camel: 'bg-amber-700',
  Marino: 'bg-blue-900',
  Rosa: 'bg-pink-300',
  Celeste: 'bg-sky-300',
  Terracota: 'bg-orange-700',
}

function CompactStock({
  comprado,
  usado,
  unidad,
}: {
  comprado: number
  usado: number
  unidad: Compra['unidadCompra']
}) {
  const info = getStockInfo(comprado, usado)
  return (
    <div
      className="flex items-center gap-1.5"
      title={`Consumido ${Math.round(info.consumidoPct * 100)}%`}
    >
      <span className={`h-2 w-2 shrink-0 rounded-full ${info.barClass}`} />
      <span className="text-xs tabular-nums text-stone-900">
        {formatCantidad(info.disponible, unidad)}
      </span>
      <span
        className={`rounded-full border px-1.5 py-0.5 text-[10px] font-semibold ${info.badgeClass}`}
      >
        {info.label}
      </span>
    </div>
  )
}

export function CompraDetalleModal({ compra, onClose }: Props) {
  const lotes = compra.lotes || []
  const totalRollos = lotes.reduce((a, l) => a + (Number(l.rollos) || 0), 0)
  const totalCantidad = lotes.reduce((a, l) => a + (Number(l.cantidad) || 0), 0)
  const unidad = compra.unidadCompra === 'METRO' ? 'm' : 'kg'

  const flete = Number(compra.flete) || 0
  const descuento = Number(compra.descuento) || 0
  const iva = Number(compra.iva) || 0
  const tieneExtras = flete > 0 || descuento > 0 || iva > 0

  const detallePorLote = new Map(
    mockStock
      .flatMap((stock) => stock.lotesDetalle)
      .filter((detalle) => detalle.compraCodigo === compra.codigo)
      .map((detalle) => [detalle.loteId, detalle] as const),
  )

  const totalUsado = lotes.reduce(
    (a, l) => a + (detallePorLote.get(l.id)?.usadoCantidad ?? 0),
    0,
  )
  const totalDisponible = Math.max(0, totalCantidad - totalUsado)
  const totalRollosDisponibles = lotes.reduce(
    (a, l) =>
      a +
      Math.max(
        0,
        (Number(l.rollos) || 0) -
          (detallePorLote.get(l.id)?.usadoRollos ?? 0),
      ),
    0,
  )

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="flex max-h-[92vh] w-full max-w-3xl flex-col rounded-lg bg-white shadow-xl">
        {/* Cabecera */}
        <div className="flex items-center justify-between border-b border-stone-200 px-5 py-3">
          <div>
            <div className="flex items-center gap-2">
              <span className="rounded bg-amber-50 px-2 py-0.5 font-mono text-xs font-semibold text-amber-800">
                {compra.codigo}
              </span>
              <h2 className="text-lg font-semibold text-stone-900">
                {compra.telaNombre}
              </h2>
            </div>
            <p className="mt-0.5 text-xs text-stone-500">
              {compra.proveedorNombre} · {formatDate(compra.fecha)}
              {compra.notaRemito ? ` · Remito: ${compra.notaRemito}` : ''}
            </p>
          </div>
          <button
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded text-stone-400 hover:bg-stone-100 hover:text-stone-700"
          >
            ✕
          </button>
        </div>

        {/* Resumen de la compra */}
        <div className="border-b border-stone-200 bg-stone-50 px-5 py-2">
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs">
            <span>
              <span className="text-stone-500">Precio / {unidad}:</span>{' '}
              <strong className="text-stone-900">
                <Money value={compra.precioUnitario} />
              </strong>
            </span>
            <span>
              <span className="text-stone-500">Rollos:</span>{' '}
              <strong className="text-stone-900">{totalRollos}</strong>{' '}
              <span className="text-stone-500">
                ({totalRollosDisponibles} disp.)
              </span>
            </span>
            <span>
              <span className="text-stone-500">Cantidad:</span>{' '}
              <strong className="text-stone-900">
                {totalCantidad.toFixed(2)} {unidad}
              </strong>{' '}
              <span className="text-stone-500">
                ({formatCantidad(totalDisponible, compra.unidadCompra)} disp.)
              </span>
            </span>
          </div>
        </div>

        {/* Tabla de lotes por color */}
        <div className="flex-1 overflow-y-auto p-4">
          <div className="overflow-x-auto rounded-lg border border-stone-200">
            <table className="w-full min-w-[560px] divide-y divide-stone-200">
              <thead className="bg-stone-50">
                <tr>
                  <th className={`${th} text-left`}>Color</th>
                  <th className={thRight}>Rollos</th>
                  <th className={thRight}>Cantidad ({unidad})</th>
                  <th className={`${th} text-left`}>Disponible</th>
                  <th className={thRight}>Subtotal</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {lotes.map((l) => {
                  const detalle = detallePorLote.get(l.id)
                  const usadoCantidad = detalle?.usadoCantidad ?? 0
                  const rollosDisponibles = Math.max(
                    0,
                    (Number(l.rollos) || 0) - (detalle?.usadoRollos ?? 0),
                  )

                  return (
                    <tr key={l.id} className="hover:bg-stone-50">
                      <td className={`${td} font-medium`}>
                        <div className="flex items-center gap-2">
                          <span
                            className={`h-3 w-3 shrink-0 rounded-full border border-stone-300 ${
                              COLOR_SWATCH[l.colorNombre] ?? 'bg-stone-200'
                            }`}
                          />
                          {l.colorNombre}
                        </div>
                      </td>
                      <td className={tdRight}>
                        <div>{l.rollos}</div>
                        <div className="text-[10px] font-normal text-stone-500">
                          Disp. {rollosDisponibles}
                        </div>
                      </td>
                      <td className={tdRight}>
                        {Number(l.cantidad || 0).toFixed(2)} {unidad}
                      </td>
                      <td className={td}>
                        <CompactStock
                          comprado={Number(l.cantidad) || 0}
                          usado={usadoCantidad}
                          unidad={compra.unidadCompra}
                        />
                      </td>
                      <td className={`${tdRight} font-medium text-stone-900`}>
                        <Money value={l.subtotal} />
                      </td>
                    </tr>
                  )
                })}
              </tbody>
              <tfoot className="border-t-2 border-stone-300 bg-amber-50 font-semibold text-stone-900">
                <tr>
                  <td className="px-3 py-1.5 text-xs">
                    <div>Total final</div>
                    {tieneExtras ? (
                      <div className="mt-0.5 text-[10px] font-normal text-stone-600">
                        {flete > 0 ? (
                          <>
                            Incluye flete <Money value={flete} />
                          </>
                        ) : null}
                        {descuento > 0 ? (
                          <>
                            {flete > 0 ? ' · ' : null}
                            Desc. -<Money value={descuento} />
                          </>
                        ) : null}
                        {iva > 0 ? (
                          <>
                            {flete > 0 || descuento > 0 ? ' · ' : null}
                            IVA <Money value={iva} />
                          </>
                        ) : null}
                      </div>
                    ) : null}
                  </td>
                  <td className="px-3 py-1.5 text-right text-xs tabular-nums">
                    {totalRollos}
                    <span className="block text-[10px] font-normal text-stone-500">
                      {totalRollosDisponibles} disp.
                    </span>
                  </td>
                  <td className="px-3 py-1.5 text-right text-xs tabular-nums">
                    {totalCantidad.toFixed(2)} {unidad}
                  </td>
                  <td className="px-3 py-1.5">
                    <CompactStock
                      comprado={totalCantidad}
                      usado={totalUsado}
                      unidad={compra.unidadCompra}
                    />
                  </td>
                  <td className="px-3 py-1.5 text-right text-sm font-bold text-amber-800 tabular-nums">
                    <Money value={compra.total} />
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>

        {/* Pie */}
        <div className="flex justify-end border-t border-stone-200 bg-white px-5 py-2.5">
          <Button variant="secondary" onClick={onClose}>
            Cerrar
          </Button>
        </div>
      </div>
    </div>
  )
}
