import { useState, useEffect, useRef } from 'react'
import { Button } from '../../../shared/components/Button'
import { ConfirmModal } from '../../../shared/components/ConfirmModal'
import {
  getGasUrl,
  setGasUrl,
  resetGasUrl,
  testGasConnection,
  type ConnectionTestResult,
  DEFAULT_GAS_URL,
} from '../../../api/gasClient'
import { useErpStore } from '../../../data/erpStore'

export function AjustesPage() {
  const {
    articulos,
    cortes,
    encimadas,
    pagos,
    compras,
    talleres,
    hidratarDatos,
    resetearADemo,
    limpiarTodo,
    sincronizando,
    ultimoSync,
    sincronizarConSheets,
  } = useErpStore()

  const [url, setUrl] = useState('')
  const [testing, setTesting] = useState(false)
  const [testResult, setTestResult] = useState<ConnectionTestResult | null>(null)
  const [guardadoMsg, setGuardadoMsg] = useState(false)
  const [syncResultMsg, setSyncResultMsg] = useState<{ ok: boolean; text: string } | null>(null)
  const [confirmAction, setConfirmAction] = useState<'limpiar' | 'demo' | null>(null)

  // Mensajes de Backup
  const [backupMsg, setBackupMsg] = useState<string | null>(null)
  const [backupError, setBackupError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement | null>(null)

  useEffect(() => {
    setUrl(getGasUrl())
  }, [])

  const handleProbarConexion = async (targetUrl?: string) => {
    setTesting(true)
    setTestResult(null)
    try {
      const res = await testGasConnection(targetUrl || url)
      setTestResult(res)
    } finally {
      setTesting(false)
    }
  }

  const handleGuardar = () => {
    setGasUrl(url)
    setGuardadoMsg(true)
    setTimeout(() => setGuardadoMsg(false), 3000)
    handleProbarConexion(url)
  }

  const handleRestablecer = () => {
    resetGasUrl()
    setUrl(DEFAULT_GAS_URL)
    setGuardadoMsg(true)
    setTimeout(() => setGuardadoMsg(false), 3000)
    handleProbarConexion(DEFAULT_GAS_URL)
  }

  const handleSincronizarManual = async () => {
    setSyncResultMsg(null)
    const res = await sincronizarConSheets()
    setSyncResultMsg({ ok: res.ok, text: res.mensaje })
  }

  // 1. GUARDAR BACKUP (Descargar JSON)
  const handleGuardarBackup = () => {
    try {
      const now = new Date()
      const fechaStr = now.toISOString().slice(0, 10)
      const horaStr = now.toTimeString().slice(0, 5).replace(':', '-')

      const backupData = {
        sistema: 'EDHEN ERP',
        version: '1.0',
        fechaExportacion: now.toISOString(),
        resumen: {
          articulos: articulos.length,
          compras: compras.length,
          talleres: talleres.length,
          cortes: cortes.length,
          encimadas: encimadas.length,
          pagos: pagos.length,
        },
        data: {
          articulos,
          compras,
          talleres,
          cortes,
          encimadas,
          pagos,
        },
      }

      const jsonStr = JSON.stringify(backupData, null, 2)
      const blob = new Blob([jsonStr], { type: 'application/json' })
      const downloadUrl = URL.createObjectURL(blob)

      const a = document.createElement('a')
      a.href = downloadUrl
      a.download = `backup-edhen-erp-${fechaStr}_${horaStr}.json`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(downloadUrl)

      setBackupMsg(
        `✓ Copia de seguridad descargada correctamente (backup-edhen-erp-${fechaStr}_${horaStr}.json).`,
      )
      setBackupError(null)
    } catch (err: any) {
      setBackupError(`Error al generar el archivo de backup: ${err.message || err}`)
      setBackupMsg(null)
    }
  }

  // 2. CARGAR BACKUP (Restaurar desde archivo JSON)
  const handleCargarBackup = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (event) => {
      try {
        const text = event.target?.result as string
        const parsed = JSON.parse(text)
        const d = parsed.data || parsed

        if (!d || typeof d !== 'object') {
          throw new Error('El archivo seleccionado no tiene una estructura de backup válida.')
        }

        const cantArticulos = Array.isArray(d.articulos) ? d.articulos.length : 0
        const cantCompras = Array.isArray(d.compras) ? d.compras.length : 0
        const cantTalleres = Array.isArray(d.talleres) ? d.talleres.length : 0
        const cantCortes = Array.isArray(d.cortes) ? d.cortes.length : 0
        const cantEncimadas = Array.isArray(d.encimadas) ? d.encimadas.length : 0
        const cantPagos = Array.isArray(d.pagos) ? d.pagos.length : 0

        const confirmacion = window.confirm(
          `¿Deseás restaurar los datos desde "${file.name}"?\n\n` +
            `• Artículos: ${cantArticulos}\n` +
            `• Compras / Telas: ${cantCompras}\n` +
            `• Talleres: ${cantTalleres}\n` +
            `• Cortes: ${cantCortes}\n` +
            `• Encimadas: ${cantEncimadas}\n` +
            `• Pagos: ${cantPagos}\n\n` +
            `Esta acción reemplazará los datos actuales del sistema por los de este archivo.`,
        )
        if (!confirmacion) return

        hidratarDatos({
          articulos: Array.isArray(d.articulos) ? d.articulos : [],
          compras: Array.isArray(d.compras) ? d.compras : [],
          talleres: Array.isArray(d.talleres) ? d.talleres : [],
          cortes: Array.isArray(d.cortes) ? d.cortes : [],
          encimadas: Array.isArray(d.encimadas) ? d.encimadas : [],
          pagos: Array.isArray(d.pagos) ? d.pagos : [],
        })

        setBackupMsg(
          `✓ Backup restaurado desde "${file.name}": ${cantArticulos} artículos, ${cantCompras} compras, ${cantTalleres} talleres y ${cantCortes} cortes.`,
        )
        setBackupError(null)
      } catch (err: any) {
        setBackupError(`Error al leer el archivo de backup: ${err.message || err}`)
        setBackupMsg(null)
      } finally {
        if (fileInputRef.current) {
          fileInputRef.current.value = ''
        }
      }
    }
    reader.onerror = () => {
      setBackupError('No se pudo leer el archivo seleccionado.')
      setBackupMsg(null)
    }
    reader.readAsText(file)
  }

  // 3. LIMPIAR DATOS PARA CARGAR A MANO DE CERO
  const ejecutarLimpiarTodo = () => {
    limpiarTodo()
    setConfirmAction(null)
    setBackupMsg('✓ Sistema reiniciado. Todos los módulos quedaron en blanco listos para cargar datos a mano.')
    setBackupError(null)
  }

  // 4. RESTABLECER A DEMO
  const ejecutarResetDemo = () => {
    resetearADemo()
    setConfirmAction(null)
    setBackupMsg('✓ Datos restablecidos a la versión demo.')
    setBackupError(null)
  }

  const contadores = [
    { label: 'Artículos', valor: articulos.length },
    { label: 'Compras', valor: compras.length },
    { label: 'Talleres', valor: talleres.length },
    { label: 'Cortes', valor: cortes.length },
    { label: 'Encimadas', valor: encimadas.length },
    { label: 'Pagos', valor: pagos.length },
  ]

  return (
    <div className="mx-auto max-w-3xl space-y-5">
      {/* Cabecera */}
      <div>
        <h1 className="text-xl font-semibold text-stone-900 sm:text-2xl">Ajustes</h1>
        <p className="mt-1 text-xs text-stone-500 sm:text-sm">
          Conexión con Google Sheets, copias de seguridad y datos del sistema.
        </p>
      </div>

      {/* Google Sheets */}
      <section className="rounded-xl border border-stone-200 bg-white p-4 shadow-xs sm:p-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex items-start gap-2">
            <span className="text-lg leading-none">🔄</span>
            <div>
              <h2 className="text-sm font-semibold text-stone-900">Google Sheets</h2>
              <p className="mt-0.5 text-[11px] text-stone-500">
                {ultimoSync
                  ? `Última sincronización: ${ultimoSync.toLocaleTimeString()} · ${ultimoSync.toLocaleDateString()}`
                  : 'Sin sincronizar en esta sesión'}
              </p>
            </div>
          </div>
          <Button
            size="sm"
            onClick={handleSincronizarManual}
            disabled={sincronizando || !url}
            className="shrink-0 bg-emerald-700 hover:bg-emerald-800"
          >
            {sincronizando ? 'Sincronizando...' : 'Sincronizar ahora'}
          </Button>
        </div>

        {syncResultMsg && (
          <div
            className={`mt-3 rounded-lg border p-2.5 text-xs font-medium ${
              syncResultMsg.ok
                ? 'border-emerald-300 bg-emerald-50 text-emerald-900'
                : 'border-red-300 bg-red-50 text-red-900'
            }`}
          >
            {syncResultMsg.ok ? '✓ ' : '✕ '}
            {syncResultMsg.text}
          </div>
        )}

        {/* Configuración avanzada */}
        <details className="group mt-4 border-t border-stone-100 pt-3">
          <summary className="flex cursor-pointer list-none items-center justify-between gap-2 text-xs font-medium text-stone-600 transition-colors hover:text-stone-900">
            <span>Configurar URL de conexión</span>
            <span className="text-stone-400 transition-transform group-open:rotate-180">▾</span>
          </summary>

          <div className="mt-3 space-y-3">
            <div className="flex flex-col gap-2 sm:flex-row">
              <input
                type="text"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                className="flex-1 rounded-md border border-stone-300 bg-white px-3 py-2 text-xs font-mono text-stone-900 focus:border-amber-600 focus:outline-none"
                placeholder="https://script.google.com/macros/s/.../exec"
              />
              <div className="flex items-center gap-2">
                <Button size="sm" onClick={handleGuardar}>
                  Guardar
                </Button>
                <Button
                  size="sm"
                  variant="secondary"
                  disabled={testing}
                  onClick={() => handleProbarConexion()}
                >
                  {testing ? 'Probando...' : 'Probar'}
                </Button>
              </div>
            </div>

            {guardadoMsg && (
              <p className="text-xs font-medium text-emerald-700">✓ URL guardada en este navegador.</p>
            )}

            {testResult && (
              <div
                className={`rounded-lg border p-3 text-xs ${
                  testResult.ok
                    ? 'border-emerald-200 bg-emerald-50/70 text-emerald-900'
                    : 'border-red-200 bg-red-50 text-red-900'
                }`}
              >
                <div className="flex flex-wrap items-center justify-between gap-1">
                  <span className="font-semibold">
                    {testResult.ok
                      ? `✓ Conectado · ${testResult.latencyMs} ms`
                      : '✕ Error de conexión'}
                  </span>
                  {testResult.ok && (
                    <span className="rounded bg-emerald-100 px-1.5 py-0.5 text-[10px] font-medium text-emerald-800">
                      Online
                    </span>
                  )}
                </div>

                {testResult.error ? (
                  <p className="mt-1.5 text-red-700">{testResult.error}</p>
                ) : (
                  <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-[11px] text-stone-600">
                    <span>{testResult.dataCount?.articulos ?? 0} artículos</span>
                    <span>{testResult.dataCount?.compras ?? 0} compras</span>
                    <span>{testResult.dataCount?.cortes ?? 0} cortes</span>
                    <span>{testResult.dataCount?.encimadas ?? 0} encimadas</span>
                    <span>{testResult.dataCount?.talleres ?? 0} talleres</span>
                    <span>{testResult.dataCount?.pagos ?? 0} pagos</span>
                  </div>
                )}
              </div>
            )}

            <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] text-stone-500">
              <span>La URL se guarda solo en este navegador.</span>
              <button
                type="button"
                onClick={handleRestablecer}
                className="font-medium text-amber-800 hover:underline"
              >
                Restablecer URL predeterminada
              </button>
            </div>
          </div>
        </details>
      </section>

      {/* Copias de seguridad */}
      <section className="rounded-xl border border-stone-200 bg-white p-4 shadow-xs sm:p-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex items-start gap-2">
            <span className="text-lg leading-none">💾</span>
            <div>
              <h2 className="text-sm font-semibold text-stone-900">Copias de seguridad</h2>
              <p className="mt-0.5 max-w-md text-[11px] text-stone-500">
                Descargá todos los datos en un JSON o restaurálos desde un archivo.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Button
              size="sm"
              onClick={handleGuardarBackup}
              className="bg-stone-900 hover:bg-stone-800"
            >
              ⬇️ Descargar backup
            </Button>

            <input
              ref={fileInputRef}
              type="file"
              accept=".json,application/json"
              onChange={handleCargarBackup}
              className="hidden"
            />
            <Button
              size="sm"
              variant="secondary"
              onClick={() => fileInputRef.current?.click()}
            >
              ⬆️ Restaurar
            </Button>
          </div>
        </div>

        {/* Estado actual */}
        <div className="mt-4 flex flex-wrap gap-x-4 gap-y-1.5 rounded-lg bg-stone-50 px-3 py-2 text-[11px] text-stone-500">
          {contadores.map((c) => (
            <span key={c.label}>
              <strong className="text-stone-800">{c.valor}</strong> {c.label.toLowerCase()}
            </span>
          ))}
        </div>

        {backupMsg && (
          <div className="mt-3 rounded-lg border border-emerald-300 bg-emerald-50 p-2.5 text-xs font-medium text-emerald-900">
            {backupMsg}
          </div>
        )}

        {backupError && (
          <div className="mt-3 rounded-lg border border-red-300 bg-red-50 p-2.5 text-xs font-medium text-red-900">
            {backupError}
          </div>
        )}

        <div className="mt-4 flex flex-wrap items-center justify-between gap-2 border-t border-stone-100 pt-3 text-[11px] text-stone-500">
          <span>Zona de riesgo</span>
          <div className="flex flex-wrap items-center gap-4">
            <button
              type="button"
              onClick={() => setConfirmAction('limpiar')}
              className="text-stone-600 underline transition-colors hover:text-red-700"
            >
              Vaciar sistema
            </button>
            <button
              type="button"
              onClick={() => setConfirmAction('demo')}
              className="text-amber-800 transition-colors hover:underline"
            >
              Restablecer demo
            </button>
          </div>
        </div>
      </section>

      {confirmAction === 'limpiar' && (
        <ConfirmModal
          title="Vaciar sistema"
          description={
            <>
              Se eliminarán todos los datos cargados en este navegador: artículos, compras,
              cortes, encimadas, talleres y pagos. Te recomendamos descargar un backup antes de
              continuar.
            </>
          }
          confirmLabel="Vaciar sistema"
          onConfirm={ejecutarLimpiarTodo}
          onClose={() => setConfirmAction(null)}
        />
      )}

      {confirmAction === 'demo' && (
        <ConfirmModal
          title="Restablecer demo"
          description={
            <>
              Se reemplazarán los datos actuales por los datos de ejemplo (demo). Todo lo que
              hayas cargado a mano se perderá.
            </>
          }
          confirmLabel="Restablecer demo"
          onConfirm={ejecutarResetDemo}
          onClose={() => setConfirmAction(null)}
        />
      )}
    </div>
  )
}
