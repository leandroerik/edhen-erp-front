import { Button } from '../../../shared/components/Button'
import { Money } from '../../../shared/components/Money'
import { mockModelos } from '../../../data/mock'
import { colorDeTaller, linkWhatsApp, rgba } from '../../../utils/talleres'
import type { Articulo, Taller } from '../../../types'

interface Stats {
  cortes: number
  activos: number
  prendas: number
  saldo: number
}

interface Props {
  taller: Taller
  stats: Stats
  articulos: Articulo[]
  onClose: () => void
  onEdit: () => void
  onDelete: () => void
}

function iniciales(nombre: string) {
  const partes = String(nombre ?? '')
    .trim()
    .split(/\s+/)
    .filter(Boolean)
  const primera = partes[0]?.charAt(0) ?? ''
  const segunda = partes[1]?.charAt(0) ?? ''
  return `${primera}${segunda}`.toUpperCase() || '?'
}

function nombreModelo(id: string) {
  return mockModelos.find((m) => m.id === id)?.nombre ?? id
}

export function TallerDetalleModal({
  taller,
  stats,
  articulos,
  onClose,
  onEdit,
  onDelete,
}: Props) {
  const precios = Object.entries(taller.precioPorPrendaPorModelo || {})
  const telefonoDigitos = String(taller.telefono ?? '').replace(/\D/g, '')

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 sm:items-center sm:p-4">
      <div className="flex max-h-[95vh] w-full flex-col rounded-t-2xl bg-white shadow-xl sm:max-h-[92vh] sm:max-w-lg sm:rounded-xl">
        {/* Cabecera */}
        <div className="flex items-start justify-between gap-2 border-b border-stone-200 px-4 py-3 sm:px-6 sm:py-4">
          <div className="flex min-w-0 items-center gap-3">
            <div
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border text-sm font-semibold"
              style={{
                backgroundColor: rgba(colorDeTaller(taller.color), 0.12),
                borderColor: rgba(colorDeTaller(taller.color), 0.35),
                color: colorDeTaller(taller.color),
              }}
            >
              {iniciales(taller.nombre)}
            </div>
            <div className="min-w-0">
              <div className="flex min-w-0 items-center gap-1.5">
                <h2 className="min-w-0 truncate text-base font-semibold text-stone-900 sm:text-lg">
                  {taller.nombre}
                </h2>
                {taller.activo === false && (
                  <span className="shrink-0 rounded-full border border-stone-300 bg-stone-100 px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wide text-stone-500">
                    Inactivo
                  </span>
                )}
              </div>
              <p className="mt-0.5 text-xs text-stone-500">
                {taller.especialidad || 'Sin especialidad'}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded text-stone-400 hover:bg-stone-100 hover:text-stone-700"
          >
            ✕
          </button>
        </div>

        {/* Cuerpo */}
        <div className="flex-1 space-y-4 overflow-y-auto p-4 sm:p-6">
          {/* Contacto rápido */}
          <div className="flex items-center justify-between gap-3 rounded-lg border border-stone-200 bg-stone-50 px-3.5 py-2.5">
            <div className="min-w-0">
              <div className="text-sm font-medium text-stone-800">
                {taller.telefono || 'Sin teléfono'}
              </div>
              {taller.direccion && (
                <div className="truncate text-[11px] text-stone-500">{taller.direccion}</div>
              )}
            </div>
            {telefonoDigitos && (
              <div className="flex shrink-0 gap-1.5">
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => (window.location.href = `tel:${taller.telefono}`)}
                >
                  Llamar
                </Button>
                <Button
                  size="sm"
                  onClick={() =>
                    window.open(
                      linkWhatsApp(
                        taller.telefono,
                        `Hola ${taller.nombre}, te escribo de edhen.`,
                      ),
                      '_blank',
                      'noopener,noreferrer',
                    )
                  }
                >
                  WhatsApp
                </Button>
              </div>
            )}
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-2">
            <div className="rounded-lg border border-stone-200 bg-white p-2.5 text-center shadow-sm">
              <div className="text-[10px] font-medium uppercase tracking-wide text-stone-500">
                Activos
              </div>
              <div className="mt-0.5 text-base font-bold text-stone-900">{stats.activos}</div>
              <div className="text-[10px] text-stone-400">de {stats.cortes}</div>
            </div>
            <div className="rounded-lg border border-stone-200 bg-white p-2.5 text-center shadow-sm">
              <div className="text-[10px] font-medium uppercase tracking-wide text-stone-500">
                Prendas
              </div>
              <div className="mt-0.5 text-base font-bold text-stone-900">{stats.prendas}</div>
            </div>
            <div className="rounded-lg border border-emerald-200 bg-emerald-50/50 p-2.5 text-center shadow-sm">
              <div className="text-[10px] font-medium uppercase tracking-wide text-emerald-700">
                Saldo
              </div>
              <div className="mt-0.5 whitespace-nowrap text-base font-bold text-emerald-900">
                <Money value={stats.saldo} />
              </div>
            </div>
          </div>

          {/* Artículos asignados */}
          <div className="rounded-lg border border-stone-200 bg-white p-3.5 shadow-sm">
            <div className="flex items-center justify-between gap-2">
              <div className="text-xs font-semibold uppercase tracking-wide text-stone-500">
                Artículos asignados
              </div>
              <span className="rounded-full bg-stone-100 px-2 py-0.5 text-[10px] font-semibold text-stone-600">
                {articulos.length}
              </span>
            </div>
            {articulos.length === 0 ? (
              <p className="mt-2 text-sm text-stone-500">
                No hay artículos asignados a este taller.
              </p>
            ) : (
              <div className="mt-2 divide-y divide-stone-100">
                {articulos.map((articulo) => (
                  <div
                    key={articulo.id}
                    className="flex items-center justify-between gap-3 py-1.5"
                  >
                    <div className="min-w-0">
                      <div className="truncate text-sm font-medium text-stone-800">
                        {articulo.nombre || articulo.descripcion || 'Artículo'}
                      </div>
                      <div className="font-mono text-[10px] text-stone-400">
                        {articulo.codigoArticulo}
                      </div>
                    </div>
                    <span className="shrink-0 text-xs text-stone-500">
                      {articulo.cantidadPrendas}{' '}
                      {articulo.cantidadPrendas === 1 ? 'prenda' : 'prendas'}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {(precios.length > 0 || taller.nota) && (
            <details className="group rounded-lg border border-stone-200 bg-white shadow-sm">
              <summary className="flex cursor-pointer list-none items-center justify-between px-3.5 py-2.5 text-xs font-semibold uppercase tracking-wide text-stone-500">
                Precios y nota
                <span className="text-stone-400 transition-transform group-open:rotate-180">
                  ⌄
                </span>
              </summary>
              <div className="space-y-3 border-t border-stone-100 p-3.5">
                <div>
                  <div className="text-[11px] font-medium text-stone-500">Precios por modelo</div>
                  {precios.length === 0 ? (
                    <p className="mt-1 text-sm text-stone-500">A convenir.</p>
                  ) : (
                    <div className="mt-1 divide-y divide-stone-100">
                      {precios.map(([modeloId, precio]) => (
                        <div key={modeloId} className="flex items-center justify-between py-1.5">
                          <span className="text-sm text-stone-700">{nombreModelo(modeloId)}</span>
                          <span className="text-sm font-medium text-stone-900">
                            <Money value={precio} />
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                {taller.nota && (
                  <div>
                    <div className="text-[11px] font-medium text-stone-500">Nota</div>
                    <p className="mt-1 whitespace-pre-wrap text-sm text-stone-600">
                      {taller.nota}
                    </p>
                  </div>
                )}
              </div>
            </details>
          )}
        </div>

        {/* Pie */}
        <div className="flex gap-2 border-t border-stone-200 bg-white px-4 py-3 sm:justify-end sm:px-6">
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
  )
}
