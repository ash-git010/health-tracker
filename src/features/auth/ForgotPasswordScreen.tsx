import { useEffect, useState } from 'react'
import {
  requestPasswordReset,
  resetPasswordWithCode,
  MIN_PASSWORD,
  RESET_CODE_LENGTH,
} from '../../data/auth'
import { clearSkippedAuth } from '../../data/syncState'
import { Button } from '../../components/ui'
import { PasswordField } from '../../components/PasswordField'
import { t, tParts } from '../../data/i18n'

/**
 * Supabase's "minimum interval per user" is 60 seconds. Matching it here means
 * the resend button is disabled for exactly as long as a resend would fail.
 */
const RESEND_SECONDS = 60

interface Props {
  /** Whatever was typed on the login form. Editable — it may be the typo. */
  initialEmail: string
  /** Reset succeeded and verifyOtp left the user signed in. */
  onDone: () => void
  onBack: () => void
}

export function ForgotPasswordScreen({ initialEmail, onDone, onBack }: Props) {
  const [stage, setStage] = useState<'request' | 'code'>('request')
  const [email, setEmail] = useState(initialEmail)

  const [code, setCode] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPw, setConfirmPw] = useState('')

  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [cooldown, setCooldown] = useState(0)

  useEffect(() => {
    if (cooldown <= 0) return
    const timer = setTimeout(() => setCooldown((s) => s - 1), 1000)
    return () => clearTimeout(timer)
  }, [cooldown])

  async function sendCode(advance: boolean) {
    if (busy) return
    setBusy(true)
    setError('')

    const result = await requestPasswordReset(email)

    setBusy(false)

    if (!result.ok) {
      setError(result.message)
      return
    }

    setCooldown(RESEND_SECONDS)
    if (advance) setStage('code')
  }

  async function handleReset() {
    if (busy) return
    setBusy(true)
    setError('')

    const result = await resetPasswordWithCode(email, code, password)

    if (!result.ok) {
      setError(result.message)
      setBusy(false)
      return
    }

    await clearSkippedAuth()
    onDone()
  }

  if (stage === 'request') {
    const valid = email.trim().length > 3

    return (
      <div className="stack" style={{ padding: '1.5rem 1rem' }}>
        <h1>{t('forgot.title')}</h1>

        <p className="muted">{t('forgot.lead', { n: RESET_CODE_LENGTH })}</p>

        <label className="field">
          <span className="field-label">{t('auth.email')}</span>
          <input
            type="email"
            value={email}
            inputMode="email"
            autoComplete="email"
            autoCapitalize="none"
            placeholder={t('auth.emailPlaceholder')}
            onChange={(e) => setEmail(e.target.value)}
          />
        </label>

        {error && <p className="warn">{error}</p>}

        <Button
          variant="primary"
          block
          onClick={() => sendCode(true)}
          disabled={!valid || busy}
        >
          {busy ? t('forgot.sending') : t('forgot.send')}
        </Button>

        <Button variant="ghost" block onClick={onBack}>
          {t('forgot.backToLogin')}
        </Button>
      </div>
    )
  }

  const tooShort = password.length > 0 && password.length < MIN_PASSWORD
  const mismatch = confirmPw.length > 0 && password !== confirmPw
  const valid =
    code.length === RESET_CODE_LENGTH &&
    password.length >= MIN_PASSWORD &&
    password === confirmPw

  // Split around the address rather than using two half-sentence keys, so the
  // German sentence can put it wherever German wants it.
  const [leadBefore, leadAfter] = tParts('forgot.codeLead', 'email')

  return (
    <div className="stack" style={{ padding: '1.5rem 1rem' }}>
      <h1>{t('forgot.codeTitle')}</h1>

      {/* Stated as a conditional on purpose. Supabase does not reveal whether
          an address has an account, so neither can we. */}
      <p className="muted">
        {leadBefore}
        <strong style={{ wordBreak: 'break-all' }}>{email}</strong>
        {leadAfter}
      </p>

      <p className="faint">
        {t('forgot.wrongAddress')}{' '}
        <button
          className="btn-plain"
          style={{ color: 'var(--accent)', textDecoration: 'underline' }}
          onClick={() => {
            setStage('request')
            setError('')
          }}
        >
          {t('forgot.changeIt')}
        </button>
      </p>

      <label className="field">
        <span className="field-label">{t('auth.code')}</span>
        <input
          type="text"
          value={code}
          inputMode="numeric"
          autoComplete="one-time-code"
          maxLength={RESET_CODE_LENGTH}
          placeholder={'0'.repeat(RESET_CODE_LENGTH)}
          style={{ letterSpacing: '0.35em', fontFamily: 'ui-monospace, monospace' }}
          // Strip anything non-numeric rather than rejecting the value: people
          // paste the code with a trailing space or newline attached, and that
          // must not read as a wrong code.
          onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
        />
      </label>

      <PasswordField
        label={t('auth.newPassword')}
        value={password}
        autoComplete="new-password"
        placeholder={t('auth.minChars', { n: MIN_PASSWORD })}
        onChange={setPassword}
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

      <Button variant="primary" block onClick={handleReset} disabled={!valid || busy}>
        {busy ? t('auth.saving') : t('forgot.setPassword')}
      </Button>

      <Button block onClick={() => sendCode(false)} disabled={cooldown > 0 || busy}>
        {cooldown > 0 ? t('auth.resendIn', { n: cooldown }) : t('auth.resend')}
      </Button>

      <Button variant="ghost" block onClick={onBack}>
        {t('forgot.backToLogin')}
      </Button>
    </div>
  )
}