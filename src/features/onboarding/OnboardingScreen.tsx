import { useEffect, useRef, useState, type ReactNode, type PointerEvent } from 'react'
import {
  Sparkles, Utensils, Scale, Dumbbell, Droplets, ShieldCheck,
  Smartphone, Share, MoreVertical, CheckCircle2,
} from 'lucide-react'
import { Button } from '../../components/ui'
import {
  canPromptInstall,
  onInstallChange,
  promptInstall,
  isInstalled,
  detectPlatform,
} from '../../data/install'

type Slide = {
  key: string
  icon: ReactNode
  title: string
  lead: string
  points?: string[]
  body?: ReactNode
}

const ICON = { size: 30, strokeWidth: 1.75 }

const CONTENT: Slide[] = [
  {
    key: 'welcome',
    icon: <Sparkles {...ICON} />,
    title: 'Welcome to Upkeep',
    lead: 'Everything you do to look after yourself, kept in one place.',
    points: ['Four sections, one home screen', 'Works offline, opens instantly', 'No ads, no feed, no streak guilt'],
  },
  {
    key: 'meals',
    icon: <Utensils {...ICON} />,
    title: 'Meals',
    lead: 'Log what you eat without fighting the app to do it.',
    points: ['Scan a barcode or search the food database', 'Log by weight or by piece', 'Daily macro goals and charts'],
  },
  {
    key: 'body',
    icon: <Scale {...ICON} />,
    title: 'Body',
    lead: 'Weight, smoothed — so one heavy morning does not read as a trend.',
    points: ['7-entry rolling average', '7 and 30 day change at a glance', 'Optional height and BMI'],
  },
  {
    key: 'workouts',
    icon: <Dumbbell {...ICON} />,
    title: 'Workouts',
    lead: 'Train from a routine or freestyle it, and see the progress.',
    points: ['1,300+ exercises, plus your own', 'Sets, warmups, drop sets, rest timer', 'Personal records and volume trends'],
  },
  {
    key: 'routines',
    icon: <Droplets {...ICON} />,
    title: 'Routines',
    lead: 'The small daily things that only work when you actually do them.',
    points: ['Morning, evening and anytime routines', 'Named steps with product notes', 'Streaks that survive a skipped day'],
  },
  {
    key: 'account',
    icon: <ShieldCheck {...ICON} />,
    title: 'Your data stays yours',
    lead: 'Everything is stored on this device first. It works with no signal.',
    points: ['An account syncs it across your devices', 'Sign in anywhere to pick up where you left off', 'Export a full backup whenever you like'],
  },
]

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
    title: 'Add it to your home screen',
    lead: 'Upkeep then opens like any other app — full screen, its own icon, and it still works with no signal.',
    body: added ? (
      <div className="onb-install-done">
        <CheckCircle2 size={18} />
        <span>Added. Open Upkeep from your home screen next time.</span>
      </div>
    ) : promptable ? (
      <div className="onb-install">
        <Button block onClick={handleInstall}>
          <Smartphone size={17} /> Add to home screen
        </Button>
        <p className="faint" style={{ margin: '0.5rem 0 0' }}>
          Your browser will ask you to confirm.
        </p>
      </div>
    ) : platform === 'ios' ? (
      <div className="onb-install">
        <div className="onb-install-head">
          <Share size={16} /> On iPhone, in Safari
        </div>
        <ol className="install-steps">
          <li>Tap the Share button at the bottom of the screen.</li>
          <li>Scroll down and tap "Add to Home Screen".</li>
          <li>Tap "Add" in the top right.</li>
        </ol>
      </div>
    ) : (
      <div className="onb-install">
        <div className="onb-install-head">
          <MoreVertical size={16} /> In your browser menu
        </div>
        <ol className="install-steps">
          <li>Tap the three dots in the top right.</li>
          <li>Choose "Install app" or "Add to Home screen".</li>
          <li>Confirm.</li>
        </ol>
      </div>
    ),
  }

  const slides = showInstall ? [...CONTENT, installSlide] : CONTENT
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
          Skip
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
                <div className="onb-icon">{slide.icon}</div>
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
              aria-label={`Go to slide ${i + 1}`}
              onClick={() => go(i)}
            />
          ))}
        </div>

        <Button variant="primary" block onClick={() => (index === last ? onDone() : go(index + 1))}>
          {index === last ? 'Get started' : 'Continue'}
        </Button>

        <button className="btn-plain onb-login" onClick={onLogin}>
          Already have an account? <span>Log in</span>
        </button>
      </div>
    </div>
  )
}