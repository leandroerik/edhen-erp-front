import { useState, useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import { Button } from '../../../shared/components/Button'
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
          `✓ Backup restaurado con éxito desde "${file.name}". Se cargaron ${cantArticulos} artículos, ${cantCompras} compras, ${cantTalleres} talleres y ${cantCortes} cortes.`,
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
  const handleLimpiarTodo = () => {
    const confirmacion = window.confirm(
      '¿Deseás vaciar todos los datos para empezar a cargar tu catálogo a mano desde cero?\n\n' +
        'Te recomendamos hacer clic antes en "Guardar backup" para tener una copia de resguardo.',
    )
    if (!confirmacion) return
    limpiarTodo()
    setBackupMsg('✓ Sistema reiniciado. Todos los módulos quedaron en blanco listos para cargar datos a mano.')
    setBackupError(null)
  }

  // 4. RESTABLECER A DEMO
  const handleResetearDemo = () => {
    if (window.confirm('¿Deseás restaurar los datos de ejemplo iniciales (demo)?')) {
      resetearADemo()
      setBackupMsg('✓ Datos restablecidos a la versión demo.')
      setBackupError(null)
    }
  }

  return (
    <div className="max-w-4xl space-y-6">
      {/* Cabecera */}
      <div>
        <h1 className="text-2xl font-semibold text-stone-900">Ajustes del Sistema</h1>
        <p className="mt-1 text-sm text-stone-500">
          Sincronización con Google Sheets, copias de seguridad (backup/restauración) y preferencias del ERP.
        </p>
      </div>

      {/* BLOQUE DESTACADO: SINCRONIZACIÓN CON GOOGLE SHEETS */}
      <div className="rounded-xl border border-emerald-300 bg-linear-to-br from-emerald-50/70 via-white to-emerald-50/30 p-5 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-xl">🔄</span>
              <h2 className="text-base font-bold text-stone-900">
                Sincronización con Google Sheets
              </h2>
            </div>
            <p className="text-xs text-stone-600 max-w-xl leading-relaxed">
              Cada vez que cargues o edites filas manualmente en tu planilla de Google Sheets, hacé clic en{' '}
              <strong>"Sincronizar datos de Sheets"</strong> (aquí o desde el botón en la barra superior) para reflejar los cambios en el ERP en tiempo real.
            </p>
          </div>

          <Button
            onClick={handleSincronizarManual}
            disabled={sincronizando || !url}
            className="shrink-0 bg-emerald-700 hover:bg-emerald-800 text-white font-medium py-2.5 px-4 shadow-sm text-xs flex items-center gap-2"
          >
            <span className={`text-sm ${sincronizando ? 'animate-spin' : ''}`}>🔄</span>
            <span>{sincronizando ? 'Sincronizando...' : 'Sincronizar datos de Sheets'}</span>
          </Button>
        </div>

        {/* Feedback del resultado de sincronización */}
        {syncResultMsg && (
          <div
            className={`rounded-lg p-3 text-xs font-medium flex items-center gap-2 border ${
              syncResultMsg.ok
                ? 'bg-emerald-100/80 text-emerald-950 border-emerald-300'
                : 'bg-red-50 text-red-900 border-red-300'
            }`}
          >
            <span className="text-base">{syncResultMsg.ok ? '✓' : '✕'}</span>
            <span>{syncResultMsg.text}</span>
          </div>
        )}

        {/* Indicador de última sincronización */}
        <div className="flex flex-wrap items-center justify-between text-[11px] text-stone-500 border-t border-emerald-200/50 pt-2.5">
          <span>
            {ultimoSync ? (
              <>
                Última sincronización exitosa:{' '}
                <strong className="text-stone-700">
                  {ultimoSync.toLocaleTimeString()} ({ultimoSync.toLocaleDateString()})
                </strong>
              </>
            ) : (
              'Aún no se ha realizado ninguna sincronización en esta sesión.'
            )}
          </span>
          <span className="text-emerald-700 font-medium">
            💡 También podés sincronizar en 1 clic desde la barra superior en cualquier pantalla.
          </span>
        </div>
      </div>

      {/* BLOQUE DE COPIAS DE SEGURIDAD (BACKUP & RESTAURACIÓN) */}
      <div className="rounded-xl border border-stone-200 bg-white p-5 shadow-xs space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-xl">💾</span>
              <h2 className="text-base font-semibold text-stone-900">
                Copias de Seguridad (Backup Local)
              </h2>
            </div>
            <p className="text-xs text-stone-500 max-w-lg leading-relaxed">
              Descargá una copia completa de tus artículos, compras de telas, talleres, cortes y pagos para resguardar tus datos o migrarlos entre dispositivos en cualquier momento.
            </p>
          </div>

          {/* Botones principales de Backup */}
          <div className="flex flex-wrap items-center gap-2 shrink-0">
            {/* Botón Guardar Backup */}
            <Button
              onClick={handleGuardarBackup}
              className="bg-stone-900 hover:bg-stone-800 text-white font-medium py-2 px-4 shadow-xs text-xs flex items-center gap-1.5"
            >
              <span>⬇️</span> Guardar backup (Descargar JSON)
            </Button>

            {/* Botón Cargar Backup */}
            <input
              ref={fileInputRef}
              type="file"
              accept=".json,application/json"
              onChange={handleCargarBackup}
              className="hidden"
            />
            <Button
              variant="secondary"
              onClick={() => fileInputRef.current?.click()}
              className="text-xs py-2 px-3 border-stone-300 hover:bg-stone-50 flex items-center gap-1.5"
            >
              <span>⬆️</span> Cargar backup (Restaurar)
            </Button>
          </div>
        </div>

        {/* Resumen del estado actual en el sistema */}
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-6 border-t border-stone-100 pt-4">
          <div className="rounded-lg bg-stone-50 p-2.5 border border-stone-200/70 text-center">
            <div className="text-[11px] text-stone-500 font-medium">Artículos</div>
            <div className="text-lg font-bold text-stone-900">{articulos.length}</div>
          </div>
          <div className="rounded-lg bg-stone-50 p-2.5 border border-stone-200/70 text-center">
            <div className="text-[11px] text-stone-500 font-medium">Compras / Telas</div>
            <div className="text-lg font-bold text-stone-900">{compras.length}</div>
          </div>
          <div className="rounded-lg bg-stone-50 p-2.5 border border-stone-200/70 text-center">
            <div className="text-[11px] text-stone-500 font-medium">Talleres</div>
            <div className="text-lg font-bold text-stone-900">{talleres.length}</div>
          </div>
          <div className="rounded-lg bg-stone-50 p-2.5 border border-stone-200/70 text-center">
            <div className="text-[11px] text-stone-500 font-medium">Cortes</div>
            <div className="text-lg font-bold text-stone-900">{cortes.length}</div>
          </div>
          <div className="rounded-lg bg-stone-50 p-2.5 border border-stone-200/70 text-center">
            <div className="text-[11px] text-stone-500 font-medium">Encimadas</div>
            <div className="text-lg font-bold text-stone-900">{encimadas.length}</div>
          </div>
          <div className="rounded-lg bg-stone-50 p-2.5 border border-stone-200/70 text-center">
            <div className="text-[11px] text-stone-500 font-medium">Pagos</div>
            <div className="text-lg font-bold text-stone-900">{pagos.length}</div>
          </div>
        </div>

        {/* Mensajes de éxito o error */}
        {backupMsg && (
          <div className="rounded-lg border border-emerald-300 bg-emerald-50 p-3 text-xs text-emerald-900 font-medium space-y-2">
            <div className="flex items-center gap-2">
              <span className="text-base text-emerald-700">✓</span>
              <span>{backupMsg}</span>
            </div>
            <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-emerald-200/60 text-xs">
              <span className="text-stone-500 font-normal">Navegar a:</span>
              <Link to="/articulos" className="font-semibold text-emerald-800 hover:underline">
                👗 Artículos ({articulos.length})
              </Link>
              <span>•</span>
              <Link to="/rollos" className="font-semibold text-emerald-800 hover:underline">
                🧵 Rollos ({compras.length})
              </Link>
              <span>•</span>
              <Link to="/talleres" className="font-semibold text-emerald-800 hover:underline">
                🏭 Talleres ({talleres.length})
              </Link>
              <span>•</span>
              <Link to="/cortes" className="font-semibold text-emerald-800 hover:underline">
                ✂️ Cortes ({cortes.length})
              </Link>
            </div>
          </div>
        )}

        {backupError && (
          <div className="rounded-lg border border-red-300 bg-red-50 p-3 text-xs text-red-900 font-medium flex items-center gap-2">
            <span className="text-base">✕</span>
            <span>{backupError}</span>
          </div>
        )}

        {/* Acciones secundarias para arrancar de cero o resetear */}
        <div className="flex items-center justify-between border-t border-stone-100 pt-3 text-xs text-stone-500">
          <span>Opciones de inicio:</span>
          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={handleLimpiarTodo}
              className="text-stone-600 hover:text-red-700 underline transition-colors"
            >
              Vaciar sistema (empezar en blanco a mano)
            </button>
            <button
              type="button"
              onClick={handleResetearDemo}
              className="text-amber-800 hover:underline transition-colors"
            >
              Restablecer datos demo
            </button>
          </div>
        </div>
      </div>

      {/* BLOQUE DE CONFIGURACIÓN DE URL: GOOGLE SHEETS */}
      <div className="rounded-xl border border-stone-200 bg-white p-5 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base font-semibold text-stone-900">
              Configuración de URL de Google Sheets
            </h2>
            <p className="text-xs text-stone-500">
              Dirección de la Aplicación Web (Google Apps Script) para conectar tu planilla.
            </p>
          </div>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-800 border border-emerald-200">
            <span className="h-2 w-2 rounded-full bg-emerald-600 animate-pulse" />
            Cloud Database
          </span>
        </div>

        <div>
          <label className="mb-1 block text-xs font-medium text-stone-700">
            URL de la Aplicación Web (Apps Script Web App URL)
          </label>
          <div className="flex flex-col gap-2 sm:flex-row">
            <input
              type="text"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              className="flex-1 rounded-lg border border-stone-300 bg-white px-3 py-2 text-xs font-mono text-stone-900 focus:border-amber-600 focus:outline-none"
              placeholder="https://script.google.com/macros/s/.../exec"
            />
            <div className="flex items-center gap-2">
              <Button onClick={handleGuardar}>Guardar URL</Button>
              <Button
                variant="secondary"
                disabled={testing}
                onClick={() => handleProbarConexion()}
              >
                {testing ? 'Probando...' : 'Probar conexión'}
              </Button>
            </div>
          </div>
          {guardadoMsg && (
            <p className="mt-1 text-xs font-medium text-emerald-700">
              ✓ URL guardada correctamente en el navegador.
            </p>
          )}
        </div>

        {/* Resultado del test de conexión */}
        {testResult && (
          <div
            className={`rounded-lg border p-4 text-xs transition-colors ${
              testResult.ok
                ? 'border-emerald-200 bg-emerald-50/70 text-emerald-900'
                : 'border-red-200 bg-red-50 text-red-900'
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 font-semibold">
                <span>{testResult.ok ? '✓ Conexión exitosa' : '✕ Error de conexión'}</span>
                <span className="text-[11px] font-normal opacity-80">
                  (Latencia: {testResult.latencyMs} ms)
                </span>
              </div>
              {testResult.ok && (
                <span className="rounded bg-emerald-100 px-2 py-0.5 font-medium text-emerald-800">
                  Online
                </span>
              )}
            </div>

            {testResult.error ? (
              <p className="mt-2 text-xs text-red-700">{testResult.error}</p>
            ) : (
              <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-6 border-t border-emerald-200/60 pt-2.5">
                <div className="bg-white/70 rounded p-1.5 text-center">
                  <div className="text-[10px] text-stone-500">Artículos</div>
                  <div className="text-sm font-bold text-stone-900">
                    {testResult.dataCount?.articulos ?? 0}
                  </div>
                </div>
                <div className="bg-white/70 rounded p-1.5 text-center">
                  <div className="text-[10px] text-stone-500">Cortes</div>
                  <div className="text-sm font-bold text-stone-900">
                    {testResult.dataCount?.cortes ?? 0}
                  </div>
                </div>
                <div className="bg-white/70 rounded p-1.5 text-center">
                  <div className="text-[10px] text-stone-500">Encimadas</div>
                  <div className="text-sm font-bold text-stone-900">
                    {testResult.dataCount?.encimadas ?? 0}
                  </div>
                </div>
                <div className="bg-white/70 rounded p-1.5 text-center">
                  <div className="text-[10px] text-stone-500">Compras</div>
                  <div className="text-sm font-bold text-stone-900">
                    {testResult.dataCount?.compras ?? 0}
                  </div>
                </div>
                <div className="bg-white/70 rounded p-1.5 text-center">
                  <div className="text-[10px] text-stone-500">Talleres</div>
                  <div className="text-sm font-bold text-stone-900">
                    {testResult.dataCount?.talleres ?? 0}
                  </div>
                </div>
                <div className="bg-white/70 rounded p-1.5 text-center">
                  <div className="text-[10px] text-stone-500">Pagos</div>
                  <div className="text-sm font-bold text-stone-900">
                    {testResult.dataCount?.pagos ?? 0}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        <div className="flex flex-wrap items-center justify-between gap-2 border-t border-stone-100 pt-3 text-xs text-stone-500">
          <span>
            Predeterminado:{' '}
            <code className="rounded bg-stone-100 px-1 text-[11px]">
              AKfycbzBL77...H9Ndi
            </code>
          </span>
          <button
            type="button"
            onClick={handleRestablecer}
            className="text-amber-800 hover:underline"
          >
            Restablecer URL predeterminada
          </button>
        </div>
      </div>
    </div>
  )
}
