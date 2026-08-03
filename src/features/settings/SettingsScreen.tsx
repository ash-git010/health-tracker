import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Download, Upload, Info, MessageSquare } from 'lucide-react'
import { exportAll, importAll, downloadBackup } from '../../data/backup'
import { getProfile, saveName } from '../../data/profile'
import { Button, ScreenHeader } from '../../components/ui'
import { TextField } from '../../components/TextField'
import { useConfirm } from '../../components/DialogProvider'

export function SettingsScreen() {
  const [status, setStatus] = useState('')
  const confirm = useConfirm()

  async function handleExport() {
    downloadBackup(await exportAll())
    setStatus('Backup downloaded')
  }

  async function handleImport(file: File) {
    const ok = await confirm({
      title: 'Restore from backup?',
      message: 'This replaces everything currently stored on this device.',
      confirmLabel: 'Restore',
      destructive: true,
    })
    if (!ok) return
    try {
      await importAll(await file.text())
      setStatus('Restored. Reload the app to see it.')
    } catch (err) {
      setStatus(`Import failed: ${err instanceof Error ? err.message : 'unknown error'}`)
    }
  }

  return (
    <div className="stack" style={{ paddingBottom: '2rem' }}>
      <ScreenHeader title="Settings" />

      <h3>Name</h3>
      <NameEditor />

      <h3 style={{ marginTop: '1.25rem' }}>Your data</h3>
      <p className="muted">
        Stored on this device only. Export regularly — clearing browser data erases everything.
      </p>

      <Button onClick={handleExport} block>
        <Download size={16} /> Export backup
      </Button>

      <label className="btn btn-block" style={{ cursor: 'pointer' }}>
        <Upload size={16} /> Restore from backup
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

      <h3 style={{ marginTop: '1.25rem' }}>App</h3>

      <Link to="/settings/about" className="btn btn-block" style={{ textDecoration: 'none' }}>
        <Info size={16} /> About Upkeep
      </Link>

      <Link to="/settings/feedback" className="btn btn-block" style={{ textDecoration: 'none' }}>
        <MessageSquare size={16} /> Report a problem
      </Link>
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