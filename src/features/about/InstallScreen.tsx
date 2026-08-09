import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Share, MoreVertical, CheckCircle2, Download, WifiOff, Zap, Bell } from 'lucide-react'
import { ScreenHeader, Button, Card } from '../../components/ui'
import {
  canPromptInstall,
  onInstallChange,
  promptInstall,
  isInstalled,
  detectPlatform,
  type InstallPlatform,
} from '../../data/install'

const STEPS: Record<InstallPlatform, { intro: string; steps: string[]; note?: string }> = {
  ios: {
    intro: 'Open this page in Safari, then:',
    steps: [
      'Tap the Share button at the bottom of the screen — the square with an arrow pointing up.',
      'Scroll down the list and tap "Add to Home Screen".',
      'Tap "Add" in the top right.',
      'Close Safari and open Upkeep from your home screen.',
    ],
    note: 'Safari is the reliable route. Chrome and Firefox on iPhone can do this too on iOS 16.4 and later, but the option sits in a different place in their menus. Installing matters more on iPhone than Android: Safari clears storage for websites you have not visited in a while, and a home screen app is not treated as one.',
  },
  android: {
    intro: 'If the button above did not appear, do it by hand in Chrome:',
    steps: [
      'Tap the three dots in the top right of Chrome.',
      'Tap "Install app", or "Add to Home screen" if that is what it says.',
      'Confirm with "Install" or "Add".',
      'Open Upkeep from your home screen or app drawer.',
    ],
    note: 'Firefox on Android does not support the one-tap button, so the menu route is the only one there.',
  },
  desktop: {
    intro: 'If the button above did not appear:',
    steps: [
      'Look for a small install icon at the right-hand end of the address bar.',
      'Or open the browser menu and look for "Install Upkeep".',
      'Confirm to install.',
    ],
    note: 'Chrome and Edge support this. Firefox and Safari on desktop do not install web apps.',
  },
}

const LABELS: Record<InstallPlatform, string> = {
  ios: 'iPhone & iPad',
  android: 'Android',
  desktop: 'Computer',
}

export function InstallScreen() {
  const navigate = useNavigate()
  const [platform, setPlatform] = useState<InstallPlatform>(detectPlatform)
  const [promptable, setPromptable] = useState(canPromptInstall)
  const [installed, setInstalled] = useState(isInstalled)
  const [dismissed, setDismissed] = useState(false)

  useEffect(() => {
    return onInstallChange(() => {
      setPromptable(canPromptInstall())
      setInstalled(isInstalled())
    })
  }, [])

  async function handleInstall() {
    const outcome = await promptInstall()
    if (outcome === 'accepted') setInstalled(true)
    if (outcome === 'dismissed') setDismissed(true)
  }

  const guide = STEPS[platform]

  return (
    <div className="stack">
      <ScreenHeader title="Install Upkeep" onBack={() => navigate(-1)} />

      {installed ? (
        <Card>
          <div className="row" style={{ alignItems: 'flex-start', gap: '0.75rem' }}>
            <CheckCircle2 size={20} className="install-tick" />
            <div>
              <strong>Upkeep is installed</strong>
              <p className="muted" style={{ margin: '0.25rem 0 0' }}>
                You are running it from your home screen. Nothing else to do.
              </p>
            </div>
          </div>
        </Card>
      ) : (
        <>
          <p className="muted">
            Upkeep is a web app, so there is no app store. Adding it to your home screen gives
            you an icon, a full screen without browser chrome, and offline access.
          </p>

          <ul className="install-why">
            <li>
              <WifiOff size={16} /> Works with no signal
            </li>
            <li>
              <Zap size={16} /> Opens instantly, no browser bar
            </li>
            <li>
              <Bell size={16} /> Keeps you signed in for longer
            </li>
          </ul>

          {promptable && (
            <>
              <Button variant="primary" block onClick={handleInstall}>
                <Download size={18} /> Install Upkeep
              </Button>
              <p className="faint" style={{ textAlign: 'center' }}>
                Your browser will ask you to confirm.
              </p>
            </>
          )}

          {dismissed && (
            <p className="warn">
              Install cancelled. Use the steps below, or reload the page to try the button again.
            </p>
          )}
        </>
      )}

      <div className="chip-row">
        {(Object.keys(LABELS) as InstallPlatform[]).map((key) => (
          <button
            key={key}
            className={key === platform ? 'chip active' : 'chip'}
            onClick={() => setPlatform(key)}
          >
            {LABELS[key]}
          </button>
        ))}
      </div>

      <Card>
        <div className="row" style={{ marginBottom: '0.75rem' }}>
          {platform === 'ios' ? <Share size={18} /> : <MoreVertical size={18} />}
          <strong>{LABELS[platform]}</strong>
        </div>

        <p className="muted">{guide.intro}</p>

        <ol className="install-steps">
          {guide.steps.map((step) => (
            <li key={step}>{step}</li>
          ))}
        </ol>

        {guide.note && (
          <p className="faint" style={{ margin: '0.75rem 0 0' }}>
            {guide.note}
          </p>
        )}
      </Card>
    </div>
  )
}