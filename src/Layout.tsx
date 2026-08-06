import { Outlet, useNavigate, useLocation, NavLink } from 'react-router-dom'
import { ChevronLeft, Settings, User } from 'lucide-react'
import { getSection } from './sections'
import { UpdatePrompt } from './components/UpdatePrompt'

export function Layout() {
  const navigate = useNavigate()
  const location = useLocation()

  const parts = location.pathname.split('/').filter(Boolean)
  const sectionId = parts[0] ?? ''
  const section = getSection(sectionId)
  const isSettings = sectionId === 'settings'
  const isAccount = sectionId === 'account'
  const isHub = parts.length === 0

  function headerTitle(): string {
    if (section) return section.title
    if (isSettings) return 'Settings'
    if (isAccount) return 'Account'
    return ''
  }

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
                <ChevronLeft size={22} />
              </button>
              <h2 className="grow" style={{ margin: 0 }}>
                {headerTitle()}
              </h2>
            </>
          )}
          <button
            onClick={() => navigate(isAccount ? '/' : '/account')}
            className="icon-btn"
            aria-label="Account"
          >
            <User size={20} />
          </button>
          <button
            onClick={() => navigate(isSettings ? '/' : '/settings')}
            className="icon-btn"
            aria-label="Settings"
            style={{ marginRight: '-0.5rem' }}
          >
            <Settings size={20} />
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