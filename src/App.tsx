import { Routes, Route, Navigate } from 'react-router-dom'
import { MainLayout } from './shared/layout/MainLayout'
import { ResumenPage } from './features/resumen/pages/ResumenPage'
import { RollosPage } from './features/rollos/pages/RollosPage'
import { CortesPage } from './features/cortes/pages/CortesPage'
import { TalleresPage } from './features/talleres/pages/TalleresPage'
import { ArticulosPage } from './features/articulos/pages/ArticulosPage'
import { CargaCapasPage } from './features/carga-capas/pages/CargaCapasPage'
import { PagosPage } from './features/pagos/pages/PagosPage'
import { AjustesPage } from './features/ajustes/pages/AjustesPage'

function App() {
  return (
    <MainLayout>
      <Routes>
        <Route path="/" element={<Navigate to="/resumen" replace />} />
        <Route path="/resumen" element={<ResumenPage />} />
        <Route path="/stock" element={<Navigate to="/resumen" replace />} />
        <Route path="/rollos" element={<RollosPage />} />
        <Route path="/articulos" element={<ArticulosPage />} />
        <Route path="/carga-capas" element={<CargaCapasPage />} />
        <Route path="/cortes" element={<CortesPage />} />
        <Route path="/talleres" element={<TalleresPage />} />
        <Route path="/pagos" element={<PagosPage />} />
        <Route path="/ajustes" element={<AjustesPage />} />
        <Route path="*" element={<Navigate to="/resumen" replace />} />
      </Routes>
    </MainLayout>
  )
}

export default App
