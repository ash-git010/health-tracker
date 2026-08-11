import { useState } from 'react'
import { signIn } from '../../data/auth'
import { clearSkippedAuth } from '../../data/syncState'
import { Button } from '../../components/ui'
import { ForgotPasswordScreen } from './ForgotPasswordScreen'

interface Props {
  onDone: () => void
  onSwitchToRegister: () => void
  onBack: () => void
}

export function LoginScreen({ onDone, onSwitchToRegister, onBack }: Props) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [forgot, setForgot] = useState(false)

  const valid = email.trim().length > 3 && password.length > 0

  async function handleSubmit() {
    if (!valid || busy) return
    setBusy(true)
    setError('')

    const result = await signIn(email, password)

    if (!result.ok) {
      setError(result.message)
      setBusy(false)
      return
    }

    await clearSkippedAuth()

    // Local data is deliberately untouched here. Deciding what to do when this
    // device already has data AND the account has data is the next session's
    // job — silently merging or overwriting now would risk losing something.
    onDone()
  }

  // Held here rather than routed. LoginScreen has two call sites — the
  // first-run gate and AccountScreen — and a new prop would mean editing both
  // for a flow neither needs to know about.
  if (forgot) {
    return (
      <ForgotPasswordScreen
        initialEmail={email}
        onDone={onDone}
        onBack={() => setForgot(false)}
      />
    )
  }

  return (
    <div className="stack" style={{ padding: '1.5rem 1rem' }}>
      <h1>Log in</h1>

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
          autoComplete="current-password"
          onChange={(e) => setPassword(e.target.value)}
        />
      </label>

      {error && <p className="warn">{error}</p>}

      <Button variant="primary" block onClick={handleSubmit} disabled={!valid || busy}>
        {busy ? 'Logging in…' : 'Log in'}
      </Button>

      <Button block onClick={() => setForgot(true)}>
        Forgot password
      </Button>

      <Button block onClick={onSwitchToRegister}>
        Create an account instead
      </Button>

      <Button variant="ghost" block onClick={onBack}>
        Back
      </Button>
    </div>
  )
}