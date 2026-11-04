import { createContext, useContext, useState, useEffect, type ReactNode } from 'react'
import {
  mockArticulos,
  mockCompras,
  mockCortes,
  mockEncimadas,
  mockModelos,
  mockPagos,
  mockProveedores,
  mockTalleres,
} from './mock'
import type {
  Articulo,
  AvioArticulo,
  Compra,
  Corte,
  Encimada,
  EncimadaItem,
  EstadoCorte,
  Modelo,
  PagoTaller,
  Proveedor,
  Taller,
  TelaArticulo,
} from '../types'
import { fetchGasBootstrap, postGasAction, postGasBatch } from '../api/gasClient'
import { anchoCodigo, renumerarConsecutivos } from '../utils/codigos'
import { redondearRollos } from '../utils/stock'

const STORAGE_KEY = 'edhen_erp_data_v1'

interface StoredData {
  articulos?: Articulo[]
  cortes?: Corte[]
  encimadas?: Encimada[]
  pagos?: PagoTaller[]
  compras?: Compra[]
  talleres?: Taller[]
  proveedores?: Proveedor[]
}

function loadInitialData(): StoredData {
  if (typeof window === 'undefined') return {}
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) return JSON.parse(raw)
  } catch (e) {
    console.error('Error leyendo localStorage', e)
  }
  return {}
}

function saveStoreData(data: StoredData) {
  if (typeof window === 'undefined') return
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
  } catch (e) {
    console.error('Error guardando en localStorage', e)
  }
}

interface ErpStore {
  articulos: Articulo[]
  encimadas: Encimada[]
  cortes: Corte[]
  pagos: PagoTaller[]
  compras: Compra[]
  talleres: Taller[]
  proveedores: Proveedor[]
  addCompra: (compra: Compra) => void
  addProveedor: (proveedor: Proveedor) => void
  addArticulo: (articulo: Articulo) => void
  updateArticulo: (articulo: Articulo) => void
  deleteArticulo: (articuloId: string) => void
  saveEncimada: (encimada: Encimada) => void
  deleteEncimada: (encimadaId: string) => void
  addCorte: (corte: Corte) => void
  updateCorte: (corte: Corte) => void
  changeEstadoCorte: (corteId: string, nuevoEstado: EstadoCorte) => void
  assignTallerCorte: (corteId: string, tallerId: string, tallerNombre: string, precioPorPrenda?: number) => void
  addPagoTaller: (pago: PagoTaller) => void
  deletePagoTaller: (pagoId: string) => void
  resetearADemo: () => void
  limpiarTodo: () => void
  sincronizando: boolean
  ultimoSync: Date | null
  sincronizarConSheets: () => Promise<{ ok: boolean; mensaje: string; count?: Record<string, number> }>
  hidratarDatos: (datos: {
    articulos?: Articulo[]
    cortes?: Corte[]
    encimadas?: Encimada[]
    pagos?: PagoTaller[]
    compras?: Compra[]
    talleres?: Taller[]
    proveedores?: Proveedor[]
  }) => void
}

const ErpStoreContext = createContext<ErpStore | null>(null)

function nextArticuloSeq(articulos: Articulo[]) {
  const numeros = articulos
    .map((a) => /^ART-(\d+)$/.exec(a.codigoArticulo)?.[1])
    .filter((n): n is string => !!n)
    .map(Number)
  return (numeros.length ? Math.max(...numeros) : 0) + 1
}

function nextCorteSeq(cortes: Corte[]) {
  const numeros = cortes
    .map((c) => /^C-(\d+)$/.exec(c.codigo)?.[1])
    .filter((n): n is string => !!n)
    .map(Number)
  return (numeros.length ? Math.max(...numeros) : 0) + 1
}

/**
 * Deja las series ART-/ENC- consecutivas (1..N) y mantiene sincronizadas las
 * descripciones "Encimada ENC-XXXX". Devuelve lo que cambió para persistirlo.
 */
