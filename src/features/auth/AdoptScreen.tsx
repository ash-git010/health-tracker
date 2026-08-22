import { useCallback, useEffect, useRef, useState } from 'react'
import { GitMerge, Smartphone, Cloud, AlertTriangle } from 'lucide-react'
import {
  previewAdoption,
  adoptAccount,
  hasLocalData,
  tableLabels,
  type AdoptMode,
  type AdoptPreview,
} from '../../data/adopt'
import { Button, ScreenHeader } from '../../components/ui'
import { useConfirm } from '../../components/DialogProvider'
import { signOut } from '../../data/auth'
import { t, plural, locale } from '../../data/i18n'

/**
 * Shown when a signed-in user's device has not been claimed by that account.
 *
 * Most of the time there is no real decision to make — a new account has
 * nothing in it, or a new device has nothing on it — and asking would be
 * noise. Those cases resolve here without a prompt. The screen only appears
 * when both sides genuinely hold data.
 */

type Phase = 'checking' | 'choosing' | 'working' | 'failed'

export function AdoptScreen({ onDone }: { onDone: () => void }) {
  const confirm = useConfirm()

  const [phase, setPhase] = useState<Phase>('checking')
  const [preview, setPreview] = useState<AdoptPreview | null>(null)
  const [error, setError] = useState('')

  // StrictMode invokes effects twice in dev. Without this the trivial cases
  // would adopt twice, and the second run would push against cursors the first
  // had already advanced.
  const ran = useRef(false)

  const check = useCallback(async () => {
    setPhase('checking')
    setError('')
    try {
      // Nothing on this device: take the account wholesale. No backup, since
      // there is nothing to back up.
      if (!(await hasLocalData())) {
        await adoptAccount('keep-account', { backup: false })
        return onDone()
      }

      const p = await previewAdoption()

      // Nothing in the account: this device's data is all there is, so a merge
      // is just a push and cannot lose anything.
      if (p.accountTotal === 0) {
        await adoptAccount('merge', { backup: false })
        return onDone()
      }

      setPreview(p)
      setPhase('choosing')
    } catch (err) {
      // err.message is deliberately left in English — it comes from Supabase
      // or from adopt.ts and is technical text a tester will screenshot. Only
      // the fallback, which is ours, is translated.
      setError(err instanceof Error ? err.message : t('adopt.errCheck'))
      setPhase('failed')
    }
  }, [onDone])

  useEffect(() => {
    if (ran.current) return
    ran.current = true
    void check()
  }, [check])

  async function choose(mode: AdoptMode) {
    if (mode === 'keep-account') {
      const ok = await confirm({
        title: t('adopt.eraseTitle'),
        message: t('adopt.eraseMessage'),
        confirmLabel: t('adopt.eraseConfirm'),
      })
      if (!ok) return
    }

    setPhase('working')
    try {
      await adoptAccount(mode)
      onDone()
    } catch (err) {
      setError(err instanceof Error ? err.message : t('adopt.errGeneric'))
      setPhase('failed')
    }
  }

  if (phase === 'checking' || phase === 'working') {
    return (
      <p className="muted" style={{ padding: '2rem', textAlign: 'center' }}>
        {phase === 'working' ? t('adopt.working') : t('adopt.checking')}
      </p>
    )
  }

  if (phase === 'failed') {
    return (
      <div className="stack" style={{ padding: '1.5rem 1rem' }}>
        <ScreenHeader title={t('adopt.failedTitle')} />
        <p className="muted">{t('adopt.failedLead')}</p>
        <p className="faint" style={{ wordBreak: 'break-word' }}>{error}</p>
        <Button variant="primary" block onClick={() => void check()}>
          {t('adopt.tryAgain')}
        </Button>
        <Button
          block
          onClick={async () => {
            await signOut()
            onDone()
          }}
        >
          {t('adopt.logOutInstead')}
        </Button>
        <p className="faint">{t('adopt.failedFoot')}</p>
      </div>
    )
  }

  if (!preview) return null

  // Read during render rather than at module level, so a language switch is
  // reflected. tableLabels() is a plain object build; there is nothing to memo.
  const labels = tableLabels()

  const rows = Object.keys(labels).filter(
    (k) => (preview.local[k] ?? 0) > 0 || (preview.account[k] ?? 0) > 0
  )

  // Only mentioned for merge: the other two modes decide the singletons by
  // their own rule, so warning about a comparison that will not run misleads.
  const goalsLost =
    preview.goals.winner === 'account' && preview.goals.localUpdatedAt !== undefined

  return (
    <div className="stack" style={{ padding: '1.5rem 1rem 2rem' }}>
      <ScreenHeader title={t('adopt.title')} />

      <p className="muted">{t('adopt.lead')}</p>

      <div className="card">
        <div className="row" style={{ marginBottom: '0.75rem' }}>
          <span className="grow" />
          <span className="faint" style={{ width: '4.5rem', textAlign: 'right' }}>
            {t('adopt.colDevice')}
          </span>
          <span className="faint" style={{ width: '4.5rem', textAlign: 'right' }}>
            {t('adopt.colAccount')}
          </span>
        </div>

        {rows.map((k) => (
          <div className="row" key={k} style={{ padding: '0.2rem 0' }}>
            <span className="grow muted">{labels[k]}</span>
            <span className="num" style={{ width: '4.5rem', textAlign: 'right' }}>
              {preview.local[k] ?? 0}
            </span>
            <span className="num" style={{ width: '4.5rem', textAlign: 'right' }}>
              {preview.account[k] ?? 0}
            </span>
          </div>
        ))}
      </div>

      <div className="stack" style={{ gap: '1.25rem', marginTop: '0.5rem' }}>
        <div>
          <Button variant="primary" block onClick={() => void choose('merge')}>
            <GitMerge size={16} /> {t('adopt.keepBoth')}
          </Button>
          <p className="faint" style={{ margin: '0.4rem 0 0' }}>
            {t('adopt.keepBothNote')}
            {goalsLost && (
              <>
                {' '}
                {t('adopt.goalsNote', {
                  local: formatDate(preview.goals.localUpdatedAt),
                  account: formatDate(preview.goals.accountUpdatedAt),
                })}
              </>
            )}
          </p>
        </div>

        <div>
          <Button block onClick={() => void choose('keep-local')}>
            <Smartphone size={16} /> {t('adopt.keepLocal')}
          </Button>
          <p className="faint" style={{ margin: '0.4rem 0 0' }}>
            {t('adopt.keepLocalNote', {
              entries: plural(preview.accountTotal, 'adopt.entries'),
            })}
          </p>
        </div>

        <div>
          <Button block onClick={() => void choose('keep-account')}>
            <Cloud size={16} /> {t('adopt.keepAccount')}
          </Button>
          <p className="faint" style={{ margin: '0.4rem 0 0' }}>
            <AlertTriangle
              size={13}
              style={{ verticalAlign: '-2px', marginRight: '0.25rem', color: 'var(--warn)' }}
            />
            {t('adopt.keepAccountNote', {
              entries: plural(preview.localTotal, 'adopt.entries'),
            })}
          </p>
        </div>
      </div>
    </div>
  )
}

/**
 * locale() rather than undefined. Passing undefined means the *browser's*
 * language, which is not necessarily the app's — a German UI on an
 * English phone would print an English-format date.
 */
function formatDate(iso?: string): string {
  if (!iso) return t('adopt.unknownDate')
  return new Date(iso).toLocaleDateString(locale())
}