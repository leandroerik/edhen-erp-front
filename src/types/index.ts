export type UnidadTela = 'METRO' | 'KILO'

export type EstadoCorte = 'PREPARADO' | 'EN_TALLER' | 'ENTREGADO' | 'PAGADO'
export type TipoMovimientoStock = 'COMPRA' | 'CORTE_USO' | 'AJUSTE_SOBRANTE' | 'DEVOLUCION'

export interface Proveedor {
  id: string
  nombre: string
}

export interface Tela {
  id: string
  nombre: string
  unidadCompra: UnidadTela
  equivKgAMetro?: number // ej. 1 kg = 3,22 m
}

export interface Color {
  id: string
  nombre: string
}

export interface LoteColor {
  id: string
  colorId: string
  colorNombre: string
  rollos: number
  cantidad: number // en unidad de compra
  subtotal: number
}

export interface Compra {
  id: string
  codigo: string // COMP-0001
  fecha: string // ISO o dd/mm/aaaa
  proveedorId: string
  proveedorNombre: string
  telaId: string
  telaNombre: string
  unidadCompra: UnidadTela
  precioUnitario: number
  lotes: LoteColor[]
  descuento?: number
  flete?: number
  iva?: number
  notaRemito?: string
  total: number
  usada: boolean
}

export interface Taller {
  id: string
  nombre: string
  telefono: string
  direccion?: string
  especialidad?: string
  nota?: string
  precioPorPrendaPorModelo: Record<string, number> // modeloId -> precio pactado
}

export interface Avio {
  id: string
  nombre: string
  monto: number
}

export interface Modelo {
  id: string
  nombre: string
  talles: string[]
  consumoEstandar: number
  unidadConsumo: UnidadTela
  precioVenta: number
  avios: Avio[]
  costoTelaEstimado?: number
  costoManoObraEstimado?: number
  costoUnitario?: number
  gananciaUnitaria?: number
  margenPorc?: number
}

export interface TelaUsadaCorte {
  id: string
  telaId: string
  telaNombre: string
  colorId: string
  colorNombre: string
  loteId?: string
  rollosUsados: number
  cantidadUsada: number
  unidad: UnidadTela
}

export interface SeguimientoPrendas {
  enviadas: number
  entregadas: number
  falladas: number
}

export interface Corte {
  id: string
  codigo: string // C-0001
  fecha: string
  fechaEntregaPrometida: string
  modeloId: string
  modeloNombre: string
  tallerId: string
  tallerNombre: string
  cantidadPrendas: number
  precioPorPrenda: number
  telasUsadas: TelaUsadaCorte[]
  seguimiento: SeguimientoPrendas
  estado: EstadoCorte
  costoTela: number
  costoManoObra: number
  costoTotal: number
  costoPorPrenda: number
  atrasado?: boolean
}

export type EstadoEncimada = 'EN_CORTE' | 'CERRADA'

export interface CargaCapas {
  id: string
  telaId: string
  telaNombre: string
  colorId: string
  colorNombre: string
  unidad: UnidadTela
  capas: number
  rollosUsados: number
  cantidadUsada: number
  fechaHora: string
  nota?: string
}

export interface EncimadaItem {
  id: string
  modeloNombre: string
  cantidad: number
  porcentaje?: number // % de tela asignado a este modelo (por default ponderado por cantidad/talles)
}

export interface TelaUsadaEncimada {
  id: string
  stockKey: string
  loteId: string
  compraCodigo: string
  compraFecha: string
  proveedorNombre: string
  telaId: string
  telaNombre: string
  colorId: string
  colorNombre: string
  unidad: UnidadTela
  precioUnitario: number
  rollosDisponibles: number
  cantidadDisponible: number
  rollosUsados: number
  cantidadUsada: number
  costoUsado: number
}

export interface Encimada {
  id: string
  codigo: string
  fecha: string
  estado: EstadoEncimada
  largoCapa: number
  items: EncimadaItem[]
  cargas: CargaCapas[]
  telasUsadas: TelaUsadaEncimada[]
  notas?: string
}

export interface AvioArticulo extends Avio {
  porPrenda: boolean
}

export interface TelaArticulo {
  stockKey?: string
  loteId?: string
  compraCodigo?: string
  compraFecha?: string
  proveedorNombre?: string
  telaNombre: string
  colorNombre: string
  unidad: UnidadTela
  rollosUsados: number
  rollosDisponibles: number
  rollosLibres: number
  cantidadUsar: number
  cantidadLibre: number
  precioUnitario: number
  costoUsado: number
}

export interface Articulo {
  id: string
  codigoArticulo: string
  nombre: string
  descripcion: string
  cantidadPrendas: number
  telas: TelaArticulo[]
  costoTelaTotalUsado: number
  costoTelaPorPrenda: number
  manoObra: number
  avios: AvioArticulo[]
  aviosPorPrenda: number
  aviosTotales: number
  costoUnitario: number
  costoTotalProduccion: number
  margenGanancia: number
  precioSugerido: number
  precioVenta: number
  gananciaUnitaria: number
  gananciaTotal: number
  margenReal: number
  encimadaId?: string
  encimadaItemId?: string
  tallerId?: string
  tallerNombre?: string
  corteId?: string
}

export type TipoPagoTaller = 'ADELANTO' | 'PARCIAL' | 'FINAL'

export interface PagoTaller {
  id: string
  fecha: string
  tallerId: string
  tallerNombre: string
  corteId: string
  corteCodigo: string
  monto: number
  tipo: TipoPagoTaller
  concepto?: string
}

export interface MovimientoStock {
  id: string
  fecha: string
  tipo: TipoMovimientoStock
  telaId: string
  telaNombre: string
  colorId: string
  colorNombre: string
  loteId: string
  compraCodigo: string
  rollos: number // + - 
  cantidad: number // + - en unidad
  unidad: UnidadTela
  referencia?: string // C-0001 / COMP-0001
}

export interface StockColor {
  telaId: string
  telaNombre: string
  colorId: string
  colorNombre: string
  unidad: UnidadTela
  precioUnitario: number
  compradoRollos: number
  compradoCantidad: number
  usadoRollos: number
  usadoCantidad: number
  disponibleRollos: number
  disponibleCantidad: number
  lotesDetalle: Array<{
    loteId: string
    compraCodigo: string
    fechaCompra: string
    proveedorNombre: string
    precioUnitario: number
    rollos: number
    cantidad: number
    usadoRollos: number
    usadoCantidad: number
    sobrantesRollos?: number
    retazosNota?: string
  }>
}
