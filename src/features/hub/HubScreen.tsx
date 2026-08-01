import { Link } from 'react-router-dom'
import { SECTIONS } from '../../sections'
import { Card } from '../../components/ui'

export function HubScreen({ name }: { name: string }) {
  return (
    <div>
      <h1 style={{ marginBottom: '0.25rem' }}>
        {greeting()}, {name}
      </h1>
      <p className="muted" style={{ marginBottom: '1.5rem' }}>
        What are you tracking?
      </p>

      {SECTIONS.map((section) => (
        <Link
          key={section.id}
          to={`/${section.id}`}
          className="btn-plain"
          style={{ display: 'block', marginBottom: '0.75rem', textDecoration: 'none' }}
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
        </Link>
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