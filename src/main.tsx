import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { migrateIfNeeded } from './data/migrate'
import '@fontsource/bricolage-grotesque/600.css'
import '@fontsource/bricolage-grotesque/700.css'

window.addEventListener('unhandledrejection', (e) => {
  console.error('Unhandled rejection:', e.reason)
})

// Dev only. sync.ts registers window.upkeepSyncTest when imported, and nothing
// else in the app imports it, so without this line the console helpers don't
// exist. Deliberately dynamic and inside an import.meta.env.DEV branch: Vite
// replaces that expression with `false` at build time, Rollup drops the branch,
// and the module is never emitted into the production bundle. A plain static
// import would put the whole sync layer in every user's download.
// Verify after building: grep -r upkeepSyncTest dist/  (should find nothing)
if (import.meta.env.DEV) {
  import('./data/sync').catch((err) => {
    console.error('Failed to load dev sync helpers:', err)
  })
}

const redirect = sessionStorage.redirect
if (redirect) {
  delete sessionStorage.redirect
  history.replaceState(null, '', redirect)
}

const root = createRoot(document.getElementById('root')!)

function Booting() {
  return (
    <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>
      Preparing your data…
    </div>
  )
}

function MigrationFailed({ message }: { message: string }) {
  return (
    <div style={{ padding: '2rem' }}>
      <h2>Something went wrong</h2>
      <p className="muted">
        Upkeep couldn't finish updating its database, so it hasn't started. Your
        existing data has not been touched — closing and reopening the app will
        try again.
      </p>
      <p className="faint" style={{ marginTop: '1rem', wordBreak: 'break-word' }}>
        {message}
      </p>
    </div>
  )
}

// Nothing renders until the migration settles. If the app mounted first, the
// screens would read an empty new database and briefly look as though all the
// data had vanished.
root.render(<Booting />)

migrateIfNeeded()
  .then(() => {
    root.render(
      <StrictMode>
        <App />
      </StrictMode>
    )
  })
  .catch((err) => {
    console.error('Migration failed:', err)
    root.render(<MigrationFailed message={String(err?.message ?? err)} />)
  })