function normalizarCodigos(articulos: Articulo[], encimadas: Encimada[]) {
  const encs = renumerarConsecutivos(
    encimadas,
    'ENC',
    (encimada) => encimada.codigo,
    (encimada, codigo) => ({ ...encimada, codigo }),
  )
  const renombres = new Map(encs.mapaCodigos.map(({ antes, despues }) => [antes, despues]))

  const arts = renumerarConsecutivos(
    articulos,
    'ART',
    (articulo) => articulo.codigoArticulo,
    (articulo, codigoArticulo) => ({ ...articulo, codigoArticulo }),
  )

  const cambiadosArts = new Map(arts.cambiados.map((articulo) => [articulo.id, articulo]))
  const artsFinal = arts.items.map((articulo) => {
    const anterior = String(articulo.descripcion || '')
      .trim()
      .replace(/^Encimada\s+/i, '')
    const nuevo = renombres.get(anterior)
    if (!nuevo) return articulo
    const descripcion = `Encimada ${nuevo}`
    if (descripcion === articulo.descripcion) return articulo
    const actualizado = { ...articulo, descripcion }
    cambiadosArts.set(articulo.id, actualizado)
    return actualizado
  })

  return {
    articulos: artsFinal,
    encimadas: encs.items,
    articulosCambiados: [...cambiadosArts.values()],
    encimadasCambiadas: encs.cambiados,
  }
}

function totalCapas(encimada: Encimada) {
  return encimada.cargas.reduce((a, c) => a + c.capas, 0)
}

function manoObraModelo(modelo?: Modelo) {
  if (!modelo) return 0
  for (const taller of mockTalleres) {
    const precio = taller.precioPorPrendaPorModelo[modelo.id]
    if (precio) return precio
  }
  return 0
}

