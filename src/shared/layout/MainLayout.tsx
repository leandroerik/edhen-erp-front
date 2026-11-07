import { useEffect, useState, type ReactNode } from 'react'
import { Navbar } from './Navbar'
import { Sidebar } from './Sidebar'

export function MainLayout({ children }: { children: ReactNode }) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  useEffect(() => {
    if (!mobileMenuOpen) return
    const alPresionar = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setMobileMenuOpen(false)
    }
    window.addEventListener('keydown', alPresionar)
    return () => window.removeEventListener('keydown', alPresionar)
  }, [mobileMenuOpen])

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
            className="fixed inset-0 bg-black/50"
            onClick={() => setMobileMenuOpen(false)}
            aria-hidden="true"
          />
          <div className="relative z-10 flex h-full w-64 max-w-[80vw] flex-col bg-stone-50 shadow-xl">
            <Sidebar
              onNavigate={() => setMobileMenuOpen(false)}
              onClose={() => setMobileMenuOpen(false)}
            />
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
