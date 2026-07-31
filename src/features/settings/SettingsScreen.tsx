import { useEffect, useState } from 'react'
import { exportAll, importAll, downloadBackup } from '../../data/backup'
import { getProfile, saveName } from '../../data/profile'
import { Button, ScreenHeader } from '../../components/ui'
import { TextField } from '../../components/TextField'
import { AboutScreen } from '../about/AboutScreen'
import { FeedbackScreen } from '../about/FeedbackScreen'

export function SettingsScreen() {
  const [status, setStatus] = useState('')
  const [showAbout, setShowAbout] = useState(false)
  const [showFeedback, setShowFeedback] = useState(false)

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

  if (showAbout) return <AboutScreen onBack={() => setShowAbout(false)} />
  if (showFeedback) return <FeedbackScreen onBack={() => setShowFeedback(false)} />

  return (
    <div className="stack">
      <ScreenHeader title="Settings" />

      <h3>Name</h3>
      <NameEditor />

      <h3 style={{ marginTop: '1rem' }}>Your data</h3>
      <p className="muted">
        Stored on this device only. Export regularly — clearing browser data erases
        everything.
      </p>

      <Button onClick={handleExport} block>
        Export backup
      </Button>

      <label className="btn btn-block" style={{ cursor: 'pointer' }}>
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

      {status && <p className="muted">{status}</p>}

      <h3 style={{ marginTop: '1rem' }}>App</h3>

      <Button onClick={() => setShowAbout(true)} block>
        About Upkeep
      </Button>

      <Button onClick={() => setShowFeedback(true)} block>
        Report a problem or suggest something
      </Button>
    </div>
  )
}

function NameEditor() {
  const [value, setValue] = useState('')
  const [loaded, setLoaded] = useState(false)
  const [done, setDone] = useState(false)

  useEffect(() => {
    getProfile().then((p) => {
      setValue(p?.name ?? '')
      setLoaded(true)
    })
  }, [])

  if (!loaded) return null

  return (
    <>
      <TextField label="What we call you" value={value} onChange={setValue} />
      <Button
        block
        disabled={!value.trim()}
        onClick={async () => {
          await saveName(value)
          setDone(true)
          setTimeout(() => setDone(false), 2000)
        }}
      >
        {done ? 'Saved' : 'Update name'}
      </Button>
    </>
  )
}