import { useState } from 'react'
import { exportAll, importAll, downloadBackup } from '../../data/backup'

export function SettingsScreen() {
  const [status, setStatus] = useState('')

  async function handleExport() {
    downloadBackup(await exportAll())
    setStatus('Backup downloaded')
  }

  async function handleImport(file: File) {
    if (!confirm('This replaces everything currently stored. Continue?')) return
    try {
      await importAll(await file.text())
      setStatus('Restored. Reload the app to see it.')
    } catch (err) {
      setStatus(`Import failed: ${err instanceof Error ? err.message : 'unknown error'}`)
    }
  }

  return (
    <div>
      <h2 style={{ fontSize: '1.1rem' }}>Settings</h2>

      <p style={{ fontSize: '0.9rem', opacity: 0.8 }}>
        Your data is stored on this device only. Export regularly — clearing browser
        data will erase everything.
      </p>

      <button onClick={handleExport} style={{ width: '100%', padding: '0.9rem', marginTop: '1rem' }}>
        Export backup
      </button>

      <label
        style={{
          display: 'block',
          width: '100%',
          padding: '0.9rem',
          marginTop: '0.5rem',
          border: '1px solid var(--border)',
          borderRadius: '6px',
          background: 'var(--surface)',
          textAlign: 'center',
          cursor: 'pointer',
        }}
      >
        Restore from backup
        <input
          type="file"
          accept="application/json"
          style={{ display: 'none' }}
          onChange={(e) => {
            const file = e.target.files?.[0]
            if (file) handleImport(file)
          }}
        />
      </label>

      {status && <p style={{ fontSize: '0.9rem', marginTop: '1rem' }}>{status}</p>}
    </div>
  )
}