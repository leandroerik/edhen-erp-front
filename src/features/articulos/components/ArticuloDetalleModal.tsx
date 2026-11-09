import { useNavigate } from 'react-router-dom'
import { Button } from '../../../shared/components/Button'
import { Money } from '../../../shared/components/Money'
import { TallerTag } from '../../../shared/components/TallerTag'
import { TelaTag } from '../../../shared/components/TelaTag'
import { useErpStore } from '../../../data/erpStore'
import { formatARS } from '../../../utils/format'
import { formatRollos } from '../../../utils/stock'
import { colorSwatchClass } from '../../../utils/colores'
import { telasUnicas } from '../../../utils/telas'
import type { Articulo } from '../../../types'

interface Props {
  articulo: Articulo
  onClose: () => void
  onEdit: () => void
  onDelete: () => void
}

const th = 'px-3 py-2 text-xs font-semibold uppercase tracking-wide text-stone-500'
const thRight = `${th} text-right`
const td = 'px-3 py-2 text-sm text-stone-900'
const tdRight = `${td} text-right tabular-nums`

export function ArticuloDetalleModal({ articulo, onClose, onEdit, onDelete }: Props) {
  const navigate = useNavigate()
  const { encimadas } = useErpStore()
  const cantidad = Math.max(1, Number(articulo.cantidadPrendas) || 0)
  const telas = articulo.telas || []
  const telasResumen = telasUnicas(telas)
  const avios = articulo.avios || []
  const descripcion = (articulo.descripcion || '').trim()
  const encimada = articulo.encimadaId
    ? encimadas.find((item) => item.id === articulo.encimadaId)
    : undefined
  const encimadaCodigo = encimada?.codigo || articulo.encimadaId

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
  const margenTone =
    margenReal >= 100
      ? 'bg-emerald-100 text-emerald-800'
      : margenReal >= 50
        ? 'bg-stone-100 text-stone-700'
        : 'bg-amber-100 text-amber-800'

  const handleIrAEncimada = () => {
    if (!articulo.encimadaId) return
    onClose()
    navigate(`/carga-capas?encimada=${encodeURIComponent(articulo.encimadaId)}`)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-stretch justify-center bg-black/40 sm:items-center sm:p-4">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="articulo-detalle-titulo"
        className="flex h-[100dvh] w-full max-w-3xl flex-col bg-white shadow-2xl sm:h-auto sm:max-h-[92vh] sm:rounded-xl"
      >
        {/* Cabecera */}
        <div className="flex items-start justify-between gap-2 border-b border-stone-200 px-4 py-3 sm:items-center sm:px-6 sm:py-4">
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded border border-amber-200 bg-amber-50 px-2 py-0.5 font-mono text-xs font-semibold text-amber-800">
                {articulo.codigoArticulo}
              </span>
              <h2
                id="articulo-detalle-titulo"
                className="truncate text-base font-semibold text-stone-900 sm:text-lg"
              >
                {articulo.nombre || 'Artículo sin nombre'}
              </h2>
              <span
                className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold ${margenTone}`}
              >
                {margenReal.toFixed(1)}% margen
              </span>
            </div>
            <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
              {telasResumen.map((t) => (
                <TelaTag
                  key={t.key}
                  telaNombre={t.telaNombre}
                  compact
                />
              ))}
              {articulo.tallerNombre && (
                <TallerTag
                  tallerId={articulo.tallerId}
                  tallerNombre={articulo.tallerNombre}
                />
              )}
            </div>
            <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-stone-500">
              {articulo.encimadaId && (
                <button
                  type="button"
                  onClick={handleIrAEncimada}
                  className="font-semibold text-stone-600 underline-offset-2 transition-colors hover:text-stone-900 hover:underline"
                >
                  Encimada: {encimadaCodigo}
                </button>
              )}
              {articulo.encimadaId && descripcion && (
                <span className="text-stone-300">·</span>
              )}
              {descripcion && <span>{descripcion}</span>}
              {(articulo.encimadaId || descripcion) && (
                <span className="text-stone-300">·</span>
              )}
              <span className="text-[11px] text-stone-400">
                {cantidad} {cantidad === 1 ? 'prenda' : 'prendas'}
              </span>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar"
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded text-stone-400 hover:bg-stone-100 hover:text-stone-700"
          >
            ✕
          </button>
        </div>

        {/* Cuerpo */}
        <div className="flex-1 space-y-5 overflow-y-auto p-4 sm:space-y-6 sm:p-6">
          {/* 1. Resumen financiero total */}
          <div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wide text-stone-500">
                Resumen financiero
              </span>
              <span className="text-xs text-stone-500">{cantidad} prendas</span>
            </div>
            {/* Mobile: resumen compacto */}
            <div className="mt-2 divide-y divide-stone-100 rounded-xl border border-stone-200 bg-white px-3.5 shadow-sm sm:hidden">
              <div className="flex items-baseline justify-between gap-3 py-2.5">
                <span className="text-xs text-stone-600">Venta total</span>
                <div className="text-right">
                  <div className="text-base font-bold text-stone-900">
                    <Money value={ventaTotal} />
                  </div>
                  <div className="text-[10px] text-stone-500">
                    {formatARS(precioVenta)} por prenda
                  </div>
                </div>
              </div>
              <div className="flex items-baseline justify-between gap-3 py-2.5">
                <span className="text-xs text-stone-600">Costo de producción</span>
                <div className="text-right">
                  <div className="text-base font-bold text-stone-900">
                    <Money value={costoTotalProduccion} />
                  </div>
                  <div className="text-[10px] text-stone-500">
                    {formatARS(costoUnitario)} por prenda
                  </div>
                </div>
              </div>
              <div className="flex items-baseline justify-between gap-3 py-2.5">
                <span className="text-xs font-medium text-emerald-800">Ganancia neta</span>
                <div className="text-right">
                  <div className="text-base font-bold text-emerald-900">
                    <Money value={gananciaTotal} />
                  </div>
                  <div className="text-[10px] font-medium text-emerald-700">
                    +{formatARS(gananciaUnitaria)} por prenda · {margenReal.toFixed(1)}% margen
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-2 hidden grid-cols-1 gap-3 sm:grid sm:grid-cols-3">
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
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs font-semibold uppercase tracking-wide text-stone-500">
                Composición del costo
              </span>
              <span className="text-xs text-stone-500">
                Total{' '}
                <strong className="text-stone-900">
                  <Money value={costoTotalProduccion} />
                </strong>
              </span>
            </div>
            {/* Mobile: composición compacta */}
            <div className="mt-2 divide-y divide-stone-100 rounded-xl border border-stone-200 bg-white px-3.5 shadow-sm sm:hidden">
              <div className="flex items-baseline justify-between gap-3 py-2.5">
                <span className="text-xs text-stone-600">Telas consumidas</span>
                <div className="text-right">
                  <div className="text-sm font-bold text-stone-900">
                    <Money value={costoTelaTotal} />
                  </div>
                  <div className="text-[10px] text-stone-500">
                    {formatARS(costoTelaPorPrenda)} por prenda
                  </div>
                </div>
              </div>
              <div className="flex items-baseline justify-between gap-3 py-2.5">
                <div className="min-w-0">
                  <div className="text-xs text-stone-600">Taller y mano de obra</div>
                  {articulo.tallerNombre && (
                    <TallerTag
                      tallerId={articulo.tallerId}
                      tallerNombre={articulo.tallerNombre}
                      className="mt-0.5"
                    />
                  )}
                </div>
                <div className="shrink-0 text-right">
                  <div className="text-sm font-bold text-stone-900">
                    <Money value={pagoTotalTalleres} />
                  </div>
                  <div className="text-[10px] text-stone-500">
                    {formatARS(manoObraPrenda)} por prenda
                  </div>
                </div>
              </div>
              <div className="flex items-baseline justify-between gap-3 py-2.5">
                <span className="text-xs text-stone-600">Avíos e insumos</span>
                <div className="text-right">
                  <div className="text-sm font-bold text-stone-900">
                    <Money value={aviosTotales} />
                  </div>
                  <div className="text-[10px] text-stone-500">
                    {formatARS(aviosPorPrenda)} por prenda
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-2 hidden grid-cols-1 gap-3 sm:grid sm:grid-cols-3">
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
                    <span className="mt-0.5 block">
                      <TallerTag
                        tallerId={articulo.tallerId}
                        tallerNombre={articulo.tallerNombre}
                      />
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
            {/* Mobile: lista compacta de telas */}
            <div className="space-y-2 sm:hidden">
              {telas.length === 0 ? (
                <div className="rounded-lg border border-stone-200 bg-white p-3 text-center text-xs text-stone-400">
                  Sin telas asignadas.
                </div>
              ) : (
                telas.map((t, idx) => (
                  <div
                    key={idx}
                    className="rounded-lg border border-stone-200 bg-white p-2.5 text-xs"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <div className="truncate font-medium text-stone-900">{t.telaNombre}</div>
                        <div className="mt-0.5 flex items-center gap-1.5 text-[11px] text-stone-500">
                          <span
                            className={`h-2 w-2 shrink-0 rounded-full border border-stone-300 ${colorSwatchClass(
                              t.colorNombre,
                            )}`}
                          />
                          {t.colorNombre}
                          {t.compraCodigo && (
                            <span className="rounded bg-stone-100 px-1 text-[10px] text-stone-500">
                              {t.compraCodigo}
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="shrink-0 text-right">
                        <div className="font-semibold text-stone-900">
                          <Money value={t.costoUsado} />
                        </div>
                        <div className="text-[10px] text-stone-500">
                          {Number(t.cantidadUsar || 0).toFixed(1)}{' '}
                          {t.unidad === 'METRO' ? 'm' : 'kg'} · {formatRollos(t.rollosUsados)} rollos
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="hidden overflow-x-auto rounded-xl border border-stone-200 sm:block">
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
                          <div className="flex flex-wrap items-center gap-1.5">
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
                              className={`h-2.5 w-2.5 shrink-0 rounded-full border border-stone-300 ${colorSwatchClass(
                                t.colorNombre,
                              )}`}
                            />
                            <span className="text-stone-600">{t.colorNombre}</span>
                          </div>
                        </td>
                        <td className={tdRight}>{formatRollos(t.rollosUsados)}</td>
                        <td className={tdRight}>
                          {Number(t.cantidadUsar || 0).toFixed(1)}{' '}
                          {t.unidad === 'METRO' ? 'm' : 'kg'}
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
              {/* Mobile: lista compacta de avíos */}
              <div className="space-y-2 sm:hidden">
                {avios.map((av, idx) => {
                  const porPrenda = av.porPrenda !== false
                  const monto = Number(av.monto) || 0
                  const totalAvio = porPrenda ? monto * cantidad : monto
                  return (
                    <div
                      key={idx}
                      className="rounded-lg border border-stone-200 bg-white p-2.5 text-xs"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <div className="truncate font-medium text-stone-900">{av.nombre}</div>
                          <span
                            className={`mt-0.5 inline-flex rounded-full border px-2 py-0.5 text-[10px] font-medium ${
                              porPrenda
                                ? 'border-stone-200 bg-stone-50 text-stone-600'
                                : 'border-amber-200 bg-amber-50 text-amber-800'
                            }`}
                          >
                            {porPrenda ? 'Por prenda' : 'Fijo lote'}
                          </span>
                        </div>
                        <div className="shrink-0 text-right">
                          <div className="font-semibold text-stone-900">
                            <Money value={totalAvio} />
                          </div>
                          <div className="text-[10px] text-stone-500">
                            <Money value={monto} /> {porPrenda ? '/ un.' : 'total'}
                          </div>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>

              <div className="hidden overflow-x-auto rounded-xl border border-stone-200 sm:block">
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
        <div className="flex flex-col gap-2 border-t border-stone-200 bg-white px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <div className="order-2 text-center text-[11px] text-stone-500 sm:order-1 sm:text-left sm:text-xs">
            {cantidad} prendas · Margen real: <strong className="text-emerald-700">{margenReal.toFixed(1)}%</strong>
          </div>
          <div className="order-1 flex gap-2 sm:order-2">
            <Button variant="danger" className="flex-1 sm:flex-none" onClick={onDelete}>
              Eliminar
            </Button>
            <Button variant="secondary" className="flex-1 sm:flex-none" onClick={onClose}>
              Cerrar
            </Button>
            <Button className="flex-1 sm:flex-none" onClick={onEdit}>
              Editar
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
