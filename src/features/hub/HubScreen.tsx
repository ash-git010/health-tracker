import { Link } from 'react-router-dom'
import { SECTIONS } from '../../sections'

export function HubScreen({ name }: { name: string }) {
  return (
    <div>
      <div style={{ marginBottom: '1.75rem' }}>
        <p className="muted" style={{ margin: 0 }}>
          {greeting()}
        </p>
        <h1 style={{ margin: '0.15rem 0 0' }}>{name}</h1>
      </div>

      <h3>Track</h3>

      <div className="hub-grid">
        {SECTIONS.map((section, i) => (
          <Link
            key={section.id}
            to={`/${section.id}`}
            className="hub-tile"
            style={{ animationDelay: `${i * 45}ms` }}
          >
            <span className="hub-tile-icon" aria-hidden="true">
              {ICONS[section.id] ?? '•'}
            </span>
            <span className="hub-tile-title">{section.title}</span>
            <span className="hub-tile-blurb">{section.blurb}</span>
            {!section.ready && <span className="hub-tile-soon">Soon</span>}
          </Link>
        ))}
      </div>
    </div>
  )
}

const ICONS: Record<string, string> = {
  meals: '◍',
  body: '◐',
  workouts: '◆',
  routines: '❋',
}

function greeting(): string {
  const h = new Date().getHours()
  if (h < 12) return 'Good morning'
  if (h < 18) return 'Good afternoon'
  return 'Good evening'
}