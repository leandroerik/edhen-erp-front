import { useMemo, useState } from 'react'
import { Button } from '../../../shared/components/Button'
import { Money } from '../../../shared/components/Money'
import { useErpStore } from '../../../data/erpStore'
import { siguienteId } from '../../../utils/codigos'
import { resumenPagosPorTaller } from '../../pagos/pagos.utils'
import type { Taller } from '../../../types'
import { TallerModal } from '../components/TallerModal'

function iniciales(nombre: string) {
  const partes = nombre.trim().split(/\s+/).filter(Boolean)
  const primera = partes[0]?.charAt(0) ?? ''
  const segunda = partes[1]?.charAt(0) ?? ''
  return `${primera}${segunda}`.toUpperCase() || '?'
}

export function TalleresPage() {
  const { talleres, cortes, pagos, saveTaller, deleteTaller } = useErpStore()
  const [busqueda, setBusqueda] = useState('')
  const [modalAbierto, setModalAbierto] = useState(false)
  const [editando, setEditando] = useState<Taller | null>(null)

  const statsPorTaller = useMemo(() => {
    const mapa = new Map<
      string,
      { cortes: number; activos: number; prendas: number; saldo: number }
    >()
    for (const taller of talleres) {
      mapa.set(taller.id, { cortes: 0, activos: 0, prendas: 0, saldo: 0 })
    }

    for (const corte of cortes) {
      const actual = mapa.get(corte.tallerId)
      if (!actual) continue
      actual.cortes += 1
      actual.prendas += Number(corte.cantidadPrendas) || 0
      if (corte.estado === 'PREPARADO' || corte.estado === 'EN_TALLER') {
        actual.activos += 1
      }
    }

    for (const resumen of resumenPagosPorTaller(cortes, pagos)) {
      const actual = mapa.get(resumen.tallerId)
      if (actual) actual.saldo += Math.max(0, resumen.saldo)
    }

    return mapa
  }, [talleres, cortes, pagos])

  const totales = useMemo(() => {
    let activos = 0
    let saldo = 0
    for (const stats of statsPorTaller.values()) {
      activos += stats.activos
      saldo += stats.saldo
    }
    return { activos, saldo }
  }, [statsPorTaller])

  const filtrados = useMemo(() => {
    const q = busqueda.trim().toLowerCase()
    const lista = q
      ? talleres.filter((t) =>
          `${t.nombre} ${t.especialidad ?? ''} ${t.telefono} ${t.direccion ?? ''} ${t.nota ?? ''}`
            .toLowerCase()
            .includes(q),
        )
      : talleres
    return [...lista].sort((a, b) => a.nombre.localeCompare(b.nombre))
  }, [talleres, busqueda])

  const abrirNuevo = () => {
    setEditando(null)
    setModalAbierto(true)
  }

  const abrirEditar = (taller: Taller) => {
    setEditando(taller)
    setModalAbierto(true)
  }

  const cerrarModal = () => {
    setModalAbierto(false)
    setEditando(null)
  }

  const handleDelete = (taller: Taller) => {
    const stats = statsPorTaller.get(taller.id)
    const detalle =
      stats && stats.cortes > 0 ? ` Tiene ${stats.cortes} corte(s) asociado(s).` : ''
    if (window.confirm(`¿Eliminar el taller "${taller.nombre}"?${detalle}`)) {
      deleteTaller(taller.id)
    }
  }

  const idSugerido = siguienteId('tal', talleres.map((t) => t.id))

  return (
    <div className="space-y-4">
      {/* Cabecera */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-semibold text-stone-900 sm:text-2xl">Talleres</h1>
          <p className="mt-0.5 text-xs text-stone-500 sm:text-sm">
            Contacto, especialidad y carga de trabajo de cada taller.
          </p>
        </div>
        <Button className="w-full sm:w-auto" onClick={abrirNuevo}>
          + Nuevo taller
        </Button>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        <div className="rounded-xl border border-t-2 border-stone-200 border-t-amber-600/70 bg-white p-3 shadow-sm sm:p-3.5">
          <div className="text-[11px] font-medium text-stone-500 sm:text-xs">Talleres</div>
          <div className="mt-1 text-lg font-semibold text-stone-900">{talleres.length}</div>
          <div className="mt-0.5 text-[10px] text-stone-500 sm:text-xs">registrados</div>
        </div>

        <div className="rounded-xl border border-t-2 border-stone-200 border-t-sky-500/70 bg-white p-3 shadow-sm sm:p-3.5">
          <div className="text-[11px] font-medium text-stone-500 sm:text-xs">Cortes activos</div>
          <div className="mt-1 text-lg font-semibold text-stone-900">{totales.activos}</div>
          <div className="mt-0.5 text-[10px] text-stone-500 sm:text-xs">preparado / en taller</div>
        </div>

        <div className="col-span-2 rounded-xl border border-t-2 border-stone-200 border-t-emerald-600/70 bg-white p-3 shadow-sm sm:col-span-1 sm:p-3.5">
          <div className="text-[11px] font-medium text-stone-500 sm:text-xs">Saldo pendiente</div>
          <div className="mt-1 whitespace-nowrap text-lg font-semibold text-stone-900">
            <Money value={totales.saldo} />
          </div>
          <div className="mt-0.5 text-[10px] text-stone-500 sm:text-xs">a pagar a talleres</div>
        </div>
      </div>

      {/* Buscador */}
      {talleres.length > 0 && (
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <input
            className="h-9 w-full rounded-md border border-stone-300 bg-white px-3 text-sm focus:border-amber-600 focus:outline-none sm:w-72"
            placeholder="Buscar taller, especialidad o teléfono..."
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
          />
          <span className="text-xs text-stone-500">
            {filtrados.length} de {talleres.length} talleres
          </span>
        </div>
      )}

      {/* Listado */}
      {filtrados.length === 0 ? (
        <div className="rounded-xl border border-stone-200 bg-white p-8 text-center shadow-sm">
          <p className="text-sm text-stone-500">
            {talleres.length === 0
              ? 'No hay talleres cargados todavía.'
              : 'No se encontraron talleres con esa búsqueda.'}
          </p>
          {talleres.length === 0 && (
            <Button className="mt-3" onClick={abrirNuevo}>
              + Nuevo taller
            </Button>
          )}
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {filtrados.map((t) => {
            const stats = statsPorTaller.get(t.id) ?? {
              cortes: 0,
              activos: 0,
              prendas: 0,
              saldo: 0,
            }
            const modelosConPrecio = Object.keys(t.precioPorPrendaPorModelo || {}).length

            return (
              <div
                key={t.id}
                className="flex flex-col rounded-xl border border-stone-200 bg-white p-3.5 shadow-sm"
              >
                <div className="flex items-start gap-2.5">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-amber-200 bg-amber-50 text-xs font-semibold text-amber-800">
                    {iniciales(t.nombre)}
                  </div>
                  <div className="min-w-0 flex-1">
                    <h2 className="truncate text-sm font-semibold text-stone-900">{t.nombre}</h2>
                    <div className="mt-0.5 flex flex-wrap items-center gap-1.5">
                      {t.especialidad ? (
                        <span className="rounded-full border border-amber-200 bg-amber-50 px-2 py-0.5 text-[10px] font-medium text-amber-800">
                          {t.especialidad}
                        </span>
                      ) : (
                        <span className="text-[10px] text-stone-400">Sin especialidad</span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="mt-3 grid grid-cols-3 gap-2 rounded-lg bg-stone-50 px-2.5 py-2 text-xs">
                  <div>
                    <div className="text-[10px] text-stone-500">Cortes</div>
                    <div className="font-semibold text-stone-900">{stats.cortes}</div>
                    <div className="text-[10px] text-stone-400">{stats.activos} activos</div>
                  </div>
                  <div>
                    <div className="text-[10px] text-stone-500">Prendas</div>
                    <div className="font-semibold text-stone-900">{stats.prendas}</div>
                    <div className="text-[10px] text-stone-400">en total</div>
                  </div>
                  <div className="text-right">
                    <div className="text-[10px] text-stone-500">Saldo</div>
                    <div
                      className={`font-semibold ${
                        stats.saldo > 0 ? 'text-amber-800' : 'text-emerald-700'
                      }`}
                    >
                      <Money value={stats.saldo} />
                    </div>
                    <div className="text-[10px] text-stone-400">
                      {stats.saldo > 0 ? 'pendiente' : 'al día'}
                    </div>
                  </div>
                </div>

                <div className="mt-2 space-y-1 text-xs text-stone-600">
                  <div className="flex items-center gap-1.5">
                    <span className="text-stone-400">Teléfono:</span>
                    {t.telefono ? (
                      <a href={`tel:${t.telefono}`} className="truncate hover:underline">
                        {t.telefono}
                      </a>
                    ) : (
                      <span>-</span>
                    )}
                  </div>
                  {t.direccion && (
                    <div className="flex items-center gap-1.5">
                      <span className="shrink-0 text-stone-400">Dirección:</span>
                      <span className="truncate">{t.direccion}</span>
                    </div>
                  )}
                  <div className="flex items-center gap-1.5">
                    <span className="shrink-0 text-stone-400">Precios:</span>
                    <span>
                      {modelosConPrecio > 0
                        ? `${modelosConPrecio} modelo${modelosConPrecio === 1 ? '' : 's'} con precio`
                        : 'A convenir'}
                    </span>
                  </div>
                  {t.nota && (
                    <div className="truncate text-stone-500" title={t.nota}>
                      {t.nota}
                    </div>
                  )}
                </div>

                <div className="mt-3 flex flex-wrap items-center justify-between gap-2 border-t border-stone-100 pt-3">
                  <div className="flex flex-wrap gap-2">
                    {t.telefono && (
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => (window.location.href = `tel:${t.telefono}`)}
                      >
                        Llamar
                      </Button>
                    )}
                    {t.telefono && (
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() =>
                          window.open(
                            `https://wa.me/${t.telefono.replace(/\D/g, '')}`,
                            '_blank',
                            'noopener,noreferrer',
                          )
                        }
                      >
                        WhatsApp
                      </Button>
                    )}
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => abrirEditar(t)}
                      className="rounded px-2 py-1 text-xs font-medium text-stone-600 hover:bg-stone-100 hover:text-stone-900"
                    >
                      Editar
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(t)}
                      className="rounded px-2 py-1 text-xs font-medium text-red-700 hover:bg-red-50"
                    >
                      Eliminar
                    </button>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {modalAbierto && (
        <TallerModal
          taller={editando}
          idSugerido={idSugerido}
          onClose={cerrarModal}
          onSave={saveTaller}
        />
      )}
    </div>
  )
}
