import { Link, NavLink } from 'react-router-dom'

const navItems = [
  { to: '/resumen', label: 'Resumen' },
  { to: '/rollos', label: 'Textil' },
  { to: '/articulos', label: 'Artículos' },
  { to: '/carga-capas', label: 'Carga de capas' },
  { to: '/cortes', label: 'Cortes' },
  { to: '/talleres', label: 'Talleres' },
  { to: '/pagos', label: 'Pagos' },
]

interface SidebarProps {
  onNavigate?: () => void
  onClose?: () => void
}

export function Sidebar({ onNavigate, onClose }: SidebarProps) {
  return (
    <aside className="flex h-full w-full shrink-0 flex-col border-r border-stone-200 bg-stone-50 md:w-56">
      <div className="flex shrink-0 items-center justify-between gap-2 px-4 py-4">
        <Link to="/resumen" onClick={onNavigate} className="min-w-0">
          <img
            src={`${import.meta.env.BASE_URL}logo.png`}
            alt="edhen"
            className="h-6 w-auto"
          />
        </Link>
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar menú"
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-stone-400 transition-colors hover:bg-stone-200/70 hover:text-stone-700 active:bg-stone-200 md:hidden"
          >
            ✕
          </button>
        )}
      </div>

      <nav aria-label="Navegación principal" className="flex flex-1 flex-col gap-1 overflow-y-auto px-2 pb-2">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            onClick={onNavigate}
            className={({ isActive }) =>
              `rounded-md px-3 py-2.5 text-sm font-medium transition-colors ${isActive ? 'bg-amber-700 text-white' : 'text-stone-700 hover:bg-stone-200/70'
              }`
            }
          >
            {item.label}
          </NavLink>
        ))}

        <div className="my-2 border-t border-stone-200" />
        <NavLink
          to="/ajustes"
          onClick={onNavigate}
          className={({ isActive }) =>
            `flex items-center gap-2 rounded-md px-3 py-2.5 text-sm font-medium transition-colors ${isActive ? 'bg-amber-700 text-white' : 'text-stone-700 hover:bg-stone-200/70'
            }`
          }
        >
          <span>⚙️</span>
          <span>Ajustes</span>
        </NavLink>
      </nav>

      <div className="shrink-0 px-4 pb-4 text-[11px] text-stone-400">Edhen ERP</div>
    </aside>
  )
}
