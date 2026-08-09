import { useCallback, useEffect, useRef, useState } from 'react'
import { GitMerge, Smartphone, Cloud, AlertTriangle } from 'lucide-react'
import {
  previewAdoption,
  adoptAccount,
  hasLocalData,
  TABLE_LABELS,
  type AdoptMode,
  type AdoptPreview,
} from '../../data/adopt'
import { Button, ScreenHeader } from '../../components/ui'
import { useConfirm } from '../../components/DialogProvider'
import { signOut } from '../../data/auth'

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
      setError(err instanceof Error ? err.message : 'Could not reach your account')
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
        title: 'Delete this device\'s data?',
        message:
          'Everything logged on this device will be erased and replaced with the account\'s data. A backup file downloads first, but this cannot be undone from inside the app.',
        confirmLabel: 'Erase and replace',
      })
      if (!ok) return
    }

    setPhase('working')
    try {
      await adoptAccount(mode)
      onDone()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
      setPhase('failed')
    }
  }

  if (phase === 'checking' || phase === 'working') {
    return (
      <p className="muted" style={{ padding: '2rem', textAlign: 'center' }}>
        {phase === 'working' ? 'Sorting out your data…' : 'Checking your account…'}
      </p>
    )
  }

  if (phase === 'failed') {
    return (
      <div className="stack" style={{ padding: '1.5rem 1rem' }}>
        <ScreenHeader title="Couldn't check your account" />
        <p className="muted">
          Nothing has been changed. Your data is still on this device exactly as
          it was.
        </p>
        <p className="faint" style={{ wordBreak: 'break-word' }}>{error}</p>
        <Button variant="primary" block onClick={() => void check()}>
          Try again
        </Button>
        <Button
          block
          onClick={async () => {
            await signOut()
            onDone()
          }}
        >
          Log out instead
        </Button>
        <p className="faint">
          Your data stays on this device. Nothing has been sent to the account.
        </p>
      </div>
    )
  }

  if (!preview) return null

  const rows = Object.keys(TABLE_LABELS).filter(
    (k) => (preview.local[k] ?? 0) > 0 || (preview.account[k] ?? 0) > 0
  )

  // Only mentioned for merge: the other two modes decide the singletons by
  // their own rule, so warning about a comparison that will not run misleads.
  const goalsLost =
    preview.goals.winner === 'account' && preview.goals.localUpdatedAt !== undefined

  return (
    <div className="stack" style={{ padding: '1.5rem 1rem 2rem' }}>
      <ScreenHeader title="Two sets of data" />

      <p className="muted">
        This device has data, and so does the account you just signed into.
        Choose what to keep.
      </p>

      <div className="card">
        <div className="row" style={{ marginBottom: '0.75rem' }}>
          <span className="grow" />
          <span className="faint" style={{ width: '4.5rem', textAlign: 'right' }}>
            Device
          </span>
          <span className="faint" style={{ width: '4.5rem', textAlign: 'right' }}>
            Account
          </span>
        </div>

        {rows.map((k) => (
          <div className="row" key={k} style={{ padding: '0.2rem 0' }}>
            <span className="grow muted">{TABLE_LABELS[k]}</span>
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
            <GitMerge size={16} /> Keep both
          </Button>
          <p className="faint" style={{ margin: '0.4rem 0 0' }}>
            Nothing is lost. Anything you have on both sides will appear twice,
            and you can delete the extras afterwards.
            {goalsLost && (
              <>
                {' '}Your daily goals were last edited on this device on{' '}
                {formatDate(preview.goals.localUpdatedAt)}, and the account's on{' '}
                {formatDate(preview.goals.accountUpdatedAt)} — the account's will
                replace yours.
              </>
            )}
          </p>
        </div>

        <div>
          <Button block onClick={() => void choose('keep-local')}>
            <Smartphone size={16} /> Keep only this device's
          </Button>
          <p className="faint" style={{ margin: '0.4rem 0 0' }}>
            The account's {preview.accountTotal} entries are removed and replaced
            with what is on this device. A backup downloads first.
          </p>
        </div>

        <div>
          <Button block onClick={() => void choose('keep-account')}>
            <Cloud size={16} /> Keep only the account's
          </Button>
          <p className="faint" style={{ margin: '0.4rem 0 0' }}>
            <AlertTriangle
              size={13}
              style={{ verticalAlign: '-2px', marginRight: '0.25rem', color: 'var(--warn)' }}
            />
            This device's {preview.localTotal} entries are erased. A backup
            downloads first, but this cannot be undone from inside the app.
          </p>
        </div>
      </div>
    </div>
  )
}

function formatDate(iso?: string): string {
  if (!iso) return 'an unknown date'
  return new Date(iso).toLocaleDateString()
}