import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Download, Upload, Info, MessageSquare, Smartphone, Languages } from 'lucide-react'
import { exportAll, importAll, downloadBackup } from '../../data/backup'
import { getProfile, saveName } from '../../data/profile'
import { setStoredLanguage } from '../../data/syncState'
import { applyLanguage, getLanguage, t, type Language } from '../../data/i18n'
import { Button, ScreenHeader } from '../../components/ui'
import { TextField } from '../../components/TextField'
import { useConfirm } from '../../components/DialogProvider'

export function SettingsScreen() {
  const [status, setStatus] = useState('')
  const confirm = useConfirm()

  async function handleExport() {
    downloadBackup(await exportAll())
    setStatus(t('settings.backupDownloaded'))
  }

  async function handleImport(file: File) {
    const ok = await confirm({
      title: t('settings.restoreTitle'),
      message: t('settings.restoreMessage'),
      confirmLabel: t('settings.restoreConfirm'),
      destructive: true,
    })
    if (!ok) return
    try {
      await importAll(await file.text())
      setStatus(t('settings.restored'))
    } catch (err) {
      setStatus(
        t('settings.importFailed', {
          message: err instanceof Error ? err.message : t('settings.unknownError'),
        })
      )
    }
  }

  return (
    <div className="stack" style={{ paddingBottom: '2rem' }}>
      <ScreenHeader title={t('settings.title')} />

      <h3>{t('settings.name')}</h3>
      <NameEditor />

      <h3 style={{ marginTop: '1.25rem' }}>{t('settings.language')}</h3>
      <LanguagePicker />

      <h3 style={{ marginTop: '1.25rem' }}>{t('settings.yourData')}</h3>
      <p className="muted">{t('settings.dataNote')}</p>

      <Button onClick={handleExport} block>
        <Download size={16} /> {t('settings.exportBackup')}
      </Button>

      <label className="btn btn-block" style={{ cursor: 'pointer' }}>
        <Upload size={16} /> {t('settings.restore')}
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

      <h3 style={{ marginTop: '1.25rem' }}>{t('settings.app')}</h3>

      <Link to="/settings/about/install" className="btn btn-block" style={{ textDecoration: 'none' }}>
        <Smartphone size={16} /> {t('settings.install')}
      </Link>

      <Link to="/settings/about" className="btn btn-block" style={{ textDecoration: 'none' }}>
        <Info size={16} /> {t('settings.about')}
      </Link>

      <Link to="/settings/feedback" className="btn btn-block" style={{ textDecoration: 'none' }}>
        <MessageSquare size={16} /> {t('settings.feedback')}
      </Link>
    </div>
  )
}

/**
 * Applies immediately rather than after a save button. App remounts on the
 * change, which lands the user back on this screen in the new language — the
 * result is its own confirmation.
 */
function LanguagePicker() {
  const active = getLanguage()

  async function pick(language: Language) {
    if (language === active) return
    await setStoredLanguage(language)
    applyLanguage(language)
  }

  return (
    <div className="row">
      <Button
        block
        variant={active === 'en' ? 'primary' : 'default'}
        onClick={() => pick('en')}
      >
        <Languages size={16} /> English
      </Button>
      <Button
        block
        variant={active === 'de' ? 'primary' : 'default'}
        onClick={() => pick('de')}
      >
        <Languages size={16} /> Deutsch
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
      <TextField label={t('settings.nameLabel')} value={value} onChange={setValue} />
      <Button
        block
        disabled={!value.trim()}
        onClick={async () => {
          await saveName(value)
          setDone(true)
          setTimeout(() => setDone(false), 2000)
        }}
      >
        {done ? t('settings.saved') : t('settings.updateName')}
      </Button>
    </>
  )
}