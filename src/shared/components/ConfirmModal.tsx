import { useEffect, useState } from 'react'
import { Button } from './Button'

interface Props {
  title: string
  description: React.ReactNode
  confirmLabel: string
  confirmWord?: string
  onConfirm: () => void
  onClose: () => void
}

export function ConfirmModal({
  title,
  description,
  confirmLabel,
  confirmWord = 'eliminar',
  onConfirm,
  onClose,
}: Props) {
  const [texto, setTexto] = useState('')
  const habilitado = texto.trim().toLowerCase() === confirmWord.toLowerCase()

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  return (
    <div className="fixed inset-0 z-50 flex items-stretch justify-center bg-black/40 sm:items-center sm:p-4">
      <div className="flex h-[100dvh] w-full max-w-md flex-col bg-white shadow-2xl sm:h-auto sm:max-h-[92vh] sm:rounded-xl">
        {/* Cabecera */}
        <div className="flex items-start justify-between gap-2 border-b border-stone-200 px-4 py-3 sm:px-6 sm:py-4">
          <div className="flex items-start gap-2.5">
            <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-red-100 text-red-700">
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 9v4m0 4h.01M10.29 3.86l-8.3 14.36A1.5 1.5 0 003.28 20.5h17.44a1.5 1.5 0 001.29-2.28l-8.3-14.36a1.5 1.5 0 00-2.58 0z"
                />
              </svg>
            </span>
            <div>
              <h2 className="text-base font-semibold text-stone-900">{title}</h2>
              <p className="mt-0.5 text-xs text-stone-500">Esta acción no se puede deshacer.</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded text-stone-400 hover:bg-stone-100 hover:text-stone-700"
          >
            ✕
          </button>
        </div>

        {/* Cuerpo */}
        <div className="flex-1 space-y-4 overflow-y-auto p-4 sm:p-6">
          <div className="text-sm text-stone-600">{description}</div>

          <div>
            <label className="mb-1 block text-xs font-medium text-stone-500">
              Escribí <span className="font-semibold text-stone-800">{confirmWord}</span> para
              confirmar
            </label>
            <input
              autoFocus
              value={texto}
              onChange={(e) => setTexto(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && habilitado) onConfirm()
              }}
              className="h-9 w-full rounded-md border border-stone-300 bg-white px-3 text-sm text-stone-900 focus:border-red-600 focus:outline-none"
              placeholder={confirmWord}
              autoComplete="off"
              spellCheck={false}
            />
          </div>
        </div>

        {/* Acciones */}
        <div className="flex gap-2 border-t border-stone-200 p-3 sm:justify-end sm:p-4">
          <Button variant="secondary" className="flex-1 sm:flex-none" onClick={onClose}>
            Cancelar
          </Button>
          <Button
            variant="danger"
            className="flex-1 sm:flex-none"
            disabled={!habilitado}
            onClick={onConfirm}
          >
            {confirmLabel}
          </Button>
        </div>
      </div>
    </div>
  )
}
