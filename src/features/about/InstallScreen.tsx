import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Share, MoreVertical, CheckCircle2, Download, WifiOff, Zap, Bell } from 'lucide-react'
import { ScreenHeader, Button, Card } from '../../components/ui'
import { t } from '../../data/i18n'
import {
  canPromptInstall,
  onInstallChange,
  promptInstall,
  isInstalled,
  detectPlatform,
  type InstallPlatform,
} from '../../data/install'

/** A function, not a const — same reasoning as rpeOptions()/restOptions(). */
function installSteps(): Record<InstallPlatform, { intro: string; steps: string[]; note?: string }> {
  return {
    ios: {
      intro: t('install.iosIntro'),
      steps: [
        t('install.iosStep1'),
        t('install.iosStep2'),
        t('install.iosStep3'),
        t('install.iosStep4'),
      ],
      note: t('install.iosNote'),
    },
    android: {
      intro: t('install.androidIntro'),
      steps: [
        t('install.androidStep1'),
        t('install.androidStep2'),
        t('install.androidStep3'),
        t('install.androidStep4'),
      ],
      note: t('install.androidNote'),
    },
    desktop: {
      intro: t('install.desktopIntro'),
      steps: [t('install.desktopStep1'), t('install.desktopStep2'), t('install.desktopStep3')],
      note: t('install.desktopNote'),
    },
  }
}

function installLabels(): Record<InstallPlatform, string> {
  return {
    ios: t('install.platformIos'),
    android: t('install.platformAndroid'),
    desktop: t('install.platformDesktop'),
  }
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

  const labels = installLabels()
  const guide = installSteps()[platform]

  return (
    <div className="stack">
      <ScreenHeader title={t('install.title')} onBack={() => navigate(-1)} />

      {installed ? (
        <Card>
          <div className="row" style={{ alignItems: 'flex-start', gap: '0.75rem' }}>
            <CheckCircle2 size={20} className="install-tick" />
            <div>
              <strong>{t('install.installedTitle')}</strong>
              <p className="muted" style={{ margin: '0.25rem 0 0' }}>
                {t('install.installedNote')}
              </p>
            </div>
          </div>
        </Card>
      ) : (
        <>
          <p className="muted">{t('install.webAppNote')}</p>

          <ul className="install-why">
            <li>
              <WifiOff size={16} /> {t('install.whyOffline')}
            </li>
            <li>
              <Zap size={16} /> {t('install.whyFast')}
            </li>
            <li>
              <Bell size={16} /> {t('install.whySignedIn')}
            </li>
          </ul>

          {promptable && (
            <>
              <Button variant="primary" block onClick={handleInstall}>
                <Download size={18} /> {t('install.installButton')}
              </Button>
              <p className="faint" style={{ textAlign: 'center' }}>
                {t('install.confirmNote')}
              </p>
            </>
          )}

          {dismissed && <p className="warn">{t('install.cancelledNote')}</p>}
        </>
      )}

      <div className="chip-row">
        {(Object.keys(labels) as InstallPlatform[]).map((key) => (
          <button
            key={key}
            className={key === platform ? 'chip active' : 'chip'}
            onClick={() => setPlatform(key)}
          >
            {labels[key]}
          </button>
        ))}
      </div>

      <Card>
        <div className="row" style={{ marginBottom: '0.75rem' }}>
          {platform === 'ios' ? <Share size={18} /> : <MoreVertical size={18} />}
          <strong>{labels[platform]}</strong>
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