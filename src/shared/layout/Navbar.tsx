import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useErpStore } from '../../data/erpStore'

interface Props {
  onOpenMobileMenu?: () => void
}

export function Navbar({ onOpenMobileMenu }: Props) {
  const { sincronizando, sincronizarConSheets } = useErpStore()
  const [syncFeedback, setSyncFeedback] = useState<string | null>(null)

  const handleSync = async () => {
    const res = await sincronizarConSheets()
    if (res.ok) {
      setSyncFeedback('✓ Listo')
    } else {
      setSyncFeedback('✕ Error')
    }
    setTimeout(() => setSyncFeedback(null), 3000)
  }

  return (
    <header className="flex h-14 shrink-0 items-center justify-between border-b border-stone-200 bg-white px-3 sm:px-6">
      <div className="flex items-center gap-3">
        {onOpenMobileMenu && (
          <button
            type="button"
            onClick={onOpenMobileMenu}
            className="flex h-9 w-9 items-center justify-center rounded-md border border-stone-200 text-stone-600 hover:bg-stone-50 md:hidden"
            aria-label="Abrir menú"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
        )}
        <span className="text-sm font-medium text-stone-700">Edhen ERP</span>
      </div>

      <div className="flex items-center gap-2">
        {/* Botón de Sincronización Rápida con Google Sheets */}
        <button
          type="button"
          disabled={sincronizando}
          onClick={handleSync}
          className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 border border-emerald-300 px-3 py-1 text-[11px] font-semibold text-emerald-800 hover:bg-emerald-100 transition-all shadow-2xs active:scale-95 disabled:opacity-50 cursor-pointer"
          title="Sincronizar cambios cargados en Google Sheets"
        >
          <span className={`inline-block text-[12px] ${sincronizando ? 'animate-spin' : ''}`}>
            🔄
          </span>
          <span>
            {sincronizando
              ? 'Sincronizando...'
              : syncFeedback || 'Sincronizar Sheets'}
          </span>
        </button>

        <Link
          to="/ajustes"
          className="inline-flex items-center gap-1.5 rounded-full bg-stone-50 border border-stone-200 px-2.5 py-1 text-[11px] font-medium text-stone-600 hover:bg-stone-100 transition-colors"
          title="Ver ajustes y conexión con Google Sheets"
        >
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-600 animate-pulse" />
          Ajustes
        </Link>
      </div>
    </header>
  )
}
