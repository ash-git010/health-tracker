import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useLiveQuery } from 'dexie-react-hooks'
import { Utensils, Scale, Dumbbell, Sparkles, ChevronRight } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { SECTIONS } from '../../sections'
import { hubSummary } from '../../data/overview'
import { getCurrentUser, onAuthChange } from '../../data/auth'

const ICONS: Record<string, LucideIcon> = {
  meals: Utensils,
  body: Scale,
  workouts: Dumbbell,
  routines: Sparkles,
}

export function HubScreen({ name }: { name: string }) {
  const summary = useLiveQuery(() => hubSummary(), [])

  // undefined while unknown, so the nudge never flashes on screen for a
  // signed-in user during the first render.
  const [signedIn, setSignedIn] = useState<boolean | undefined>(undefined)

  useEffect(() => {
    let alive = true
    getCurrentUser().then((user) => {
      if (alive) setSignedIn(user !== null)
    })
    // Only sets state — no call back into supabase from inside the callback,
    // which is what makes deferring unnecessary here.
    const unsubscribe = onAuthChange((user) => setSignedIn(user !== null))
    return () => {
      alive = false
      unsubscribe()
    }
  }, [])

  const stats = summary
    ? [
        summary.daysLogged !== null && {
          key: 'meals',
          value: `${summary.daysLogged}/7`,
          label: 'Days logged',
          to: '/meals/today',
        },
        summary.workoutsThisWeek !== null && {
          key: 'workouts',
          value: String(summary.workoutsThisWeek),
          label: summary.workoutsThisWeek === 1 ? 'Workout' : 'Workouts',
          to: '/workouts/progress',
        },
        summary.currentWeight !== null && {
          key: 'body',
          value: String(summary.currentWeight),
          label: 'kg',
          to: '/body/weight',
        },
        summary.routinesDone !== null && {
          key: 'routines',
          value: `${summary.routinesDone.done}/${summary.routinesDone.total}`,
          label: 'Routines',
          to: '/routines/today',
        },
      ].filter(Boolean)
    : []

  return (
    <div>
      <div style={{ marginBottom: stats.length > 0 ? '1.25rem' : '1.75rem' }}>
        <p className="muted" style={{ margin: 0 }}>
          {greeting()}
        </p>
        <h1 style={{ margin: '0.15rem 0 0' }}>{name}</h1>
      </div>

      {stats.length > 0 && (
        <div className="hub-stats">
          {(stats as { key: string; value: string; label: string; to: string }[]).map((s) => (
            <Link key={s.key} to={s.to} className="hub-stat">
              <span className="hub-stat-value num">{s.value}</span>
              <span className="hub-stat-label">{s.label}</span>
            </Link>
          ))}
        </div>
      )}

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

      {/*
        Describes the current state rather than promising an outcome. "Sign in
        to keep your data safe" would be the same overclaim as the changelog
        line held back in the handover — nothing is backed up until the account
        exists and has synced.
      */}
      {signedIn === false && (
        <Link to="/account" className="hub-nudge">
          <span>
            No account linked — your data is only on this device
          </span>
          <ChevronRight size={16} strokeWidth={2} />
        </Link>
      )}
    </div>
  )
}

function greeting(): string {
  const h = new Date().getHours()
  if (h < 12) return 'Good morning'
  if (h < 18) return 'Good afternoon'
  return 'Good evening'
}