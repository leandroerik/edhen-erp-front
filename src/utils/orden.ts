// Helpers de orden para las listas del ERP.
// Criterio único: lo más nuevo / de código más alto primero.

export function compararCodigoDesc(a: string, b: string) {
  return (b || '').localeCompare(a || '', 'es', { numeric: true, sensitivity: 'base' })
}

export function compararCodigoAsc(a: string, b: string) {
  return (a || '').localeCompare(b || '', 'es', { numeric: true, sensitivity: 'base' })
}

export function ordenarPorCodigoDesc<T>(
  items: T[],
  codigo: (item: T) => string | undefined,
): T[] {
  return [...items].sort((a, b) =>
    compararCodigoDesc(codigo(a) ?? '', codigo(b) ?? ''),
  )
}

export function ordenarPorFechaYCodigoDesc<T>(
  items: T[],
  fecha: (item: T) => string | undefined,
  codigo: (item: T) => string | undefined,
): T[] {
  return [...items].sort((a, b) => {
    const cmpFecha = (fecha(b) ?? '').localeCompare(fecha(a) ?? '')
    if (cmpFecha !== 0) return cmpFecha
    return compararCodigoDesc(codigo(a) ?? '', codigo(b) ?? '')
  })
}
