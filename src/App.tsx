import { useEffect, useState } from 'react'
import { GoalsScreen } from './features/goals/GoalsScreen'
import { getGoals } from './data/goals'

export default function App() {
  const [hasGoals, setHasGoals] = useState<boolean | null>(null)

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
    <div style={{ padding: '1rem' }}>
      <h1 style={{ fontSize: '1.3rem' }}>Health Tracker</h1>
      <p>Goals are set. Next up: food list and logging.</p>
      <GoalsScreen />
    </div>
  )
}