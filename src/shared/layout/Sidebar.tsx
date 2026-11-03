import { Link, NavLink } from 'react-router-dom'

const navItems = [
  { to: '/stock', label: 'Stock' },
  { to: '/rollos', label: 'Textil' },
  { to: '/articulos', label: 'Artículos' },
  { to: '/carga-capas', label: 'Carga de capas' },
  { to: '/cortes', label: 'Cortes' },
  { to: '/talleres', label: 'Talleres' },
  { to: '/pagos', label: 'Pagos' },
]

export function Sidebar({ onNavigate }: { onNavigate?: () => void }) {
  return (
    <aside className="flex h-full w-56 shrink-0 flex-col border-r border-stone-200 bg-stone-50">
      <Link to="/stock" onClick={onNavigate} className="px-4 py-5">
        <img
          src={`${import.meta.env.BASE_URL}logo.png`}
          alt="edhen"
          className="h-6 w-auto"
        />
      </Link>
      <nav className="flex flex-1 flex-col gap-1 px-2">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            onClick={onNavigate}
            className={({ isActive }) =>
              `rounded-md px-3 py-2 text-sm font-medium ${isActive ? 'bg-amber-700 text-white' : 'text-stone-700 hover:bg-stone-200/70'
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
            `flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium ${isActive ? 'bg-amber-700 text-white' : 'text-stone-700 hover:bg-stone-200/70'
            }`
          }
        >
          <span>⚙️</span>
          <span>Ajustes</span>
        </NavLink>
      </nav>
      <div className="px-4 pb-4 text-[11px] text-stone-400">Edhen ERP</div>
    </aside>
  )
}
