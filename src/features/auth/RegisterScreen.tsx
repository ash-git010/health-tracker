import { useState } from 'react'
import { signUp } from '../../data/auth'
import { saveName } from '../../data/profile'
import { clearSkippedAuth } from '../../data/syncState'
import { Button } from '../../components/ui'

// Above Supabase's own 6-character floor. Only applies to passwords being set
// now — LoginScreen deliberately checks presence, not length, so accounts
// created under the old minimum keep working.
const MIN_PASSWORD = 8

interface Props {
  /** Existing profile name, if this device has been used before. */
  existingName?: string
  onDone: () => void
  onSwitchToLogin: () => void
  onBack: () => void
}

export function RegisterScreen({ existingName, onDone, onSwitchToLogin, onBack }: Props) {
  // A returning user already told us their name during onboarding. Don't ask
  // twice — show it, and let them change it if they want.
  const [editingName, setEditingName] = useState(!existingName)
  const [name, setName] = useState(existingName ?? '')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [emailTaken, setEmailTaken] = useState(false)

  const valid =
    name.trim().length > 0 && email.trim().length > 3 && password.length >= MIN_PASSWORD

  async function handleSubmit() {
    if (!valid || busy) return
    setBusy(true)
    setError('')
    setEmailTaken(false)

    const result = await signUp(email, password, name)

    if (!result.ok) {
      setError(result.message)
      setEmailTaken(result.reason === 'email-taken')
      setBusy(false)
      return
    }

    // Write the name locally too. The auth copy is only a convenience — the
    // profile row is what the app actually reads, and what syncs later.
    if (name.trim() !== existingName) await saveName(name.trim())
    await clearSkippedAuth()

    onDone()
  }

  return (
    <div className="stack" style={{ padding: '1.5rem 1rem' }}>
      <h1>Create an account</h1>

      {existingName && !editingName ? (
        <p className="muted">
          Creating an account for <strong>{existingName}</strong>.{' '}
          <button
            className="btn-plain"
            style={{ color: 'var(--accent)', textDecoration: 'underline' }}
            onClick={() => setEditingName(true)}
          >
            Change
          </button>
        </p>
      ) : (
        <label className="field">
          <span className="field-label">Your name</span>
          <input
            type="text"
            value={name}
            autoComplete="name"
            placeholder="John Doe"
            onChange={(e) => setName(e.target.value)}
          />
        </label>
      )}

      <label className="field">
        <span className="field-label">Email</span>
        <input
          type="email"
          value={email}
          inputMode="email"
          autoComplete="email"
          autoCapitalize="none"
          placeholder="you@example.com"
          onChange={(e) => setEmail(e.target.value)}
        />
      </label>

      <label className="field">
        <span className="field-label">Password</span>
        <input
          type="password"
          value={password}
          autoComplete="new-password"
          placeholder={`At least ${MIN_PASSWORD} characters`}
          onChange={(e) => setPassword(e.target.value)}
        />
      </label>

      {error && <p className="warn">{error}</p>}

      {emailTaken && (
        <Button block onClick={onSwitchToLogin}>
          Log in instead
        </Button>
      )}

      <Button variant="primary" block onClick={handleSubmit} disabled={!valid || busy}>
        {busy ? 'Creating…' : 'Create account'}
      </Button>

      <Button variant="ghost" block onClick={onBack}>
        Back
      </Button>
    </div>
  )
}