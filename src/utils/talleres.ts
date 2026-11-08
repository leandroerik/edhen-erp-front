import type { Taller } from '../types'

export const COLOR_TALLER_DEFAULT = '#b45309'

export const PALETA_TALLER = [
  { nombre: 'Ámbar', valor: '#b45309' },
  { nombre: 'Azul', valor: '#2563eb' },
  { nombre: 'Verde', valor: '#059669' },
  { nombre: 'Violeta', valor: '#7c3aed' },
  { nombre: 'Rosa', valor: '#db2777' },
  { nombre: 'Rojo', valor: '#dc2626' },
  { nombre: 'Cian', valor: '#0891b2' },
  { nombre: 'Lima', valor: '#65a30d' },
  { nombre: 'Marrón', valor: '#92400e' },
  { nombre: 'Gris', valor: '#57534e' },
]

function hexARgb(hex: string) {
  const limpio = hex.replace('#', '')
  const completo =
    limpio.length === 3
      ? limpio
          .split('')
          .map((c) => c + c)
          .join('')
      : limpio
  const numero = parseInt(completo, 16)
  if (Number.isNaN(numero)) return { r: 180, g: 83, b: 9 }
  return {
    r: (numero >> 16) & 255,
    g: (numero >> 8) & 255,
    b: numero & 255,
  }
}

export function rgba(hex: string, alpha: number): string {
  const { r, g, b } = hexARgb(hex)
  return `rgba(${r}, ${g}, ${b}, ${alpha})`
}

export function colorDeTaller(color?: string): string {
  return /^#[0-9a-fA-F]{6}$/.test(color || '') ? (color as string) : COLOR_TALLER_DEFAULT
}

export function estiloTagTaller(color?: string) {
  const c = colorDeTaller(color)
  return {
    backgroundColor: rgba(c, 0.1),
    borderColor: rgba(c, 0.35),
    color: c,
  }
}

export function estiloTallerSeleccionado(color?: string) {
  const c = colorDeTaller(color)
  return {
    backgroundColor: rgba(c, 0.08),
    borderColor: rgba(c, 0.45),
    color: c,
  }
}

export function colorTallerAsignado(
  talleres: Taller[],
  tallerId?: string,
  tallerNombre?: string,
): string | undefined {
  if (tallerId && tallerId !== 'sin-taller') {
    const taller = talleres.find((t) => t.id === tallerId)
    if (taller?.color) return taller.color
  }
  if (tallerNombre) {
    const taller = talleres.find((t) => t.nombre === tallerNombre)
    if (taller?.color) return taller.color
  }
  return undefined
}

export function linkWhatsApp(telefono?: string, mensaje?: string): string {
  const digitos = (telefono || '').replace(/\D/g, '')
  if (!digitos) return ''
  const texto = mensaje ? `?text=${encodeURIComponent(mensaje)}` : ''
  return `https://wa.me/${digitos}${texto}`
}
