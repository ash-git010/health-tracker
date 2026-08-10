import { Link, useNavigate } from 'react-router-dom'
import { Smartphone, ChevronRight } from 'lucide-react'
import { CHANGELOG } from '../../data/changelog'
import { Card, ScreenHeader } from '../../components/ui'
import { useState } from 'react'

export function AboutScreen() {
  const navigate = useNavigate()
  const [showAll, setShowAll] = useState(false)

  return (
    <div className="stack">
      <ScreenHeader
        title="About Upkeep"
        action={
          <button className="btn btn-sm btn-ghost" onClick={() => navigate('/settings')}>
            Back
          </button>
        }
      />

      <p className="muted" style={{ margin: '0.5rem 0 0' }}>
        Version {CHANGELOG[0].version}
      </p>

      <Card>
        <p style={{ margin: 0 }}>
          Upkeep is a personal health tracker — food and macros, body weight, strength
          training, and daily care routines.
        </p>
        <p className="muted" style={{ margin: '0.5rem 0 0' }}>
          Everything is stored on this device, so the app works with no signal. If you
          create an account, your data is also synced to a server so your devices stay
          in step.
        </p>
      </Card>

      <h3>Installing</h3>

      <Link to="/settings/about/install" className="btn btn-block" style={{ textDecoration: 'none' }}>
        <Smartphone size={16} /> <span className="grow" style={{ textAlign: 'left' }}>Install on your phone</span>
        <ChevronRight size={16} />
      </Link>

      <p className="muted">
        Step-by-step for Android and iPhone. Installed, Upkeep gets its own icon, opens
        full screen, and keeps you signed in for longer.
      </p>

      <h3>Barcode scanning</h3>
      <Card>
        <p style={{ margin: 0 }}>
          Camera scanning works on Android and iPhone. On iPhone, add Upkeep to your home
          screen first — Safari handles camera access better that way, and scanning can
          still take a few seconds because Safari has no built-in barcode support.
        </p>
        <p className="muted" style={{ margin: '0.5rem 0 0' }}>
          You can also type the barcode number by hand. Product data comes from Open Food
          Facts, a free community database.
        </p>
      </Card>

      <h3>Backing up</h3>
      <Card>
        <p className="muted" style={{ margin: 0 }}>
          Losing this phone, clearing your browser, or reinstalling erases
          everything stored on this device. Export a backup from Settings now
          and then, even if you have an account — it is the only copy that does
          not depend on anything else working.
        </p>
      </Card>

      <h3>What's changed</h3>
      {(showAll ? CHANGELOG : CHANGELOG.slice(0, 3)).map((release) => (
        <Card key={release.version}>
          <div className="row">
            <strong className="grow">Version {release.version}</strong>
            <span className="muted">{release.date}</span>
          </div>
          <ul style={{ margin: '0.5rem 0 0', paddingLeft: '1.1rem' }}>
            {release.changes.map((c, i) => (
              <li key={i} className="muted">{c}</li>
            ))}
          </ul>
        </Card>
      ))}

      {CHANGELOG.length > 3 && (
        <button className="btn btn-ghost btn-block" onClick={() => setShowAll(!showAll)}>
          {showAll ? 'Show recent only' : `Show all ${CHANGELOG.length} versions`}
        </button>
      )}
    </div>
  )
}