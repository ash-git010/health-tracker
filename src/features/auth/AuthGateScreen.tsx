import { useState } from 'react'
import { Button } from '../../components/ui'
import { t } from '../../data/i18n'

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
        <h1>{t('gate.withoutTitle')}</h1>

        <p className="warn">{t('gate.withoutWarn')}</p>

        <p className="muted">{t('gate.withoutNote')}</p>

        <Button variant="primary" block onClick={onRegister}>
          {t('gate.createInstead')}
        </Button>

        <Button block onClick={onSkip}>
          {t('gate.continueWithout')}
        </Button>

        <Button variant="ghost" block onClick={() => setConfirmingSkip(false)}>
          {t('common.back')}
        </Button>
      </div>
    )
  }

  return (
    <div className="stack" style={{ padding: '1.5rem 1rem' }}>
      <h1>{name ? t('gate.welcomeBack', { name }) : t('gate.welcome')}</h1>

      <p className="muted">{name ? t('gate.leadReturning') : t('gate.lead')}</p>

      <Button variant="primary" block onClick={onRegister}>
        {t('gate.create')}
      </Button>

      <Button block onClick={onLogin}>
        {t('gate.haveOne')}
      </Button>

      <Button variant="ghost" block onClick={() => setConfirmingSkip(true)}>
        {t('gate.without')}
      </Button>
    </div>
  )
}