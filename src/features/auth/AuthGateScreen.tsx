import { useState } from 'react'
import { Button } from '../../components/ui'

interface Props {
  name?: string
  onRegister: () => void
  onLogin: () => void
  onSkip: () => void
}

/**
 * Shown once, before anything else, when there is no session and the user has
 * not previously chosen to skip.
 *
 * The warning for skipping is inline rather than a dialog: DialogProvider wraps
 * the router, and this screen renders before the router mounts.
 */
export function AuthGateScreen({ name, onRegister, onLogin, onSkip }: Props) {
  const [confirmingSkip, setConfirmingSkip] = useState(false)

  if (confirmingSkip) {
    return (
      <div className="stack" style={{ padding: '1.5rem 1rem' }}>
        <h1>Without an account</h1>

        <p className="warn">
          Your data lives only on this phone. If you lose it, clear your browser,
          or reinstall, everything is gone and cannot be recovered.
        </p>

        <p className="muted">
          You can create an account later and keep everything you have logged
          up to that point. Nothing is lost by deciding now and changing your
          mind afterwards.
        </p>

        <Button variant="primary" block onClick={onRegister}>
          Create an account instead
        </Button>

        <Button block onClick={onSkip}>
          Continue without one
        </Button>

        <Button variant="ghost" block onClick={() => setConfirmingSkip(false)}>
          Back
        </Button>
      </div>
    )
  }

  return (
    <div className="stack" style={{ padding: '1.5rem 1rem' }}>
      <h1>{name ? `Welcome back, ${name}` : 'Welcome to Upkeep'}</h1>

      <p className="muted">
        {name
          ? 'Create an account to keep your data safe and sync it between devices. Everything you have logged so far comes with you.'
          : 'An account keeps your data safe if you lose your phone, and syncs it between devices.'}
      </p>

      <Button variant="primary" block onClick={onRegister}>
        Create an account
      </Button>

      <Button block onClick={onLogin}>
        I already have one
      </Button>

      <Button variant="ghost" block onClick={() => setConfirmingSkip(true)}>
        Continue without an account
      </Button>
    </div>
  )
}