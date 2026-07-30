import { useEffect, useState } from 'react'
import { GoalsScreen } from './features/goals/GoalsScreen'
import { FoodListScreen } from './features/foods/FoodListScreen'
import { getGoals } from './data/goals'
import { TodayScreen } from './features/log/TodayScreen'
import { SettingsScreen } from './features/settings/SettingsScreen'

type Tab = 'today' | 'foods' | 'goals' | 'settings'

export default function App() {
  const [hasGoals, setHasGoals] = useState<boolean | null>(null)
  const [tab, setTab] = useState<Tab>('today')

  useEffect(() => {
    getGoals().then((g) => setHasGoals(!!g))
  }, [])

  if (hasGoals === null) return <p style={{ padding: '1rem' }}>Loading…</p>

  if (!hasGoals) {
    return (
      <div style={{ padding: '1rem' }}>
        <h1 style={{ fontSize: '1.3rem' }}>Welcome — set your goals</h1>
        <GoalsScreen onSaved={() => setHasGoals(true)} />
      </div>
    )
  }

  return (
    <div style={{ maxWidth: '480px', margin: '0 auto', paddingBottom: '4.5rem' }}>
      <div style={{ padding: '1rem' }}>
        {tab === 'today' && <TodayScreen />}
        {tab === 'foods' && <FoodListScreen />}
        {tab === 'goals' && <GoalsScreen />}
        {tab === 'settings' && <SettingsScreen />}
      </div>

      <nav
        style={{
          position: 'fixed',
          bottom: 0,
          left: 0,
          right: 0,
          display: 'flex',
          borderTop: '1px solid var(--border)',
          background: 'var(--bg)',
        }}
      >
        {(['today', 'foods', 'goals', 'settings'] as Tab[]).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            style={{
              flex: 1,
              padding: '1rem 0',
              border: 'none',
              background: 'none',
              fontSize: '0.9rem',
              fontWeight: tab === t ? 600 : 400,
              opacity: tab === t ? 1 : 0.6,
              textTransform: 'capitalize',
            }}
          >
            {t}
          </button>
        ))}
      </nav>
    </div>
  )
}