import { Fragment, useState } from 'react'
import { Button } from '../../../shared/components/Button'
import { formatDate } from '../../../utils/format'
import { COMPRAS_ROLLOS, type OpcionRollo } from '../stockRollos'

interface Seleccionada {
  stockKey?: string
  loteId?: string
  telaNombre: string
  colorNombre: string
}

interface Props {
  seleccionadas: Seleccionada[]
  onAgregar: (opcion: OpcionRollo) => void
}

const th = 'px-2 py-2 text-xs font-semibold uppercase tracking-wide text-stone-500'
const thRight = `${th} text-right`
const td = 'px-2 py-2 text-sm text-stone-900'
const tdRight = `${td} text-right tabular-nums text-stone-600`

export function TelasStockTable({ seleccionadas, onAgregar }: Props) {
  const [abiertas, setAbiertas] = useState<Record<string, boolean>>({})

  const estaSeleccionada = (opcion: OpcionRollo) =>
    seleccionadas.some((t) =>
      t.stockKey
        ? t.stockKey === opcion.key
        : t.loteId === opcion.loteId &&
          t.telaNombre === opcion.telaNombre &&
          t.colorNombre === opcion.colorNombre,
    )

  const toggleCompra = (codigo: string) =>
    setAbiertas((prev) => ({ ...prev, [codigo]: !prev[codigo] }))

  const todasAbiertas = COMPRAS_ROLLOS.every((c) => abiertas[c.codigo])
  const toggleTodas = () =>
    setAbiertas(Object.fromEntries(COMPRAS_ROLLOS.map((c) => [c.codigo, !todasAbiertas])))

  const totalLotes = COMPRAS_ROLLOS.reduce((a, c) => a + c.opciones.length, 0)

  return (
    <div>
      <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
        <span className="text-xs text-stone-500">
          {COMPRAS_ROLLOS.length} compras · {totalLotes} lotes
        </span>
        <Button size="sm" variant="secondary" onClick={toggleTodas}>
          {todasAbiertas ? 'Contraer todo' : 'Expandir todo'}
        </Button>
      </div>

      <div className="overflow-x-auto rounded-md border border-stone-200">
        <table className="w-full divide-y divide-stone-200">
          <thead className="bg-stone-100">
            <tr>
              <th className={`${th} text-left`}>Compra / lote</th>
              <th className={`${th} text-left`}>Tela</th>
              <th className={`${th} text-left`}>Color</th>
              <th className={thRight}>Rollos libres</th>
              <th className={thRight}>Cantidad libre</th>
              <th className={thRight}>Acción</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-stone-100">
            {COMPRAS_ROLLOS.map((compra) => {
              const abierta = !!abiertas[compra.codigo]
              const rollosLibres = compra.opciones.reduce(
                (a, o) => a + o.rollosDisponibles,
                0,
              )
              return (
                <Fragment key={compra.codigo}>
                  <tr
                    className="cursor-pointer bg-stone-50 hover:bg-stone-100"
                    onClick={() => toggleCompra(compra.codigo)}
                  >
                    <td colSpan={6} className="px-2 py-2 text-xs font-semibold text-stone-700">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <span className="flex items-center gap-2">
                          <span className="text-stone-400">{abierta ? '▾' : '▸'}</span>
                          <span>
                            {compra.codigo} · {formatDate(compra.fecha)} ·{' '}
                            {compra.proveedorNombre}
                          </span>
                        </span>
                        <span className="font-normal text-stone-500">
                          {compra.opciones.length} lotes · {rollosLibres} rollos libres
                        </span>
                      </div>
                    </td>
                  </tr>
                  {abierta &&
                    compra.opciones.map((opcion) => {
                      const agregada = estaSeleccionada(opcion)
                      const sinStock = opcion.rollosDisponibles === 0
                      return (
                        <tr key={opcion.key} className="hover:bg-stone-50">
                          <td className={`${td} text-stone-600`}>{opcion.loteId}</td>
                          <td className={td}>{opcion.telaNombre}</td>
                          <td className={`${td} text-stone-600`}>{opcion.colorNombre}</td>
                          <td className={tdRight}>{opcion.rollosDisponibles}</td>
                          <td className={tdRight}>
                            {opcion.cantidadDisponible.toFixed(2)}{' '}
                            {opcion.unidad === 'METRO' ? 'm' : 'kg'}
                          </td>
                          <td className="px-2 py-2 text-right">
                            <Button
                              size="sm"
                              variant={agregada ? 'ghost' : 'secondary'}
                              disabled={agregada || sinStock}
                              onClick={() => onAgregar(opcion)}
                            >
                              {agregada ? 'Agregada' : sinStock ? 'Sin stock' : 'Usar'}
                            </Button>
                          </td>
                        </tr>
                      )
                    })}
                </Fragment>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