function articuloDesdeItem(
  encimada: Encimada,
  item: EncimadaItem,
  existente: Articulo | undefined,
  codigoSugerido: string,
): Articulo {
  const cantidadPrendas = totalCapas(encimada) * item.cantidad
  
  // Porcentaje asignado de tela a este modelo (por defecto ponderado por cantidad/talles en tizada)
  const totalCantidades = encimada.items.reduce((a, i) => a + (Number(i.cantidad) || 0), 0)
  const porcentaje =
    typeof item.porcentaje === 'number' && item.porcentaje > 0
      ? item.porcentaje
      : totalCantidades > 0
        ? (item.cantidad / totalCantidades) * 100
        : 100
  const factorPorc = porcentaje / 100

  // Asignar telas proporcionalmente a la participación de este modelo en la encimada
  const telasUsadasEncimada = encimada.telasUsadas || []
  const telas: TelaArticulo[] =
    telasUsadasEncimada.length > 0
      ? telasUsadasEncimada.map((t) => ({
          stockKey: t.stockKey,
          loteId: t.loteId,
          compraCodigo: t.compraCodigo,
          compraFecha: t.compraFecha,
          proveedorNombre: t.proveedorNombre,
          telaNombre: t.telaNombre,
          colorNombre: t.colorNombre,
          unidad: t.unidad,
          rollosUsados: redondearRollos((t.rollosUsados || 0) * factorPorc),
          rollosDisponibles: t.rollosDisponibles,
          rollosLibres: Math.max(
            0,
            redondearRollos(t.rollosDisponibles - (t.rollosUsados || 0) * factorPorc),
          ),
          cantidadUsar: Math.round(t.cantidadUsada * factorPorc * 10) / 10,
          cantidadLibre: Math.max(0, t.cantidadDisponible - t.cantidadUsada * factorPorc),
          precioUnitario: t.precioUnitario,
          costoUsado: Math.round(t.costoUsado * factorPorc),
        }))
      : (existente?.telas ?? [])

  const costoTelaTotalUsado = telas.reduce((a, t) => a + t.costoUsado, 0)
  const costoTelaPorPrenda = cantidadPrendas > 0 ? costoTelaTotalUsado / cantidadPrendas : 0
  const modelo = mockModelos.find(
    (m) => m.nombre.trim().toLowerCase() === item.modeloNombre.trim().toLowerCase(),
  )
  const avios: AvioArticulo[] =
    existente?.avios ??
    (modelo?.avios ?? []).map((a) => ({
      ...a,
      porPrenda: true,
    }))
  const aviosPorPrenda = avios.reduce((a, av) => a + (av.porPrenda ? av.monto : 0), 0)
  const aviosTotales = avios.reduce((a, av) => a + (!av.porPrenda ? av.monto : 0), 0)
  const manoObra = existente?.manoObra ?? manoObraModelo(modelo)
  const costoUnitario =
    costoTelaPorPrenda +
    manoObra +
    aviosPorPrenda +
    (cantidadPrendas > 0 ? aviosTotales / cantidadPrendas : 0)
  const costoTotalProduccion =
    costoTelaTotalUsado +
    manoObra * cantidadPrendas +
    aviosPorPrenda * cantidadPrendas +
    aviosTotales
  const margenGanancia = existente?.margenGanancia ?? 100
  const precioSugerido = costoUnitario * (1 + margenGanancia / 100)
  const precioVenta = existente?.precioVenta ?? modelo?.precioVenta ?? precioSugerido
  const gananciaUnitaria = precioVenta - costoUnitario
  const gananciaTotal = gananciaUnitaria * cantidadPrendas
  const margenReal = costoUnitario > 0 ? (gananciaUnitaria / costoUnitario) * 100 : 0

  return {
    id: existente?.id ?? `art-${encimada.id}-${item.id}`,
    codigoArticulo: existente?.codigoArticulo ?? codigoSugerido,
    nombre: item.modeloNombre.trim(),
    descripcion: `Encimada ${encimada.codigo}`,
    cantidadPrendas,
    telas,
    costoTelaTotalUsado,
    costoTelaPorPrenda,
    manoObra,
    avios,
    aviosPorPrenda,
    aviosTotales,
    costoUnitario,
    costoTotalProduccion,
    margenGanancia,
    precioSugerido,
    precioVenta,
    gananciaUnitaria,
    gananciaTotal,
    margenReal,
    encimadaId: encimada.id,
    encimadaItemId: item.id,
  }
}

