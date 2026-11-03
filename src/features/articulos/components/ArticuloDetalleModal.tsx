import { Button } from '../../../shared/components/Button'
import { Money } from '../../../shared/components/Money'
import { useErpStore } from '../../../data/erpStore'
import { formatARS } from '../../../utils/format'
import type { Articulo } from '../../../types'

interface Props {
  articulo: Articulo
  onClose: () => void
  onEdit: () => void
  onDelete: () => void
}

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

const th = 'px-3 py-2 text-xs font-semibold uppercase tracking-wide text-stone-500'
const thRight = `${th} text-right`
const td = 'px-3 py-2 text-sm text-stone-900'
const tdRight = `${td} text-right tabular-nums`

export function ArticuloDetalleModal({ articulo, onClose, onEdit, onDelete }: Props) {
  const { encimadas } = useErpStore()
  const cantidad = Math.max(1, Number(articulo.cantidadPrendas) || 0)
  const telas = articulo.telas || []
  const avios = articulo.avios || []
  const encimada = articulo.encimadaId
    ? encimadas.find((item) => item.id === articulo.encimadaId)
    : undefined
  const encimadaItem = encimada?.items.find((item) => item.id === articulo.encimadaItemId)

  // Telas
  const costoTelaTotal =
    Number(articulo.costoTelaTotalUsado) ||
    telas.reduce((a, t) => a + (Number(t.costoUsado) || 0), 0)
  const costoTelaPorPrenda = cantidad > 0 ? costoTelaTotal / cantidad : 0

  // Mano de obra (talleres)
  const manoObraPrenda = Number(articulo.manoObra) || 0
  const pagoTotalTalleres = manoObraPrenda * cantidad

  // Avíos
  const aviosPorPrendaDirectos = avios.reduce(
    (a, av) => a + (av.porPrenda !== false ? Number(av.monto) || 0 : 0),
    0,
  )
  const aviosFijosTotales = avios.reduce(
    (a, av) => a + (av.porPrenda === false ? Number(av.monto) || 0 : 0),
    0,
  )
  const aviosTotales =
    Number(articulo.aviosTotales) ||
    aviosFijosTotales + aviosPorPrendaDirectos * cantidad
  const aviosPorPrenda =
    Number(articulo.aviosPorPrenda) || (cantidad > 0 ? aviosTotales / cantidad : 0)

  // Costos totales
  const costoTotalProduccion =
    Number(articulo.costoTotalProduccion) ||
    costoTelaTotal + pagoTotalTalleres + aviosTotales
  const costoUnitario =
    Number(articulo.costoUnitario) ||
    (cantidad > 0 ? costoTotalProduccion / cantidad : 0)

  // Venta y ganancia
  const precioVenta = Number(articulo.precioVenta) || 0
  const ventaTotal = precioVenta * cantidad
  const gananciaTotal =
    Number(articulo.gananciaTotal) || ventaTotal - costoTotalProduccion
  const gananciaUnitaria =
    Number(articulo.gananciaUnitaria) || precioVenta - costoUnitario
  const margenReal =
    Number(articulo.margenReal) ||
    (costoUnitario > 0 ? (gananciaUnitaria / costoUnitario) * 100 : 0)

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-3 sm:p-4">
      <div className="flex max-h-[92vh] w-full max-w-3xl flex-col rounded-xl bg-white shadow-2xl">
        {/* Cabecera */}
        <div className="flex items-center justify-between border-b border-stone-200 px-6 py-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono text-xs font-semibold text-amber-800 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                {articulo.codigoArticulo}
              </span>
              <h2 className="text-lg font-semibold text-stone-900">
                {articulo.nombre || 'Artículo sin nombre'}
              </h2>
            </div>
            {articulo.descripcion && (
              <p className="mt-0.5 text-xs text-stone-500">{articulo.descripcion}</p>
            )}
            {encimada && (
              <p className="mt-1 text-xs text-stone-500">
                Encimada: <strong className="text-stone-700">{encimada.codigo}</strong>
                {encimadaItem && <span> · {encimadaItem.modeloNombre}</span>}
              </p>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded text-stone-400 hover:bg-stone-100 hover:text-stone-700"
          >
            ✕
          </button>
        </div>

        {/* Cuerpo */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* 1. Resumen financiero total */}
          <div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wide text-stone-500">
                Resumen financiero
              </span>
              <span className="text-xs text-stone-500">{cantidad} prendas</span>
            </div>
            <div className="mt-2 grid grid-cols-1 gap-3 sm:grid-cols-3">
              {/* Venta total */}
              <div className="rounded-xl border border-amber-200 bg-amber-50/40 p-4 shadow-sm">
                <div className="text-xs font-medium text-amber-800">Venta total</div>
                <div className="mt-1 text-2xl font-bold text-stone-900">
                  <Money value={ventaTotal} />
                </div>
                <div className="mt-1 text-xs text-stone-500">
                  {formatARS(precioVenta)} por prenda
                </div>
              </div>

              {/* Costo total producción */}
              <div className="rounded-xl border border-stone-200 bg-white p-4 shadow-sm">
                <div className="text-xs font-medium text-stone-500">Costo de producción</div>
                <div className="mt-1 text-2xl font-bold text-stone-900">
                  <Money value={costoTotalProduccion} />
                </div>
                <div className="mt-1 text-xs text-stone-500">
                  {formatARS(costoUnitario)} por prenda
                </div>
              </div>

              {/* Ganancia total */}
              <div className="rounded-xl border border-emerald-200 bg-emerald-50/50 p-4 shadow-sm">
                <div className="text-xs font-medium text-emerald-800">Ganancia neta</div>
                <div className="mt-1 text-2xl font-bold text-emerald-900">
                  <Money value={gananciaTotal} />
                </div>
                <div className="mt-1 text-xs font-medium text-emerald-700">
                  +{formatARS(gananciaUnitaria)} por prenda · {margenReal.toFixed(1)}% margen
                </div>
              </div>
            </div>
          </div>

          {/* 2. Desglose de Costos */}
          <div>
            <span className="text-xs font-semibold uppercase tracking-wide text-stone-500">
              Composición del costo
            </span>
            <div className="mt-2 grid grid-cols-1 gap-3 sm:grid-cols-3">
              {/* Costo total telas */}
              <div className="rounded-xl border border-stone-200 bg-white p-4 shadow-sm">
                <div className="text-xs font-medium text-stone-500">
                  Telas consumidas
                </div>
                <div className="mt-1 text-lg font-bold text-stone-900">
                  <Money value={costoTelaTotal} />
                </div>
                <div className="mt-1 text-xs text-stone-500">
                  {formatARS(costoTelaPorPrenda)} por prenda
                </div>
              </div>

              {/* Pago total talleres / mano de obra */}
              <div className="rounded-xl border border-stone-200 bg-white p-4 shadow-sm">
                <div className="text-xs font-medium text-stone-500">
                  Taller y mano de obra
                </div>
                <div className="mt-1 text-lg font-bold text-stone-900">
                  <Money value={pagoTotalTalleres} />
                </div>
                <div className="mt-1 text-xs text-stone-500">
                  {formatARS(manoObraPrenda)} por prenda
                  {articulo.tallerNombre && (
                    <span className="block mt-0.5 font-medium text-amber-800">
                      {articulo.tallerNombre}
                    </span>
                  )}
                </div>
              </div>

              {/* Costo total avíos */}
              <div className="rounded-xl border border-stone-200 bg-white p-4 shadow-sm">
                <div className="text-xs font-medium text-stone-500">
                  Avíos e insumos
                </div>
                <div className="mt-1 text-lg font-bold text-stone-900">
                  <Money value={aviosTotales} />
                </div>
                <div className="mt-1 text-xs text-stone-500">
                  {formatARS(aviosPorPrenda)} por prenda
                </div>
              </div>
            </div>
          </div>

          {/* 3. Detalle de Telas usadas con chips de colores */}
          <div>
            <div className="mb-2 flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wide text-stone-500">
                Telas consumidas
              </span>
              <span className="text-xs text-stone-500">
                {telas.length} {telas.length === 1 ? 'ítem' : 'ítems'} ·{' '}
                <strong className="text-stone-900"><Money value={costoTelaTotal} /></strong>
              </span>
            </div>
            <div className="overflow-x-auto rounded-xl border border-stone-200">
              <table className="w-full min-w-[560px] divide-y divide-stone-200">
                <thead className="bg-stone-50">
                  <tr>
                    <th className={`${th} text-left`}>Tela</th>
                    <th className={`${th} text-left`}>Color</th>
                    <th className={thRight}>Rollos</th>
                    <th className={thRight}>Cantidad</th>
                    <th className={thRight}>Precio/u.</th>
                    <th className={thRight}>Costo</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100">
                  {telas.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-3 py-4 text-center text-xs text-stone-400">
                        Sin telas asignadas.
                      </td>
                    </tr>
                  ) : (
                    telas.map((t, idx) => (
                      <tr key={idx} className="hover:bg-stone-50">
                        <td className={td}>
                          <div className="flex items-center gap-1.5">
                            <span className="font-medium text-stone-900">{t.telaNombre}</span>
                            {t.compraCodigo && (
                              <span className="rounded bg-stone-100 px-1 py-0.2 text-[10px] text-stone-500">
                                {t.compraCodigo}
                              </span>
                            )}
                          </div>
                        </td>
                        <td className={td}>
                          <div className="flex items-center gap-1.5">
                            <span
                              className={`h-2.5 w-2.5 shrink-0 rounded-full border border-stone-300 ${
                                COLOR_SWATCH[t.colorNombre] ?? 'bg-stone-200'
                              }`}
                            />
                            <span className="text-stone-600">{t.colorNombre}</span>
                          </div>
                        </td>
                        <td className={tdRight}>{t.rollosUsados}</td>
                        <td className={tdRight}>
                          {Number(t.cantidadUsar || 0).toFixed(1)} {t.unidad === 'METRO' ? 'm' : 'kg'}
                        </td>
                        <td className={tdRight}>
                          <Money value={t.precioUnitario} />
                        </td>
                        <td className={`${tdRight} font-medium text-stone-900`}>
                          <Money value={t.costoUsado} />
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* 4. Detalle de Avíos e Insumos */}
          {avios.length > 0 && (
            <div>
              <div className="mb-2 flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-wide text-stone-500">
                  Avíos e insumos
                </span>
                <span className="text-xs text-stone-500">
                  {avios.length} {avios.length === 1 ? 'ítem' : 'ítems'} ·{' '}
                  <strong className="text-stone-900"><Money value={aviosTotales} /></strong>
                </span>
              </div>
              <div className="overflow-x-auto rounded-xl border border-stone-200">
                <table className="w-full min-w-[460px] divide-y divide-stone-200">
                  <thead className="bg-stone-50">
                    <tr>
                      <th className={`${th} text-left`}>Insumo</th>
                      <th className={`${th} text-left`}>Tipo</th>
                      <th className={thRight}>Monto</th>
                      <th className={thRight}>Costo</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-100">
                    {avios.map((av, idx) => {
                      const porPrenda = av.porPrenda !== false
                      const monto = Number(av.monto) || 0
                      const totalAvio = porPrenda ? monto * cantidad : monto
                      return (
                        <tr key={idx} className="hover:bg-stone-50">
                          <td className={`${td} font-medium text-stone-900`}>{av.nombre}</td>
                          <td className={td}>
                            <span
                              className={`inline-flex rounded-full border px-2 py-0.5 text-[10px] font-medium ${
                                porPrenda
                                  ? 'border-stone-200 bg-stone-50 text-stone-600'
                                  : 'border-amber-200 bg-amber-50 text-amber-800'
                              }`}
                            >
                              {porPrenda ? 'Por prenda' : 'Fijo lote'}
                            </span>
                          </td>
                          <td className={tdRight}>
                            <Money value={monto} /> {porPrenda ? '/ un.' : ''}
                          </td>
                          <td className={`${tdRight} font-medium text-stone-900`}>
                            <Money value={totalAvio} />
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* Pie */}
        <div className="flex items-center justify-between border-t border-stone-200 bg-white px-6 py-3">
          <div className="text-xs text-stone-500">
            {cantidad} prendas · Margen real: <strong className="text-emerald-700">{margenReal.toFixed(1)}%</strong>
          </div>
          <div className="flex gap-2">
            <Button variant="danger" onClick={onDelete}>
              Eliminar
            </Button>
            <Button variant="secondary" onClick={onClose}>
              Cerrar
            </Button>
            <Button onClick={onEdit}>
              Editar artículo
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
