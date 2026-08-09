import { useCallback, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { LogOut, ShieldCheck, ShieldAlert } from 'lucide-react'
import { getCurrentUser, signOut, type CurrentUser } from '../../data/auth'
import { getProfile } from '../../data/profile'
import { Button, ScreenHeader } from '../../components/ui'
import { useConfirm } from '../../components/DialogProvider'
import { RegisterScreen } from './RegisterScreen'
import { LoginScreen } from './LoginScreen'

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
          Creating an account syncs your data in the background and lets you log
          in on another device. Everything already on this phone comes with you.
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
          Your data syncs automatically in the background.
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
        Change your name in Settings. Changing your email or password is coming
        soon.
      </p>

      <h3 style={{ marginTop: '1.25rem' }}>Session</h3>

      <Button block onClick={handleSignOut}>
        <LogOut size={16} /> Log out
      </Button>
    </div>
  )
}