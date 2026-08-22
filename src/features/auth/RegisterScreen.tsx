import { useEffect, useState } from 'react'
import {
  signUp,
  confirmSignUp,
  resendSignUpCode,
  MIN_PASSWORD,
  RESET_CODE_LENGTH,
} from '../../data/auth'
import { saveName } from '../../data/profile'
import { clearSkippedAuth } from '../../data/syncState'
import { Button } from '../../components/ui'
import { PasswordField } from '../../components/PasswordField'
import { t, tParts } from '../../data/i18n'

/** Matches Supabase's minimum interval per user, so the button is disabled
 *  for exactly as long as a resend would be refused. */
const RESEND_SECONDS = 60

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

  const [stage, setStage] = useState<'form' | 'code'>('form')
  const [code, setCode] = useState('')
  const [cooldown, setCooldown] = useState(0)

  useEffect(() => {
    if (cooldown <= 0) return
    const timer = setTimeout(() => setCooldown((s) => s - 1), 1000)
    return () => clearTimeout(timer)
  }, [cooldown])

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

    // No session yet — email confirmation is on, so signUp only creates the
    // user. Nothing is committed and onDone is NOT called: resolveStage() reads
    // "signed in", and handing control back now would bounce straight to the
    // gate. The account is only real once the code is verified.
    setBusy(false)
    setCooldown(RESEND_SECONDS)
    setStage('code')
  }

  async function handleConfirm() {
    if (busy) return
    setBusy(true)
    setError('')

    const result = await confirmSignUp(email, code)

    if (!result.ok) {
      setError(result.message)
      setBusy(false)
      return
    }

    // Signed in from here. Commit everything that was deferred above.
    if (name.trim() !== existingName) await saveName(name.trim())
    await clearSkippedAuth()

    onDone()
  }

  async function handleResend() {
    if (busy || cooldown > 0) return
    setBusy(true)
    setError('')

    const result = await resendSignUpCode(email)

    setBusy(false)
    if (!result.ok) {
      setError(result.message)
      return
    }
    setCooldown(RESEND_SECONDS)
  }

  if (stage === 'code') {
    const codeValid = code.length === RESET_CODE_LENGTH

    // Split around the address so the bolding is JSX rather than two
    // half-sentence keys, which would freeze English word order.
    const [leadBefore, leadAfter] = tParts('register.confirmLead', 'email', {
      n: RESET_CODE_LENGTH,
    })

    return (
      <div className="stack" style={{ padding: '1.5rem 1rem' }}>
        <h1>{t('register.confirmTitle')}</h1>

        <p className="muted">
          {leadBefore}
          <strong style={{ wordBreak: 'break-all' }}>{email}</strong>
          {leadAfter}
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
            onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
          />
        </label>

        {error && <p className="danger">{error}</p>}

        <Button
          variant="primary"
          block
          onClick={handleConfirm}
          disabled={!codeValid || busy}
        >
          {busy ? t('register.confirming') : t('register.confirm')}
        </Button>

        <Button block onClick={handleResend} disabled={cooldown > 0 || busy}>
          {cooldown > 0 ? t('auth.resendIn', { n: cooldown }) : t('auth.resend')}
        </Button>

        {/* The only exit for someone who already has an account. Supabase will
            not say whether this email is already registered, so no code
            arrives and there is otherwise nothing to tell them. */}
        <Button variant="ghost" block onClick={onSwitchToLogin}>
          {t('register.haveAccount')}
        </Button>

        <Button
          variant="ghost"
          block
          onClick={() => {
            setStage('form')
            setCode('')
            setError('')
          }}
        >
          {t('register.wrongAddress')}
        </Button>
      </div>
    )
  }

  const [forBefore, forAfter] = tParts('register.creatingFor', 'name')

  return (
    <div className="stack" style={{ padding: '1.5rem 1rem' }}>
      <h1>{t('register.title')}</h1>

      {existingName && !editingName ? (
        <p className="muted">
          {forBefore}
          <strong>{existingName}</strong>
          {forAfter}{' '}
          <button
            className="btn-plain"
            style={{ color: 'var(--accent)', textDecoration: 'underline' }}
            onClick={() => setEditingName(true)}
          >
            {t('register.change')}
          </button>
        </p>
      ) : (
        <label className="field">
          <span className="field-label">{t('name.label')}</span>
          <input
            type="text"
            value={name}
            autoComplete="name"
            placeholder={t('name.placeholder')}
            onChange={(e) => setName(e.target.value)}
          />
        </label>
      )}

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

      <PasswordField
        label={t('auth.password')}
        value={password}
        autoComplete="new-password"
        placeholder={t('auth.minChars', { n: MIN_PASSWORD })}
        onChange={setPassword}
      />

      {error && <p className="warn">{error}</p>}

      {emailTaken && (
        <Button block onClick={onSwitchToLogin}>
          {t('register.logInInstead')}
        </Button>
      )}

      <Button variant="primary" block onClick={handleSubmit} disabled={!valid || busy}>
        {busy ? t('register.busy') : t('register.submit')}
      </Button>

      <Button variant="ghost" block onClick={onBack}>
        {t('common.back')}
      </Button>
    </div>
  )
}