export function ErpStoreProvider({ children }: { children: ReactNode }) {
  const initial = loadInitialData()
  const [articulos, setArticulos] = useState<Articulo[]>(initial.articulos || mockArticulos)
  const [encimadas, setEncimadas] = useState<Encimada[]>(initial.encimadas || mockEncimadas)
  const [cortes, setCortes] = useState<Corte[]>(initial.cortes || mockCortes)
  const [pagos, setPagos] = useState<PagoTaller[]>(initial.pagos || mockPagos)
  const [compras, setCompras] = useState<Compra[]>(initial.compras || mockCompras)
  const [talleres, setTalleres] = useState<Taller[]>(initial.talleres || mockTalleres)
  const [proveedores, setProveedores] = useState<Proveedor[]>(
    initial.proveedores || mockProveedores,
  )
  const [sincronizando, setSincronizando] = useState(false)
  const [ultimoSync, setUltimoSync] = useState<Date | null>(null)

  // Guardar en localStorage cada vez que cambien los datos
  useEffect(() => {
    saveStoreData({
      articulos,
      encimadas,
      cortes,
      pagos,
      compras,
      talleres,
      proveedores,
    })
  }, [articulos, encimadas, cortes, pagos, compras, talleres, proveedores])

  // Persiste los códigos que cambió la normalización/renumeración.
  // Intenta un solo request por entidad; si el backend todavía no tiene
  // `guardarVarios`, cae a guardar fila por fila.
  const persistirCodigos = (normalizado: ReturnType<typeof normalizarCodigos>) => {
    const { articulosCambiados, encimadasCambiadas } = normalizado
    if (encimadasCambiadas.length > 0) {
      postGasBatch('encimada', encimadasCambiadas).then((ok) => {
        if (!ok) encimadasCambiadas.forEach((e) => postGasAction('guardarEncimada', e))
      })
    }
    if (articulosCambiados.length > 0) {
      postGasBatch('articulo', articulosCambiados).then((ok) => {
        if (!ok) articulosCambiados.forEach((a) => postGasAction('guardarArticulo', a))
      })
    }
  }

  // Función de sincronización con Google Sheets (trae lo último cargado en Sheets)
  const sincronizarConSheets = async (): Promise<{
    ok: boolean
    mensaje: string
    count?: Record<string, number>
  }> => {
    setSincronizando(true)
    try {
      const data = await fetchGasBootstrap()
      if (!data) {
        return {
          ok: false,
          mensaje:
            'No se pudo conectar con Google Sheets. Verificá la URL en Ajustes o que la Web App esté activa.',
        }
      }

      const counts: Record<string, number> = {}

      // Dejamos ART-/ENC- consecutivos también en los datos que ya existían en
      // la hoja (huecos por borrados viejos o códigos con otro relleno).
      const artsBase = Array.isArray(data.articulos) ? data.articulos : articulos
      const encsBase = Array.isArray(data.encimadas) ? data.encimadas : encimadas
      const normalizado = normalizarCodigos(artsBase, encsBase)

      if (Array.isArray(data.articulos)) {
        setArticulos(normalizado.articulos)
        counts.articulos = normalizado.articulos.length
      }
      if (Array.isArray(data.cortes)) {
        setCortes(data.cortes)
        counts.cortes = data.cortes.length
      }
      if (Array.isArray(data.encimadas)) {
        setEncimadas(normalizado.encimadas)
        counts.encimadas = normalizado.encimadas.length
      }
      if (Array.isArray(data.pagos)) {
        setPagos(data.pagos)
        counts.pagos = data.pagos.length
      }
      if (Array.isArray(data.compras)) {
        setCompras(data.compras)
        counts.compras = data.compras.length
      }
      if (Array.isArray(data.talleres)) {
        setTalleres(data.talleres)
        counts.talleres = data.talleres.length
      }
      if (Array.isArray(data.proveedores)) {
        setProveedores(data.proveedores)
        counts.proveedores = data.proveedores.length
      }

      // Persistimos solo los códigos que la normalización tuvo que corregir.
      persistirCodigos(normalizado)

      saveStoreData({
        articulos: normalizado.articulos,
        cortes: data.cortes || cortes,
        encimadas: normalizado.encimadas,
        pagos: data.pagos || pagos,
        compras: data.compras || compras,
        talleres: data.talleres || talleres,
        proveedores: data.proveedores || proveedores,
      })

      const now = new Date()
      setUltimoSync(now)

      return {
        ok: true,
        mensaje: `Sincronización completada: ${counts.articulos ?? 0} artículos, ${counts.compras ?? 0} compras, ${counts.talleres ?? 0} talleres y ${counts.cortes ?? 0} cortes cargados desde Google Sheets.`,
        count: counts,
      }
    } catch (err: any) {
      return {
        ok: false,
        mensaje: `Error al sincronizar con Google Sheets: ${err.message || err}`,
      }
    } finally {
      setSincronizando(false)
    }
  }

  // Carga inicial silenciosa desde Google Sheets si está disponible
  useEffect(() => {
    fetchGasBootstrap().then((data) => {
      if (!data) return
      if (Array.isArray(data.articulos) && data.articulos.length > 0) {
        setArticulos(data.articulos)
      }
      if (Array.isArray(data.cortes) && data.cortes.length > 0) {
        setCortes(data.cortes)
      }
      if (Array.isArray(data.encimadas) && data.encimadas.length > 0) {
        setEncimadas(data.encimadas)
      }
      if (Array.isArray(data.pagos) && data.pagos.length > 0) {
        setPagos(data.pagos)
      }
      if (Array.isArray(data.compras) && data.compras.length > 0) {
        setCompras(data.compras)
      }
      if (Array.isArray(data.talleres) && data.talleres.length > 0) {
        setTalleres(data.talleres)
      }
      if (Array.isArray(data.proveedores) && data.proveedores.length > 0) {
        setProveedores(data.proveedores)
      }
      setUltimoSync(new Date())
    })
  }, [])

  const resetearADemo = () => {
    setArticulos(mockArticulos)
    setCompras(mockCompras)
    setTalleres(mockTalleres)
    setProveedores(mockProveedores)
    setCortes(mockCortes)
    setEncimadas(mockEncimadas)
    setPagos(mockPagos)
    if (typeof window !== 'undefined') {
      localStorage.removeItem(STORAGE_KEY)
    }
  }

  const limpiarTodo = () => {
    setArticulos([])
    setCompras([])
    setTalleres([])
    setProveedores([])
    setCortes([])
    setEncimadas([])
    setPagos([])
    if (typeof window !== 'undefined') {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({
          articulos: [],
          compras: [],
          talleres: [],
          proveedores: [],
          cortes: [],
          encimadas: [],
          pagos: [],
        }),
      )
    }
  }

  const addCompra = (compra: Compra) => {
    setCompras((prev) => [compra, ...prev])
    postGasAction('guardarCompra', compra)
  }

  const addProveedor = (proveedor: Proveedor) => {
    const nombre = proveedor.nombre.trim()
    if (!nombre) return
    const existente = proveedores.find(
      (item) => item.nombre.trim().toLowerCase() === nombre.toLowerCase(),
    )
    if (existente) return

    const nuevo = { ...proveedor, nombre }
    setProveedores((prev) => [...prev, nuevo])
    postGasAction('guardarProveedor', nuevo)
  }

  const addArticulo = (articulo: Articulo) => {
    const corteId = `corte-${Date.now()}`
    const articuloConCorte = { ...articulo, corteId }

    setArticulos((prev) => [articuloConCorte, ...prev])
    postGasAction('guardarArticulo', articuloConCorte)

    // Generar automáticamente el nuevo corte asignado al taller en estado PREPARADO
    setCortes((prev) => {
      const seq = nextCorteSeq(prev)
      const ancho = anchoCodigo('C', prev.map((c) => c.codigo))
      const codigoCorte = `C-${String(seq).padStart(ancho, '0')}`
      const fechaHoy = new Date().toISOString().slice(0, 10)
      const fechaEntrega = new Date(Date.now() + 7 * 24 * 3600 * 1000).toISOString().slice(0, 10)

      const nuevoCorte: Corte = {
        id: corteId,
        codigo: codigoCorte,
        fecha: fechaHoy,
        fechaEntregaPrometida: fechaEntrega,
        modeloId: articulo.id,
        modeloNombre: articulo.nombre,
        tallerId: articulo.tallerId || '',
        tallerNombre: articulo.tallerNombre || 'Sin asignar',
        cantidadPrendas: articulo.cantidadPrendas,
        precioPorPrenda: articulo.manoObra,
        telasUsadas: (articulo.telas || []).map((t, idx) => ({
          id: `tuc-${Date.now()}-${idx}`,
          telaId: t.stockKey || `tel-${idx}`,
          telaNombre: t.telaNombre,
          colorId: t.colorNombre,
          colorNombre: t.colorNombre,
          loteId: t.loteId,
          rollosUsados: t.rollosUsados,
          cantidadUsada: t.cantidadUsar,
          unidad: t.unidad,
        })),
        seguimiento: {
          enviadas: articulo.cantidadPrendas,
          entregadas: 0,
          falladas: 0,
        },
        estado: 'PREPARADO',
        costoTela: articulo.costoTelaTotalUsado,
        costoManoObra: articulo.manoObra * articulo.cantidadPrendas,
        costoTotal: articulo.costoTotalProduccion,
        costoPorPrenda: articulo.costoUnitario,
      }

      postGasAction('guardarCorte', nuevoCorte)
      return [nuevoCorte, ...prev]
    })
  }

  const updateArticulo = (articulo: Articulo) => {
    setArticulos((prev) => prev.map((a) => (a.id === articulo.id ? articulo : a)))
    postGasAction('guardarArticulo', articulo)

    // Mantener sincronizado el corte correspondiente si existe
    setCortes((prev) =>
      prev.map((c) => {
        if (c.id === articulo.corteId || c.modeloId === articulo.id) {
          const corteActualizado = {
            ...c,
            modeloNombre: articulo.nombre,
            tallerId: articulo.tallerId || c.tallerId,
            tallerNombre: articulo.tallerNombre || c.tallerNombre,
            cantidadPrendas: articulo.cantidadPrendas,
            precioPorPrenda: articulo.manoObra,
            costoTela: articulo.costoTelaTotalUsado,
            costoManoObra: articulo.manoObra * articulo.cantidadPrendas,
            costoTotal: articulo.costoTotalProduccion,
            costoPorPrenda: articulo.costoUnitario,
          }
          postGasAction('guardarCorte', corteActualizado)
          return corteActualizado
        }
        return c
      }),
    )
  }

  const deleteArticulo = (articuloId: string) => {
    const restantes = articulos.filter((articulo) => articulo.id !== articuloId)
    const normalizado = normalizarCodigos(restantes, encimadas)
    setArticulos(normalizado.articulos)
    setEncimadas(normalizado.encimadas)
    postGasAction('eliminarArticulo', { id: articuloId })
    // Numeración consecutiva: al borrar, los códigos posteriores bajan uno.
    persistirCodigos(normalizado)
  }

  const addCorte = (corte: Corte) => {
    setCortes((prev) => [corte, ...prev])
    postGasAction('guardarCorte', corte)
  }

  const updateCorte = (corte: Corte) => {
    setCortes((prev) => prev.map((c) => (c.id === corte.id ? corte : c)))
    postGasAction('guardarCorte', corte)
  }

  const changeEstadoCorte = (corteId: string, nuevoEstado: EstadoCorte) => {
    setCortes((prev) =>
      prev.map((c) => (c.id === corteId ? { ...c, estado: nuevoEstado } : c)),
    )
    postGasAction('actualizarEstadoCorte', { id: corteId, nuevoEstado })
  }

  const assignTallerCorte = (
    corteId: string,
    tallerId: string,
    tallerNombre: string,
    precioPorPrenda?: number,
  ) => {
    setCortes((prev) =>
      prev.map((c) => {
        if (c.id === corteId) {
          const precio = typeof precioPorPrenda === 'number' ? precioPorPrenda : c.precioPorPrenda
          const costoManoObra = precio * c.cantidadPrendas
          const costoTotal = (c.costoTela || 0) + costoManoObra
          const actualizado = {
            ...c,
            tallerId,
            tallerNombre,
            precioPorPrenda: precio,
            costoManoObra,
            costoTotal,
            costoPorPrenda: c.cantidadPrendas > 0 ? costoTotal / c.cantidadPrendas : 0,
          }
          postGasAction('guardarCorte', actualizado)
          return actualizado
        }
        return c
      }),
    )

    setArticulos((prev) =>
      prev.map((a) => {
        if (a.corteId === corteId) {
          const actualizado = {
            ...a,
            tallerId,
            tallerNombre,
          }
          postGasAction('guardarArticulo', actualizado)
          return actualizado
        }
        return a
      }),
    )
  }

  const addPagoTaller = (pago: PagoTaller) => {
    setPagos((prev) => [pago, ...prev])
    postGasAction('guardarPago', pago)
  }

  const deletePagoTaller = (pagoId: string) => {
    setPagos((prev) => prev.filter((pago) => pago.id !== pagoId))
  }

  const hidratarDatos = (datos: {
    articulos?: Articulo[]
    cortes?: Corte[]
    encimadas?: Encimada[]
    pagos?: PagoTaller[]
    compras?: Compra[]
    talleres?: Taller[]
    proveedores?: Proveedor[]
  }) => {
    if (datos.articulos) setArticulos(datos.articulos)
    if (datos.cortes) setCortes(datos.cortes)
    if (datos.encimadas) setEncimadas(datos.encimadas)
    if (datos.pagos) setPagos(datos.pagos)
    if (datos.compras) setCompras(datos.compras)
    if (datos.talleres) setTalleres(datos.talleres)
    if (datos.proveedores) setProveedores(datos.proveedores)
  }

  const saveEncimada = (encimada: Encimada) => {
    setEncimadas((prev) =>
      prev.some((e) => e.id === encimada.id)
        ? prev.map((e) => (e.id === encimada.id ? encimada : e))
        : [encimada, ...prev],
    )
    postGasAction('guardarEncimada', encimada)

    // Los artículos que se generan/actualizan desde la encimada también se
    // persisten en Sheets; si no, al sincronizar desaparecen o quedan con
    // IDs huérfanos respecto de la encimada.
    const next = [...articulos]
    let seq = nextArticuloSeq(next)
    const ancho = anchoCodigo('ART', next.map((a) => a.codigoArticulo))
    const articulosAfectados: Articulo[] = []

    for (const item of encimada.items) {
      if (!item.modeloNombre.trim() || item.cantidad <= 0) continue
      const idx = next.findIndex(
        (a) => a.encimadaId === encimada.id && a.encimadaItemId === item.id,
      )
      const existente = idx >= 0 ? next[idx] : undefined
      const codigo = existente?.codigoArticulo ?? `ART-${String(seq).padStart(ancho, '0')}`
      const articulo = articuloDesdeItem(encimada, item, existente, codigo)
      articulosAfectados.push(articulo)
      if (idx >= 0) {
        next[idx] = articulo
      } else {
        next.unshift(articulo)
        seq += 1
      }
    }

    setArticulos(next)
    articulosAfectados.forEach((articulo) => {
      postGasAction('guardarArticulo', articulo)
    })
  }

  const deleteEncimada = (encimadaId: string) => {
    const restantes = encimadas.filter((e) => e.id !== encimadaId)
    const normalizado = normalizarCodigos(articulos, restantes)
    setEncimadas(normalizado.encimadas)
    setArticulos(normalizado.articulos)
    postGasAction('eliminarEncimada', { id: encimadaId })
    // Numeración consecutiva: al borrar, las encimadas posteriores bajan uno.
    persistirCodigos(normalizado)
  }

  return (
    <ErpStoreContext.Provider
      value={{
        articulos,
        encimadas,
        cortes,
        pagos,
        compras,
        talleres,
        proveedores,
        addCompra,
        addProveedor,
        addArticulo,
        updateArticulo,
        deleteArticulo,
        saveEncimada,
        deleteEncimada,
        addCorte,
        updateCorte,
        changeEstadoCorte,
        assignTallerCorte,
        addPagoTaller,
        deletePagoTaller,
        resetearADemo,
        limpiarTodo,
        sincronizando,
        ultimoSync,
        sincronizarConSheets,
        hidratarDatos,
      }}
    >
      {children}
    </ErpStoreContext.Provider>
  )
}

export function useErpStore() {
  const ctx = useContext(ErpStoreContext)
  if (!ctx) throw new Error('useErpStore debe usarse dentro de ErpStoreProvider')
  return ctx
}
