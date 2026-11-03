import { useState, useMemo } from 'react'
import { Button } from '../../../shared/components/Button'
import { Money } from '../../../shared/components/Money'
import { Pagination } from '../../../shared/components/Pagination'
import { useErpStore } from '../../../data/erpStore'
import type { Articulo } from '../../../types'
import { ArticuloModal } from '../components/ArticuloModal'
import { ArticuloDetalleModal } from '../components/ArticuloDetalleModal'

function nextCodigoArticulo(articulos: Articulo[]) {
  const numeros = articulos
    .map((a) => /^ART-(\d+)$/.exec(a.codigoArticulo)?.[1])
    .filter((n): n is string => !!n)
    .map(Number)
  return `ART-${String((numeros.length ? Math.max(...numeros) : 0) + 1).padStart(4, '0')}`
}

const th = 'px-4 py-2.5 text-xs font-semibold uppercase tracking-wide text-stone-500'
const thRight = `${th} text-right`
const td = 'px-4 py-2.5 text-sm text-stone-900'
const tdRight = `${td} text-right tabular-nums`

export function ArticulosPage() {
  const { articulos, addArticulo, updateArticulo, deleteArticulo } = useErpStore()
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState<Articulo | null>(null)
  const [viewing, setViewing] = useState<Articulo | null>(null)
  const [busqueda, setBusqueda] = useState('')
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)

  const nextCodigo = nextCodigoArticulo(articulos)

  // KPIs globales
  const kpis = useMemo(() => {
    const totalArticulos = articulos.length
    const totalPrendas = articulos.reduce((a, b) => a + (Number(b.cantidadPrendas) || 0), 0)
    const inversionProduccion = articulos.reduce(
      (a, b) => a + (Number(b.costoTotalProduccion) || 0),
      0,
    )
    const ventaProyectada = articulos.reduce(
      (a, b) => a + (Number(b.precioVenta || 0) * (Number(b.cantidadPrendas) || 0)),
      0,
    )
    const gananciaTotal = articulos.reduce(
      (a, b) => a + (Number(b.gananciaTotal) || 0),
      0,
    )
    const margenPromedio =
      inversionProduccion > 0 ? (gananciaTotal / inversionProduccion) * 100 : 0

    return {
      totalArticulos,
      totalPrendas,
      inversionProduccion,
      ventaProyectada,
      gananciaTotal,
      margenPromedio,
    }
  }, [articulos])

  const articulosFiltrados = useMemo(() => {
    const q = busqueda.toLowerCase().trim()
    if (!q) return articulos
    return articulos.filter((a) => {
      const enNombre = (a.nombre || '').toLowerCase().includes(q)
      const enCodigo = a.codigoArticulo.toLowerCase().includes(q)
      const enDesc = (a.descripcion || '').toLowerCase().includes(q)
      const enTelas = (a.telas || []).some(
        (t) =>
          t.telaNombre.toLowerCase().includes(q) ||
          t.colorNombre.toLowerCase().includes(q),
      )
      return enNombre || enCodigo || enDesc || enTelas
    })
  }, [articulos, busqueda])

  const totalFiltrados = articulosFiltrados.length
  const articulosPaginados = useMemo(() => {
    const start = (page - 1) * pageSize
    return articulosFiltrados.slice(start, start + pageSize)
  }, [articulosFiltrados, page, pageSize])

  const handleSearchChange = (value: string) => {
    setBusqueda(value)
    setPage(1)
  }

  const handleDelete = (articulo: Articulo) => {
    const nombre = articulo.nombre || articulo.descripcion || articulo.codigoArticulo
    if (
      !window.confirm(
        `¿Eliminar el artículo ${articulo.codigoArticulo} · ${nombre}? Esta acción no se puede deshacer.`,
      )
    ) {
      return
    }
    deleteArticulo(articulo.id)
    if (viewing?.id === articulo.id) setViewing(null)
    if (editing?.id === articulo.id) setEditing(null)
  }

  return (
    <div className="space-y-4">
      {/* Cabecera */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-stone-900">Artículos</h1>
          <p className="mt-1 text-sm text-stone-500">
            Costos de producción, telas asignadas y rentabilidad por prenda.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <input
            className="h-9 w-56 rounded-md border border-stone-300 bg-white px-3 text-sm focus:border-amber-600 focus:outline-none"
            placeholder="Buscar por prenda, tela o código..."
            value={busqueda}
            onChange={(e) => handleSearchChange(e.target.value)}
          />
          <Button onClick={() => setOpen(true)}>+ Nuevo artículo</Button>
        </div>
      </div>

      {/* Tarjetas KPI de resumen ejecutivo */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="rounded-xl border border-stone-200 bg-white p-3.5 shadow-sm">
          <div className="text-xs font-medium text-stone-500">Catálogo de prendas</div>
          <div className="mt-1 text-2xl font-bold text-stone-900">
            {kpis.totalArticulos} <span className="text-sm font-normal text-stone-500">modelos</span>
          </div>
          <div className="mt-0.5 text-xs text-stone-500">
            {kpis.totalPrendas} prendas en producción
          </div>
        </div>

        <div className="rounded-xl border border-stone-200 bg-white p-3.5 shadow-sm">
          <div className="text-xs font-medium text-stone-500">Inversión en producción</div>
          <div className="mt-1 text-2xl font-bold text-stone-900">
            <Money value={kpis.inversionProduccion} />
          </div>
          <div className="mt-0.5 text-xs text-stone-500">
            Telas + mano de obra + avíos
          </div>
        </div>

        <div className="rounded-xl border border-stone-200 bg-white p-3.5 shadow-sm">
          <div className="text-xs font-medium text-stone-500">Venta proyectada</div>
          <div className="mt-1 text-2xl font-bold text-stone-900">
            <Money value={kpis.ventaProyectada} />
          </div>
          <div className="mt-0.5 text-xs text-stone-500">
            Total precio público
          </div>
        </div>

        <div className="rounded-xl border border-emerald-200 bg-emerald-50/50 p-3.5 shadow-sm">
          <div className="text-xs font-medium text-emerald-800">Ganancia potencial</div>
          <div className="mt-1 text-2xl font-bold text-emerald-900">
            <Money value={kpis.gananciaTotal} />
          </div>
          <div className="mt-0.5 text-xs font-medium text-emerald-700">
            Margen promedio: {kpis.margenPromedio.toFixed(1)}%
          </div>
        </div>
      </div>

      {/* Tabla de artículos */}
      <div className="overflow-x-auto rounded-lg border border-stone-200 bg-white shadow-sm">
        <table className="w-full divide-y divide-stone-200">
          <thead className="bg-stone-50">
            <tr>
              <th className={`${th} text-left`}>Código</th>
              <th className={`${th} text-left`}>Prenda / Telas</th>
              <th className={thRight}>Prendas</th>
              <th className={thRight}>Costo unitario</th>
              <th className={thRight}>Precio venta</th>
              <th className={thRight}>Ganancia / prenda</th>
              <th className={thRight}>Margen</th>
              <th className={thRight}>Ganancia total</th>
              <th className="px-4 py-2.5 text-center text-xs font-semibold uppercase tracking-wide text-stone-500">
                Acciones
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-stone-100">
            {totalFiltrados === 0 ? (
              <tr>
                <td colSpan={9} className="px-4 py-8 text-center text-sm text-stone-400">
                  {busqueda
                    ? 'No se encontraron artículos con esa búsqueda.'
                    : 'No hay artículos cargados todavía.'}
                </td>
              </tr>
            ) : (
              articulosPaginados.map((a) => {
                const nombre = a.nombre || a.descripcion || 'Artículo'
                const descripcion = a.nombre && a.descripcion ? a.descripcion : ''
                const margen = Number(a.margenReal || 0)
                const telasCount = a.telas?.length || 0

                return (
                  <tr
                    key={a.id}
                    onClick={() => setViewing(a)}
                    className="group cursor-pointer hover:bg-stone-50 transition-colors"
                  >
                    <td className={`${td} font-medium font-mono text-xs text-amber-900`}>
                      {a.codigoArticulo}
                    </td>
                    <td className={td}>
                      <div className="font-medium text-stone-900 group-hover:text-amber-800">
                        {nombre}
                      </div>
                      <div className="flex items-center gap-1.5 text-xs text-stone-500">
                        {descripcion && <span>{descripcion}</span>}
                        {telasCount > 0 && (
                          <span className="rounded bg-stone-100 px-1.5 py-0.2 text-[10px] text-stone-600">
                            {telasCount} {telasCount === 1 ? 'tela' : 'telas'}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className={tdRight}>{a.cantidadPrendas}</td>
                    <td className={tdRight}>
                      <Money value={a.costoUnitario} />
                    </td>
                    <td className={tdRight}>
                      <Money value={a.precioVenta} />
                    </td>
                    <td className={`${tdRight} text-emerald-800 font-medium`}>
                      +{<Money value={a.gananciaUnitaria} />}
                    </td>
                    <td className={tdRight}>
                      <span
                        className={`inline-block rounded-full px-2 py-0.5 text-xs font-semibold ${
                          margen >= 100
                            ? 'bg-emerald-100 text-emerald-800'
                            : margen >= 50
                              ? 'bg-stone-100 text-stone-700'
                              : 'bg-amber-100 text-amber-800'
                        }`}
                      >
                        {margen.toFixed(1)}%
                      </span>
                    </td>
                    <td className={`${tdRight} font-bold text-emerald-900`}>
                      <Money value={a.gananciaTotal || 0} />
                    </td>
                    <td className="px-4 py-2.5 text-center">
                      <div
                        className="flex items-center justify-center gap-1.5"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <button
                          type="button"
                          onClick={() => setViewing(a)}
                          className="rounded px-2 py-1 text-xs font-medium text-amber-700 hover:bg-amber-50"
                        >
                          Ver
                        </button>
                        <button
                          type="button"
                          onClick={() => setEditing(a)}
                          className="rounded px-2 py-1 text-xs font-medium text-stone-600 hover:bg-stone-100 hover:text-stone-900"
                        >
                          Editar
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDelete(a)}
                          className="rounded px-2 py-1 text-xs font-medium text-red-700 hover:bg-red-50"
                        >
                          Eliminar
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Paginación */}
      <Pagination
        page={page}
        pageSize={pageSize}
        totalItems={totalFiltrados}
        onPageChange={setPage}
        onPageSizeChange={(newSize) => {
          setPageSize(newSize)
          setPage(1)
        }}
        pageSizeOptions={[10, 20, 50]}
        itemLabel="artículos"
      />

      {/* Modal de Detalle */}
      {viewing && (
        <ArticuloDetalleModal
          articulo={viewing}
          onClose={() => setViewing(null)}
          onEdit={() => {
            const art = viewing
            setViewing(null)
            setEditing(art)
          }}
          onDelete={() => handleDelete(viewing)}
        />
      )}

      {/* Modal de Alta */}
      {open && (
        <ArticuloModal
          codigoSugerido={nextCodigo}
          onClose={() => setOpen(false)}
          onSave={(d) => {
            addArticulo({ id: `art-${Date.now()}`, ...(d as Omit<Articulo, 'id'>) })
          }}
        />
      )}

      {/* Modal de Edición */}
      {editing && (
        <ArticuloModal
          articulo={editing}
          codigoSugerido={editing.codigoArticulo}
          onClose={() => setEditing(null)}
          onSave={(data) => {
            updateArticulo({ ...editing, ...data })
          }}
        />
      )}
    </div>
  )
}
