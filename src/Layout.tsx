import { Outlet, useNavigate, useLocation, NavLink } from 'react-router-dom'
import { getSection } from './sections'

export function Layout() {
  const navigate = useNavigate()
  const location = useLocation()

  const parts = location.pathname.split('/').filter(Boolean)
  const sectionId = parts[0] ?? ''
  const section = getSection(sectionId)
  const isSettings = sectionId === 'settings'

  return (
    <div style={{ maxWidth: '480px', margin: '0 auto', paddingBottom: section ? '5rem' : 0 }}>
      <header className="app-header">
        <div className="row">
          <button onClick={() => navigate('/')} className="btn-plain wordmark grow">
            Up<span>keep</span>
            {section && <span className="muted"> · {section.title}</span>}
          </button>
          <button
            onClick={() => navigate(isSettings ? '/' : '/settings')}
            className="icon-btn"
            aria-label="Settings"
          >
            ⚙
          </button>
        </div>
      </header>

      <main style={{ padding: '1rem' }}>
        <Outlet />
      </main>

      {section && section.tabs.length > 1 && (
        <nav className="tabbar">
          {section.tabs.map((t) => (
            <NavLink
              key={t.path}
              to={`/${section.id}/${t.path}`}
              className={({ isActive }) => (isActive ? 'active' : '')}
              aria-current={undefined}
            >
              {t.label}
            </NavLink>
          ))}
        </nav>
      )}
    </div>
  )
}