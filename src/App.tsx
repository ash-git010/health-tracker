import { useEffect, useState } from 'react'
import { GoalsScreen } from './features/goals/GoalsScreen'
import { FoodListScreen } from './features/foods/FoodListScreen'
import { TodayScreen } from './features/log/TodayScreen'
import { SettingsScreen } from './features/settings/SettingsScreen'
import { NameScreen } from './features/onboarding/NameScreen'
import { getGoals } from './data/goals'
import { getProfile } from './data/profile'

type Tab = 'today' | 'foods' | 'goals' | 'settings'
type Stage = 'checking' | 'name' | 'goals' | 'ready'

export default function App() {
  const [stage, setStage] = useState<Stage>('checking')
  const [name, setName] = useState('')
  const [tab, setTab] = useState<Tab>('today')

  useEffect(() => {
    async function check() {
      const [profile, goals] = await Promise.all([getProfile(), getGoals()])
      setName(profile?.name ?? '')
      if (!profile) setStage('name')
      else if (!goals) setStage('goals')
      else setStage('ready')
    }
    check()
  }, [])

  if (stage === 'checking') {
    return (
      <p className="muted" style={{ padding: '2rem', textAlign: 'center' }}>
        Loading…
      </p>
    )
  }

  if (stage === 'name') {
    return (
      <NameScreen
        onDone={async () => {
          const profile = await getProfile()
          setName(profile?.name ?? '')
          setStage('goals')
        }}
      />
    )
  }

  if (stage === 'goals') {
    return (
      <div className="stack" style={{ padding: '1.5rem 1rem' }}>
        <h1>Nice to meet you, {name}</h1>
        <p className="muted">Set your daily goals to get started.</p>
        <GoalsScreen onSaved={() => setStage('ready')} />
      </div>
    )
  }

  return (
    <div style={{ maxWidth: '480px', margin: '0 auto', paddingBottom: '4rem' }}>
      <header className="app-header">
        <div className="row">
          <div className="wordmark grow">
            Up<span>keep</span>
          </div>
          {name && <span className="muted">{name}</span>}
        </div>
      </header>

      <main style={{ padding: '1rem' }}>
        {tab === 'today' && <TodayScreen />}
        {tab === 'foods' && <FoodListScreen />}
        {tab === 'goals' && <GoalsScreen />}
        {tab === 'settings' && <SettingsScreen />}
      </main>

      <nav className="tabbar">
        {(['today', 'foods', 'goals', 'settings'] as Tab[]).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            aria-current={tab === t ? 'page' : undefined}
          >
            {t}
          </button>
        ))}
      </nav>
    </div>
  )
}