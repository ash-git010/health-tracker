import { Outlet, useNavigate, useLocation, NavLink } from 'react-router-dom'
import { getSection } from './sections'
import { UpdatePrompt } from './components/UpdatePrompt'

export function Layout() {
  const navigate = useNavigate()
  const location = useLocation()

  const parts = location.pathname.split('/').filter(Boolean)
  const sectionId = parts[0] ?? ''
  const section = getSection(sectionId)
  const isSettings = sectionId === 'settings'
  const isHub = parts.length === 0

  return (
    <div style={{ maxWidth: '480px', margin: '0 auto', paddingBottom: section ? '5.5rem' : 0 }}>
      <header className="app-header">
        <div className="row">
          {isHub ? (
            <div className="wordmark grow">
              Up<span>keep</span>
            </div>
          ) : (
            <>
              <button
                onClick={() => navigate('/')}
                className="icon-btn"
                aria-label="Home"
                style={{ marginLeft: '-0.5rem' }}
              >
                ‹
              </button>
              <h2 className="grow" style={{ margin: 0 }}>
                {section?.title ?? (isSettings ? 'Settings' : '')}
              </h2>
            </>
          )}
          <button
            onClick={() => navigate(isSettings ? '/' : '/settings')}
            className="icon-btn"
            aria-label="Settings"
            style={{ marginRight: '-0.5rem' }}
          >
            ⚙
          </button>
        </div>
      </header>

      <main style={{ padding: '1.125rem 1rem' }}>
        <Outlet />
      </main>

      {section && section.tabs.length > 1 && (
        <nav className="tabbar">
          {section.tabs.map((t) => (
            <NavLink
              key={t.path}
              to={`/${section.id}/${t.path}`}
              className={({ isActive }) => (isActive ? 'active' : '')}
            >
              {t.label}
            </NavLink>
          ))}
        </nav>
      )}
      <UpdatePrompt />
    </div>
  )
}