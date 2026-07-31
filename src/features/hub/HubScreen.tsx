import { SECTIONS } from '../../sections'
import { Card } from '../../components/ui'

interface Props {
  name: string
  onPick: (sectionId: string) => void
}

export function HubScreen({ name, onPick }: Props) {
  return (
    <div style={{ padding: '1.5rem 1rem' }}>
      <h1 style={{ marginBottom: '0.25rem' }}>{greeting()}, {name}</h1>
      <p className="muted" style={{ marginBottom: '1.5rem' }}>
        What are you tracking?
      </p>

      {SECTIONS.map((section) => (
        <button
          key={section.id}
          onClick={() => onPick(section.id)}
          style={{
            display: 'block',
            width: '100%',
            textAlign: 'left',
            padding: 0,
            marginBottom: '0.75rem',
            background: 'none',
            border: 'none',
            cursor: 'pointer',
          }}
        >
          <Card>
            <div className="row">
              <strong className="grow" style={{ fontSize: '1.05rem' }}>
                {section.title}
              </strong>
              {!section.ready && <span className="muted">soon</span>}
            </div>
            <div className="muted" style={{ marginTop: '0.2rem' }}>
              {section.blurb}
            </div>
          </Card>
        </button>
      ))}
    </div>
  )
}

function greeting(): string {
  const h = new Date().getHours()
  if (h < 12) return 'Good morning'
  if (h < 18) return 'Good afternoon'
  return 'Good evening'
}