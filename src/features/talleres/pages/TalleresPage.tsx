import { useMemo, useState } from 'react'
import { Button } from '../../../shared/components/Button'
import { Money } from '../../../shared/components/Money'
import { useErpStore } from '../../../data/erpStore'
import { siguienteId } from '../../../utils/codigos'
import { resumenPagosPorTaller } from '../../pagos/pagos.utils'
import type { Taller } from '../../../types'
import { TallerModal } from '../components/TallerModal'
import { TallerDetalleModal } from '../components/TallerDetalleModal'

export function TalleresPage() {
  const { talleres, cortes, pagos, articulos, saveTaller, deleteTaller } = useErpStore()
  const [busqueda, setBusqueda] = useState('')
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
    setViendo(null)
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
      if (viendo?.id === taller.id) setViendo(null)
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
        <div className="grid gap-2.5 sm:grid-cols-2">
          {filtrados.map((t) => {
            const stats = statsPorTaller.get(t.id) ?? {
              cortes: 0,
              activos: 0,
              prendas: 0,
              saldo: 0,
            }

            return (
              <div
                key={t.id}
                onClick={() => abrirDetalle(t)}
                className="flex cursor-pointer items-center justify-between gap-3 rounded-xl border border-stone-200 bg-white px-3.5 py-3 shadow-sm transition-colors hover:border-amber-300 hover:bg-amber-50/20 active:bg-stone-50"
              >
                <div className="min-w-0">
                  <h2 className="truncate text-sm font-semibold text-stone-900">{t.nombre}</h2>
                  <p className="mt-0.5 truncate text-[11px] text-stone-500">
                    {t.especialidad || 'Sin especialidad'} · {stats.activos} activos
                  </p>
                </div>
                <div className="shrink-0 text-right">
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
          onClose={() => setViendo(null)}
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
