import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import './index.css'
import App from './App.tsx'
import { ErpStoreProvider } from './data/erpStore'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter basename={import.meta.env.BASE_URL}>
      <ErpStoreProvider>
        <App />
      </ErpStoreProvider>
    </BrowserRouter>
  </StrictMode>,
)