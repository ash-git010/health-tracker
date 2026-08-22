import { useEffect, useRef, useState, type ReactNode, type PointerEvent } from 'react'
import {
  Utensils, Scale, Dumbbell, Droplets, ShieldCheck,
  Smartphone, Share, MoreVertical, CheckCircle2,
} from 'lucide-react'
import { Button, Mark } from '../../components/ui'
import {
  canPromptInstall,
  onInstallChange,
  promptInstall,
  isInstalled,
  detectPlatform,
} from '../../data/install'
import { t } from '../../data/i18n'

type Slide = {
  key: string
  icon: ReactNode
  bareIcon?: boolean
  title: string
  lead: string
  points?: string[]
  body?: ReactNode
}

const ICON = { size: 30, strokeWidth: 1.75 }

/**
 * A function, not a const. Module-level arrays evaluate once at import, which
 * would freeze these strings in whatever language was active at first load.
 */
function contentSlides(): Slide[] {
  return [
    {
      key: 'welcome',
      icon: <Mark />,
      bareIcon: true,
      title: t('onb.welcome.title'),
      lead: t('onb.welcome.lead'),
      points: [t('onb.welcome.p1'), t('onb.welcome.p2'), t('onb.welcome.p3')],
    },
    {
      key: 'meals',
      icon: <Utensils {...ICON} />,
      title: t('onb.meals.title'),
      lead: t('onb.meals.lead'),
      points: [t('onb.meals.p1'), t('onb.meals.p2'), t('onb.meals.p3')],
    },
    {
      key: 'body',
      icon: <Scale {...ICON} />,
      title: t('onb.body.title'),
      lead: t('onb.body.lead'),
      points: [t('onb.body.p1'), t('onb.body.p2'), t('onb.body.p3')],
    },
    {
      key: 'workouts',
      icon: <Dumbbell {...ICON} />,
      title: t('onb.workouts.title'),
      lead: t('onb.workouts.lead'),
      points: [t('onb.workouts.p1'), t('onb.workouts.p2'), t('onb.workouts.p3')],
    },
    {
      key: 'routines',
      icon: <Droplets {...ICON} />,
      title: t('onb.routines.title'),
      lead: t('onb.routines.lead'),
      points: [t('onb.routines.p1'), t('onb.routines.p2'), t('onb.routines.p3')],
    },
    {
      key: 'account',
      icon: <ShieldCheck {...ICON} />,
      title: t('onb.account.title'),
      lead: t('onb.account.lead'),
      points: [t('onb.account.p1'), t('onb.account.p2'), t('onb.account.p3')],
    },
  ]
}

