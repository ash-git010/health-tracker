import { CHANGELOG } from './changelog'
import { Card, ScreenHeader } from '../../components/ui'

export function AboutScreen({ onBack }: { onBack: () => void }) {
  return (
    <div className="stack">
      <ScreenHeader
        title="About Upkeep"
        action={
          <button className="btn btn-sm btn-ghost" onClick={onBack}>
            Back
          </button>
        }
      />

      <Card>
        <p style={{ margin: 0 }}>
          Upkeep is a personal health tracker — food, macros, and body measurements,
          with workouts and routines on the way.
        </p>
        <p className="muted" style={{ margin: '0.5rem 0 0' }}>
          Everything is stored on this device. Nothing is uploaded anywhere.
        </p>
      </Card>

      <h3>Installing on Android</h3>
      <Card>
        <ol style={{ margin: 0, paddingLeft: '1.1rem' }}>
          <li>Open this page in <strong>Chrome</strong>.</li>
          <li>Tap the ⋮ menu in the top right.</li>
          <li>Choose <strong>Install app</strong> or <strong>Add to Home screen</strong>.</li>
        </ol>
        <p className="muted" style={{ margin: '0.75rem 0 0' }}>
          Chrome is recommended. Samsung Internet and Firefox work but handle
          installed apps less consistently.
        </p>
      </Card>

      <h3>Barcode scanning</h3>
      <Card>
        <p style={{ margin: 0 }}>
          Camera scanning works on <strong>Android</strong> only. iPhones and iPads
          can't scan, because Safari doesn't support the browser API that does it —
          and every iOS browser uses Safari underneath.
        </p>
        <p className="muted" style={{ margin: '0.5rem 0 0' }}>
          On iOS, type the barcode number by hand instead. Product data comes from
          Open Food Facts, a free community database.
        </p>
      </Card>

      <h3>Backing up</h3>
      <Card>
        <p className="muted" style={{ margin: 0 }}>
          Clearing your browser data will erase everything. Export a backup from
          Settings now and then.
        </p>
      </Card>

      <h3>What's changed</h3>
      {CHANGELOG.map((release) => (
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
    </div>
  )
}