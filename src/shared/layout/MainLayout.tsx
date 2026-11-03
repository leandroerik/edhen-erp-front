import { useState, type ReactNode } from 'react'
import { Navbar } from './Navbar'
import { Sidebar } from './Sidebar'

export function MainLayout({ children }: { children: ReactNode }) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-stone-100">
      {/* Sidebar escritorio */}
      <div className="hidden md:flex">
        <Sidebar />
      </div>

      {/* Drawer mobile */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 flex md:hidden">
          <div
            className="fixed inset-0 bg-black/50 transition-opacity"
            onClick={() => setMobileMenuOpen(false)}
          />
          <div className="relative z-10 flex w-64 max-w-[80vw] flex-col bg-stone-50 shadow-xl">
            <Sidebar onNavigate={() => setMobileMenuOpen(false)} />
          </div>
        </div>
      )}

      {/* Área principal */}
      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
        <Navbar onOpenMobileMenu={() => setMobileMenuOpen(true)} />
        <main className="flex-1 overflow-auto bg-stone-100 p-3 sm:p-5 md:p-6">{children}</main>
      </div>
    </div>
  )
}
