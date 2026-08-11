import { useCallback, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { LogOut, ShieldCheck, ShieldAlert, KeyRound } from 'lucide-react'
import { getCurrentUser, signOut, changePassword, type CurrentUser } from '../../data/auth'
import { getProfile } from '../../data/profile'
import { Button, ScreenHeader } from '../../components/ui'
import { PasswordField } from '../../components/PasswordField'
import { useConfirm } from '../../components/DialogProvider'
import { RegisterScreen } from './RegisterScreen'
import { LoginScreen } from './LoginScreen'

type View = 'menu' | 'register' | 'login'

const MIN_PASSWORD = 8

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
      title: 'Log out?',
      message:
        'Your data stays on this device. You can log back in at any time to sync it again.',
      confirmLabel: 'Log out',
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
        <ScreenHeader title="Account" />

        <div className="card">
          <div className="row" style={{ marginBottom: '0.5rem' }}>
            <ShieldAlert size={18} style={{ color: 'var(--warn)' }} />
            <strong className="grow">No account linked</strong>
          </div>
          <p className="muted" style={{ margin: 0 }}>
            Everything you have logged lives only on this phone. Losing it,
            clearing your browser, or reinstalling erases it permanently.
          </p>
        </div>

        <p className="muted">
          An account keeps your data safe if you lose your phone. It syncs in
          the background and lets you log in on another device. Everything
          already on this phone comes with you.
        </p>

        <Button variant="primary" block onClick={() => setView('register')}>
          Create an account
        </Button>

        <Button block onClick={() => setView('login')}>
          I already have one
        </Button>
      </div>
    )
  }

  return (
    <div className="stack" style={{ paddingBottom: '2rem' }}>
      <ScreenHeader title="Account" />

      <div className="card">
        <div className="row" style={{ marginBottom: '0.5rem' }}>
          <ShieldCheck size={18} style={{ color: 'var(--success)' }} />
          <strong className="grow">Account linked</strong>
        </div>
        <p className="muted" style={{ margin: 0 }}>
          Your data syncs automatically in the background, so losing this phone
          does not mean losing what you have logged.
        </p>
      </div>

      <h3 style={{ marginTop: '1.25rem' }}>Details</h3>

      <div className="list-item">
        <span className="grow muted">Name</span>
        <span>{profileName || '—'}</span>
      </div>

      <div className="list-item">
        <span className="grow muted">Email</span>
        <span style={{ wordBreak: 'break-all' }}>{user.email}</span>
      </div>

      <p className="faint">
        Your name is part of your profile, not your account — change it in
        Settings, and it works with or without one. Changing your email is not
        available yet; it needs a confirmation message to both addresses, which
        is not set up.
      </p>

      <h3 style={{ marginTop: '1.25rem' }}>Password</h3>
      <PasswordEditor />

      <h3 style={{ marginTop: '1.25rem' }}>Session</h3>

      <Button block onClick={handleSignOut}>
        <LogOut size={16} /> Log out
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
          <KeyRound size={16} /> Change password
        </Button>
        {done && <p className="success">Password changed.</p>}
      </>
    )
  }

  return (
    <>
      <PasswordField
        label="Current password"
        value={current}
        autoComplete="current-password"
        onChange={setCurrent}
      />

      <PasswordField
        label="New password"
        value={next}
        autoComplete="new-password"
        placeholder={`At least ${MIN_PASSWORD} characters`}
        onChange={setNext}
      />

      <PasswordField
        label="Confirm new password"
        value={confirmPw}
        autoComplete="new-password"
        onChange={setConfirmPw}
      />

      {tooShort && <p className="warn">At least {MIN_PASSWORD} characters.</p>}
      {mismatch && <p className="warn">The two new passwords do not match.</p>}
      {error && <p className="danger">{error}</p>}

      <div className="form-actions">
        <Button
          variant="primary"
          block
          disabled={!valid}
          onClick={handleSave}
        >
          {busy ? 'Saving…' : 'Save password'}
        </Button>
        <Button
          block
          onClick={() => {
            reset()
            setOpen(false)
          }}
        >
          Cancel
        </Button>
      </div>
    </>
  )
}