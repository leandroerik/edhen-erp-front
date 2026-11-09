import { useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Button } from '../../../shared/components/Button'
import { Money } from '../../../shared/components/Money'
import { useErpStore } from '../../../data/erpStore'
import { siguienteId } from '../../../utils/codigos'
import { colorDeTaller, linkWhatsApp, rgba } from '../../../utils/talleres'
import { resumenPagosPorTaller } from '../../pagos/pagos.utils'
import type { Taller } from '../../../types'
import { TallerModal } from '../components/TallerModal'
import { TallerDetalleModal } from '../components/TallerDetalleModal'

function iniciales(nombre: string) {
  const partes = nombre.trim().split(/\s+/).filter(Boolean)
  const primera = partes[0]?.charAt(0) ?? ''
  const segunda = partes[1]?.charAt(0) ?? ''
  return `${primera}${segunda}`.toUpperCase() || '?'
}

export function TalleresPage() {
  const { talleres, cortes, pagos, articulos, saveTaller, deleteTaller } = useErpStore()
  const [searchParams, setSearchParams] = useSearchParams()
  const tallerParam = searchParams.get('taller')
  const [busqueda, setBusqueda] = useState('')
  const [mostrarInactivos, setMostrarInactivos] = useState(false)
  const [modalAbierto, setModalAbierto] = useState(false)
  const [editando, setEditando] = useState<Taller | null>(null)
  const [viendo, setViendo] = useState<Taller | null>(null)

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
    const base = mostrarInactivos ? talleres : talleres.filter((t) => t.activo !== false)
    const lista = q
      ? base.filter((t) =>
          `${t.nombre} ${t.especialidad ?? ''} ${t.telefono} ${t.direccion ?? ''} ${t.nota ?? ''}`
            .toLowerCase()
            .includes(q),
        )
      : base
    return [...lista].sort((a, b) => a.nombre.localeCompare(b.nombre))
  }, [talleres, busqueda, mostrarInactivos])

  useEffect(() => {
    if (!tallerParam) return
    const taller = talleres.find(
      (item) => item.id === tallerParam || item.nombre === tallerParam,
    )
    if (taller) setViendo(taller)
  }, [tallerParam, talleres])

  const cerrarDetalle = () => {
    setViendo(null)
    if (!searchParams.has('taller')) return
    const siguientes = new URLSearchParams(searchParams)
    siguientes.delete('taller')
    setSearchParams(siguientes, { replace: true })
  }

  const abrirNuevo = () => {
    setEditando(null)
    setModalAbierto(true)
  }

  const abrirEditar = (taller: Taller) => {
    cerrarDetalle()
    setEditando(taller)
    setModalAbierto(true)
  }

  const abrirDetalle = (taller: Taller) => {
    setViendo(taller)
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
      if (viendo?.id === taller.id) cerrarDetalle()
      if (editando?.id === taller.id) setEditando(null)
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

      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 rounded-xl border border-stone-200 bg-white px-3.5 py-2.5 text-xs text-stone-500 shadow-sm">
        <span>
          <strong className="font-semibold text-stone-900">{talleres.length}</strong> talleres
        </span>
        <span>
          <strong className="font-semibold text-stone-900">{totales.activos}</strong> cortes activos
        </span>
        <span>
          Saldo pendiente{' '}
          <strong className={totales.saldo > 0 ? 'font-semibold text-amber-800' : 'font-semibold text-emerald-700'}>
            <Money value={totales.saldo} />
          </strong>
        </span>
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
          <div className="flex items-center gap-3">
            <label className="inline-flex items-center gap-1.5 text-xs font-medium text-stone-600">
              <input
                type="checkbox"
                checked={mostrarInactivos}
                onChange={(e) => setMostrarInactivos(e.target.checked)}
                className="accent-amber-600"
              />
              Mostrar inactivos
            </label>
            <span className="text-xs text-stone-500">
              {filtrados.length} de {talleres.length} talleres
            </span>
          </div>
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
        <div className="grid gap-2.5 sm:grid-cols-2">
          {filtrados.map((t) => {
            const stats = statsPorTaller.get(t.id) ?? {
              cortes: 0,
              activos: 0,
              prendas: 0,
              saldo: 0,
            }

            const color = colorDeTaller(t.color)
            const inactivo = t.activo === false

            return (
              <div
                key={t.id}
                onClick={() => abrirDetalle(t)}
                className={`flex cursor-pointer items-center justify-between gap-3 rounded-xl border border-stone-200 bg-white px-3.5 py-3 shadow-sm transition-colors hover:border-amber-300 hover:bg-amber-50/20 active:bg-stone-50 ${
                  inactivo ? 'opacity-70' : ''
                }`}
              >
                <div className="flex min-w-0 items-center gap-2.5">
                  <div
                    className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border text-[11px] font-semibold"
                    style={{
                      backgroundColor: rgba(color, 0.12),
                      borderColor: rgba(color, 0.35),
                      color,
                    }}
                  >
                    {iniciales(t.nombre)}
                  </div>
                  <div className="min-w-0">
                    <div className="flex min-w-0 items-center gap-1.5">
                      <h2 className="min-w-0 truncate text-sm font-semibold text-stone-900">
                        {t.nombre}
                      </h2>
                      {inactivo && (
                        <span className="shrink-0 rounded-full border border-stone-300 bg-stone-100 px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wide text-stone-500">
                          Inactivo
                        </span>
                      )}
                    </div>
                    <p className="mt-0.5 truncate text-[11px] text-stone-500">
                      {t.especialidad || 'Sin especialidad'} · {stats.activos} activos
                    </p>
                    <div className="mt-1 space-y-0.5 text-[10px] text-stone-500">
                      {t.telefono && (
                        <div className="flex min-w-0 items-center gap-1.5">
                          <svg
                            className="h-3 w-3 shrink-0 text-stone-400"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M3 5a2 2 0 012-2h2.28a1 1 0 01.95.68l1.1 3.29a1 1 0 01-.27 1.04L7.6 9.4a15.05 15.05 0 006.99 6.99l1.39-1.46a1 1 0 011.04-.27l3.29 1.1a1 1 0 01.68.95V19a2 2 0 01-2 2h-1C9.72 21 3 14.28 3 6V5z"
                            />
                          </svg>
                          <span className="truncate">{t.telefono}</span>
                        </div>
                      )}
                      {t.direccion && (
                        <div className="flex min-w-0 items-center gap-1.5">
                          <svg
                            className="h-3 w-3 shrink-0 text-stone-400"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M17.657 16.657L13.414 20.9a2 2 0 01-2.828 0l-4.243-4.243a8 8 0 1111.314 0z"
                            />
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                            />
                          </svg>
                          <span className="truncate">{t.direccion}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  {t.telefono && (
                    <button
                      type="button"
                      title={`Enviar WhatsApp a ${t.nombre}`}
                      aria-label={`Enviar WhatsApp a ${t.nombre}`}
                      onClick={(e) => {
                        e.stopPropagation()
                        window.open(linkWhatsApp(t.telefono), '_blank', 'noopener,noreferrer')
                      }}
                      className="flex h-8 w-8 items-center justify-center rounded-full border border-emerald-200 bg-emerald-50 text-emerald-700 transition-colors hover:bg-emerald-100"
                    >
                      <svg
                        viewBox="0 0 24 24"
                        fill="currentColor"
                        aria-hidden="true"
                        className="h-4 w-4"
                      >
                        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                      </svg>
                    </button>
                  )}
                  <div className="text-right">
                    <div
                      className={`text-sm font-semibold ${
                        stats.saldo > 0 ? 'text-amber-800' : 'text-emerald-700'
                      }`}
                    >
                      <Money value={stats.saldo} />
                    </div>
                    <div className="text-[10px] text-stone-400">saldo</div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {viendo && (
        <TallerDetalleModal
          taller={viendo}
          stats={
            statsPorTaller.get(viendo.id) ?? {
              cortes: 0,
              activos: 0,
              prendas: 0,
              saldo: 0,
            }
          }
          articulos={articulos.filter(
            (a) =>
              a.tallerId === viendo.id ||
              (!a.tallerId && a.tallerNombre === viendo.nombre),
          )}
          onClose={cerrarDetalle}
          onEdit={() => abrirEditar(viendo)}
          onDelete={() => handleDelete(viendo)}
        />
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
