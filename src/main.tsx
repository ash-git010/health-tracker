import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { migrateIfNeeded } from './data/migrate'
import { startAutoSync } from './data/autoSync'
import { startInstallWatch } from './data/install'
import '@fontsource/bricolage-grotesque/600.css'
import '@fontsource/bricolage-grotesque/700.css'

window.addEventListener('unhandledrejection', (e) => {
  console.error('Unhandled rejection:', e.reason)
})


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

startInstallWatch()

migrateIfNeeded()
  .then(() => {
    // After the migration, never before — sync must not push half-migrated
    // rows or read a database that is still being rewritten.
    startAutoSync()

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