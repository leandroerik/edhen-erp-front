import { compararCodigoAsc } from './orden'

// Generación de códigos legibles (ART-01, C-0001, ENC-0001, COMP-0001).
// Se calcula el próximo número a partir del máximo existente, no del largo
// de la lista: así al eliminar registros no se repiten códigos.
//
// El ancho (cantidad de dígitos) se hereda de los códigos que ya existen:
// si la base usa ART-01..ART-38, el siguiente es ART-39 y no ART-0039.

function regexCodigo(prefijo: string) {
  const escapado = prefijo.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  return new RegExp(`^${escapado}-(\\d+)$`, 'i')
}

/**
 * Ancho de relleno a usar. Toma la cantidad de dígitos del código con el
 * número más bajo (la convención original) y cae a `porDefecto` si no hay.
 */
export function anchoCodigo(
  prefijo: string,
  codigos: Array<string | undefined>,
  porDefecto = 4,
): number {
  const regex = regexCodigo(prefijo)
  let menor: number | null = null
  let ancho = 0
  for (const codigo of codigos) {
    const match = regex.exec(String(codigo || '').trim())
    if (!match) continue
    const numero = Number(match[1])
    if (menor === null || numero < menor) {
      menor = numero
      ancho = match[1].length
    }
  }
  return menor === null ? porDefecto : ancho
}

export function siguienteCodigo(
  prefijo: string,
  codigos: Array<string | undefined>,
  digits?: number,
): string {
  const regex = regexCodigo(prefijo)
  const maximo = codigos.reduce((acc, codigo) => {
    const match = regex.exec(String(codigo || '').trim())
    return match ? Math.max(acc, Number(match[1])) : acc
  }, 0)
  const ancho = digits ?? anchoCodigo(prefijo, codigos)
  return `${prefijo}-${String(maximo + 1).padStart(ancho, '0')}`
}

export interface Renumerado<T> {
  items: T[]
  /** Registros cuyo código cambió (para volver a guardarlos). */
  cambiados: T[]
  /** Pares código anterior -> código nuevo. */
  mapaCodigos: Array<{ antes: string; despues: string }>
}

/**
 * Reasigna códigos 1..N en orden de creación para que no queden huecos.
 * Solo toca registros cuyo código ya respeta `PREFIJO-numero`; un código
 * con otro formato (ej. "CAM-01") se deja intacto.
 */
export function renumerarConsecutivos<T>(
  items: T[],
  prefijo: string,
  getCodigo: (item: T) => string | undefined,
  setCodigo: (item: T, codigo: string) => T,
  digits?: number,
): Renumerado<T> {
  const regex = regexCodigo(prefijo)
  const ancho = digits ?? anchoCodigo(prefijo, items.map(getCodigo))

  const orden = items
    .map((item, idx) => ({ idx, codigo: String(getCodigo(item) || '').trim() }))
    .filter((x) => regex.test(x.codigo))
    .sort((a, b) => compararCodigoAsc(a.codigo, b.codigo))

  const nuevoPorIndice = new Map<number, string>()
  orden.forEach((x, pos) => {
    nuevoPorIndice.set(x.idx, `${prefijo}-${String(pos + 1).padStart(ancho, '0')}`)
  })

  const cambiados: T[] = []
  const mapaCodigos: Renumerado<T>['mapaCodigos'] = []

  const nuevos = items.map((item, idx) => {
    const nuevo = nuevoPorIndice.get(idx)
    if (!nuevo) return item
    const antes = String(getCodigo(item) || '').trim()
    if (nuevo === antes) return item
    const actualizado = setCodigo(item, nuevo)
    cambiados.push(actualizado)
    mapaCodigos.push({ antes, despues: nuevo })
    return actualizado
  })

  return { items: nuevos, cambiados, mapaCodigos }
}
