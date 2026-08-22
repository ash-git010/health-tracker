import { useCallback, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { LogOut, ShieldCheck, ShieldAlert, KeyRound } from 'lucide-react'
import {
  getCurrentUser,
  signOut,
  changePassword,
  MIN_PASSWORD,
  type CurrentUser,
} from '../../data/auth'
import { getProfile } from '../../data/profile'
import { Button, ScreenHeader } from '../../components/ui'
import { PasswordField } from '../../components/PasswordField'
import { useConfirm } from '../../components/DialogProvider'
import { RegisterScreen } from './RegisterScreen'
import { LoginScreen } from './LoginScreen'
import { t } from '../../data/i18n'

type View = 'menu' | 'register' | 'login'

export function AccountScreen() {
  const navigate = useNavigate()
  const confirm = useConfirm()

  const [view, setView] = useState<View>('menu')
  const [user, setUser] = useState<CurrentUser | null>(null)
  const [profileName, setProfileName] = useState('')
  const [loaded, setLoaded] = useState(false)

  const load = useCallback(async () => {
    const [current, profile] = await Promise.all([getCurrentUser(), getProfile()])
    setUser(current)
    setProfileName(profile?.name ?? '')
    setLoaded(true)
  }, [])

  useEffect(() => {
    load()
  }, [load])

  async function handleSignOut() {
    const ok = await confirm({
      title: t('account.logOutTitle'),
      message: t('account.logOutMessage'),
      confirmLabel: t('account.logOut'),
    })
    if (!ok) return
    await signOut()
    navigate('/')
  }

  if (!loaded) return null

  // Register and login reuse the same screens as the first-run gate. Finishing
  // either returns here rather than navigating, so the user sees the result.
  if (view === 'register') {
    return (
      <RegisterScreen
        existingName={profileName || undefined}
        onDone={async () => {
          await load()
          setView('menu')
        }}
        onSwitchToLogin={() => setView('login')}
        onBack={() => setView('menu')}
      />
    )
  }

  if (view === 'login') {
    return (
      <LoginScreen
        onDone={async () => {
          await load()
          setView('menu')
        }}
        onSwitchToRegister={() => setView('register')}
        onBack={() => setView('menu')}
      />
    )
  }

  if (!user) {
    return (
      <div className="stack" style={{ paddingBottom: '2rem' }}>
        <ScreenHeader title={t('layout.account')} />

        <div className="card">
          <div className="row" style={{ marginBottom: '0.5rem' }}>
            <ShieldAlert size={18} style={{ color: 'var(--warn)' }} />
            <strong className="grow">{t('account.noAccount')}</strong>
          </div>
          <p className="muted" style={{ margin: 0 }}>
            {t('account.noAccountWarn')}
          </p>
        </div>

        <p className="muted">{t('account.pitch')}</p>

        <Button variant="primary" block onClick={() => setView('register')}>
          {t('gate.create')}
        </Button>

        <Button block onClick={() => setView('login')}>
          {t('gate.haveOne')}
        </Button>
      </div>
    )
  }

  return (
    <div className="stack" style={{ paddingBottom: '2rem' }}>
      <ScreenHeader title={t('layout.account')} />

      <div className="card">
        <div className="row" style={{ marginBottom: '0.5rem' }}>
          <ShieldCheck size={18} style={{ color: 'var(--success)' }} />
          <strong className="grow">{t('account.linked')}</strong>
        </div>
        <p className="muted" style={{ margin: 0 }}>
          {t('account.linkedNote')}
        </p>
      </div>

      <h3 style={{ marginTop: '1.25rem' }}>{t('account.details')}</h3>

      <div className="list-item">
        <span className="grow muted">{t('settings.name')}</span>
        <span>{profileName || '—'}</span>
      </div>

      <div className="list-item">
        <span className="grow muted">{t('auth.email')}</span>
        <span style={{ wordBreak: 'break-all' }}>{user.email}</span>
      </div>

      <p className="faint">{t('account.nameNote')}</p>

      <h3 style={{ marginTop: '1.25rem' }}>{t('auth.password')}</h3>
      <PasswordEditor />

      <h3 style={{ marginTop: '1.25rem' }}>{t('account.session')}</h3>

      <Button block onClick={handleSignOut}>
        <LogOut size={16} /> {t('account.logOut')}
      </Button>
    </div>
  )
}

/**
 * Three fields, not two. Supabase will change a password with only a live
 * session, so the current one is asked for and verified before the update —
 * otherwise a borrowed unlocked phone is enough to take the account.
 */
function PasswordEditor() {
  const [open, setOpen] = useState(false)
  const [current, setCurrent] = useState('')
  const [next, setNext] = useState('')
  const [confirmPw, setConfirmPw] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [done, setDone] = useState(false)

  function reset() {
    setCurrent('')
    setNext('')
    setConfirmPw('')
    setError('')
  }

  const tooShort = next.length > 0 && next.length < MIN_PASSWORD
  const mismatch = confirmPw.length > 0 && next !== confirmPw
  const valid =
    current.length > 0 && next.length >= MIN_PASSWORD && next === confirmPw && !busy

  async function handleSave() {
    setBusy(true)
    setError('')

    const result = await changePassword(current, next)

    setBusy(false)

    if (!result.ok) {
      setError(result.message)
      return
    }

    reset()
    setOpen(false)
    setDone(true)
    setTimeout(() => setDone(false), 4000)
  }

  if (!open) {
    return (
      <>
        <Button
          block
          onClick={() => {
            reset()
            setOpen(true)
          }}
        >
          <KeyRound size={16} /> {t('account.changePassword')}
        </Button>
        {done && <p className="success">{t('account.passwordChanged')}</p>}
      </>
    )
  }

  return (
    <>
      <PasswordField
        label={t('auth.currentPassword')}
        value={current}
        autoComplete="current-password"
        onChange={setCurrent}
      />

      <PasswordField
        label={t('auth.newPassword')}
        value={next}
        autoComplete="new-password"
        placeholder={t('auth.minChars', { n: MIN_PASSWORD })}
        onChange={setNext}
      />

      <PasswordField
        label={t('auth.confirmNewPassword')}
        value={confirmPw}
        autoComplete="new-password"
        onChange={setConfirmPw}
      />

      {tooShort && <p className="warn">{t('auth.minCharsWarn', { n: MIN_PASSWORD })}</p>}
      {mismatch && <p className="warn">{t('auth.pwMismatch')}</p>}
      {error && <p className="danger">{error}</p>}

      <div className="form-actions">
        <Button variant="primary" block disabled={!valid} onClick={handleSave}>
          {busy ? t('auth.saving') : t('account.savePassword')}
        </Button>
        <Button
          block
          onClick={() => {
            reset()
            setOpen(false)
          }}
        >
          {t('common.cancel')}
        </Button>
      </div>
    </>
  )
}