export function OnboardingScreen({ onDone, onLogin }: { onDone: () => void; onLogin: () => void }) {
  const [index, setIndex] = useState(0)
  const [drag, setDrag] = useState(0)
  const viewport = useRef<HTMLDivElement>(null)
  const startX = useRef<number | null>(null)

  // Decided once, at mount. If it were reactive the slide could appear or
  // disappear mid-tour, which would move the ground under the user's finger
  // and leave `index` pointing past the end.
  const [showInstall] = useState(() => !isInstalled())
  const [platform] = useState(detectPlatform)
  const [promptable, setPromptable] = useState(canPromptInstall)
  const [added, setAdded] = useState(false)

  useEffect(() => {
    return onInstallChange(() => {
      setPromptable(canPromptInstall())
      if (isInstalled()) setAdded(true)
    })
  }, [])

  async function handleInstall() {
    const outcome = await promptInstall()
    if (outcome === 'accepted') setAdded(true)
  }

  const installSlide: Slide = {
    key: 'install',
    icon: <Smartphone {...ICON} />,
    title: t('onb.install.title'),
    lead: t('onb.install.lead'),
    body: added ? (
      <div className="onb-install-done">
        <CheckCircle2 size={18} />
        <span>{t('onb.install.done')}</span>
      </div>
    ) : promptable ? (
      <div className="onb-install">
        <Button block onClick={handleInstall}>
          <Smartphone size={17} /> {t('onb.install.button')}
        </Button>
        <p className="faint" style={{ margin: '0.5rem 0 0' }}>
          {t('onb.install.hint')}
        </p>
      </div>
    ) : platform === 'ios' ? (
      <div className="onb-install">
        <div className="onb-install-head">
          <Share size={16} /> {t('onb.install.iosHead')}
        </div>
        <ol className="install-steps">
          <li>{t('onb.install.ios1')}</li>
          <li>{t('onb.install.ios2')}</li>
          <li>{t('onb.install.ios3')}</li>
        </ol>
      </div>
    ) : (
      <div className="onb-install">
        <div className="onb-install-head">
          <MoreVertical size={16} /> {t('onb.install.androidHead')}
        </div>
        <ol className="install-steps">
          <li>{t('onb.install.android1')}</li>
          <li>{t('onb.install.android2')}</li>
          <li>{t('onb.install.android3')}</li>
        </ol>
      </div>
    ),
  }

  const content = contentSlides()
  const slides = showInstall ? [...content, installSlide] : content
  const last = slides.length - 1
  const dragging = startX.current !== null

  // Fractional position, so the neighbouring slides dim and shrink smoothly
  // while a drag is in progress rather than snapping when it ends.
  const width = viewport.current?.offsetWidth ?? 1
  const pos = index - drag / width

  function go(to: number) {
    setIndex(Math.max(0, Math.min(last, to)))
  }

  function handlePointerDown(e: PointerEvent<HTMLDivElement>) {
    startX.current = e.clientX
    e.currentTarget.setPointerCapture(e.pointerId)
  }

  function handlePointerMove(e: PointerEvent<HTMLDivElement>) {
    if (startX.current === null) return
    let dx = e.clientX - startX.current
    // Rubber band at the ends, so the first and last slide feel like edges.
    if ((index === 0 && dx > 0) || (index === last && dx < 0)) dx /= 3
    setDrag(dx)
  }

  function handlePointerUp() {
    if (startX.current === null) return
    const threshold = Math.min(60, (viewport.current?.offsetWidth ?? 1) * 0.2)
    if (drag < -threshold) go(index + 1)
    else if (drag > threshold) go(index - 1)
    startX.current = null
    setDrag(0)
  }

  // Arrow keys, purely so this is testable on a desktop browser.
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'ArrowRight') go(index + 1)
      if (e.key === 'ArrowLeft') go(index - 1)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  })

  const motion = dragging ? 'none' : 'transform 0.42s var(--ease), opacity 0.42s var(--ease)'

  return (
    <div className="onb">
      <div className="onb-top">
        <span className="wordmark">
          Up<span>keep</span>
        </span>
        <button className="btn-plain onb-skip" onClick={onDone}>
          {t('onb.skip')}
        </button>
      </div>

      <div
        className="onb-viewport"
        ref={viewport}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
      >
        <div
          className="onb-track"
          style={{ transform: `translate3d(${-pos * 100}%, 0, 0)`, transition: motion }}
        >
          {slides.map((slide, i) => {
            const distance = Math.min(Math.abs(i - pos), 1)
            return (
              <div
                key={slide.key}
                className="onb-slide"
                aria-hidden={i !== index}
                style={{
                  opacity: 1 - distance * 0.7,
                  transform: `scale(${1 - distance * 0.06})`,
                  transition: motion,
                }}
              >
                <div className={slide.bareIcon ? 'onb-icon is-bare' : 'onb-icon'}>
                  {slide.icon}
                </div>
                <h1>{slide.title}</h1>
                <p className="onb-lead">{slide.lead}</p>

                {slide.points && (
                  <ul className="onb-points">
                    {slide.points.map((point) => (
                      <li key={point}>{point}</li>
                    ))}
                  </ul>
                )}

                {slide.body}
              </div>
            )
          })}
        </div>
      </div>

      <div className="onb-bottom">
        <div className="onb-dots">
          {slides.map((slide, i) => (
            <button
              key={slide.key}
              className={i === index ? 'onb-dot is-active' : 'onb-dot'}
              aria-label={t('onb.goToSlide', { n: i + 1 })}
              onClick={() => go(i)}
            />
          ))}
        </div>

        <Button variant="primary" block onClick={() => (index === last ? onDone() : go(index + 1))}>
          {index === last ? t('onb.getStarted') : t('common.continue')}
        </Button>

        <button className="btn-plain onb-login" onClick={onLogin}>
          {t('onb.haveAccount')} <span>{t('onb.logIn')}</span>
        </button>
      </div>
    </div>
  )
}