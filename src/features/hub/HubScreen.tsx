import { Link } from 'react-router-dom'
import { Utensils, Scale, Dumbbell, Sparkles } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { SECTIONS } from '../../sections'

const ICONS: Record<string, LucideIcon> = {
  meals: Utensils,
  body: Scale,
  workouts: Dumbbell,
  routines: Sparkles,
}

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
        {SECTIONS.map((section, i) => {
          const Icon = ICONS[section.id] ?? Sparkles
          return (
            <Link
              key={section.id}
              to={`/${section.id}`}
              className="hub-tile"
              style={{ animationDelay: `${i * 45}ms` }}
            >
              <span className="hub-tile-icon">
                <Icon size={22} strokeWidth={2} />
              </span>
              <span className="hub-tile-title">{section.title}</span>
              <span className="hub-tile-blurb">{section.blurb}</span>
              {!section.ready && <span className="hub-tile-soon">Soon</span>}
            </Link>
          )
        })}
      </div>
    </div>
  )
}

function greeting(): string {
  const h = new Date().getHours()
  if (h < 12) return 'Good morning'
  if (h < 18) return 'Good afternoon'
  return 'Good evening'
}