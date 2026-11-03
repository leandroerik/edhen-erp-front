import { Button } from '../../../shared/components/Button'
import { useErpStore } from '../../../data/erpStore'

export function TalleresPage() {
  const { talleres } = useErpStore()

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-stone-900">Talleres</h1>
          <p className="mt-1 text-xs text-stone-500">
            {talleres.length} {talleres.length === 1 ? 'taller registrado' : 'talleres registrados'} con contacto y especialidad.
          </p>
        </div>
        <Button>+ Nuevo taller</Button>
      </div>

      <div className="mt-4 grid gap-3 md:grid-cols-2">
        {talleres.map((t) => (
          <div key={t.id} className="rounded-lg border border-stone-200 bg-white p-4 shadow-xs">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-base font-semibold text-stone-900">{t.nombre}</h2>
                {t.especialidad && (
                  <span className="inline-block mt-0.5 text-xs font-medium text-amber-800 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
                    {t.especialidad}
                  </span>
                )}
              </div>
              <div className="flex gap-2">
                {t.telefono && (
                  <>
                    <Button size="sm" variant="secondary" onClick={() => (window.location.href = `tel:${t.telefono}`)}>
                      Llamar
                    </Button>
                    <Button size="sm" variant="secondary" onClick={() => window.open(`https://wa.me/${t.telefono.replace(/\D/g, '')}`, '_blank')}>
                      WhatsApp
                    </Button>
                  </>
                )}
              </div>
            </div>
            <div className="mt-3 space-y-1 text-xs text-stone-600 border-t border-stone-100 pt-2">
              <div><strong className="text-stone-700">Teléfono:</strong> {t.telefono || '-'}</div>
              <div><strong className="text-stone-700">Dirección:</strong> {t.direccion || '-'}</div>
              <div><strong className="text-stone-700">Precios pactados:</strong> {Object.keys(t.precioPorPrendaPorModelo || {}).length ? 'Configurado' : 'A convenir'}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
