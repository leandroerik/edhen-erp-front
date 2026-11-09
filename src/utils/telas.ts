export interface TelaResumen {
  key: string
  telaNombre: string
}

export function telasUnicas(telas: Array<{ telaNombre?: string }>): TelaResumen[] {
  const mapa = new Map<string, TelaResumen>()

  for (const tela of telas) {
    const telaNombre = (tela.telaNombre || '').trim()
    if (!telaNombre) continue

    const key = telaNombre.toLowerCase()
    if (!mapa.has(key)) {
      mapa.set(key, { key, telaNombre })
    }
  }

  return Array.from(mapa.values())
}
