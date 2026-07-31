import { useEffect, useState } from 'react'
import { GoalsScreen } from './features/goals/GoalsScreen'
import { SettingsScreen } from './features/settings/SettingsScreen'
import { NameScreen } from './features/onboarding/NameScreen'
import { HubScreen } from './features/hub/HubScreen'
import { getSection } from './sections'
import { getGoals } from './data/goals'
import { getProfile } from './data/profile'

type Stage = 'checking' | 'name' | 'goals' | 'ready'

const LAST_SECTION_KEY = 'upkeep:lastSection'

export default function App() {
  const [stage, setStage] = useState<Stage>('checking')
  const [name, setName] = useState('')
  const [sectionId, setSectionId] = useState<string | null>(null)
  const [tabId, setTabId] = useState('')
  const [showSettings, setShowSettings] = useState(false)

  useEffect(() => {
    async function check() {
      const [profile, goals] = await Promise.all([getProfile(), getGoals()])
      setName(profile?.name ?? '')

      if (!profile) setStage('name')
      else if (!goals) setStage('goals')
      else {
        const last = localStorage.getItem(LAST_SECTION_KEY)
        if (last && getSection(last)) openSection(last)
        setStage('ready')
      }
    }
    check()
  }, [])

  function openSection(id: string) {
    const section = getSection(id)
    if (!section) return
    setSectionId(id)
    setTabId(section.tabs[0].id)
    localStorage.setItem(LAST_SECTION_KEY, id)
  }

  function goHome() {
    setSectionId(null)
    setShowSettings(false)
    localStorage.removeItem(LAST_SECTION_KEY)
  }

  if (stage === 'checking') {
    return <p className="muted" style={{ padding: '2rem', textAlign: 'center' }}>Loading…</p>
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

  const section = sectionId ? getSection(sectionId) : undefined
  const tab = section?.tabs.find((t) => t.id === tabId) ?? section?.tabs[0]

  return (
    <div style={{ maxWidth: '480px', margin: '0 auto', paddingBottom: section ? '4rem' : 0 }}>
      <header className="app-header">
        <div className="row">
          <button
            onClick={goHome}
            className="wordmark grow"
            style={{
              background: 'none',
              border: 'none',
              padding: 0,
              textAlign: 'left',
              cursor: 'pointer',
            }}
          >
            Up<span>keep</span>
            {section && <span className="muted"> · {section.title}</span>}
          </button>
          <button
            onClick={() => setShowSettings(!showSettings)}
            className="btn btn-sm btn-ghost"
            aria-label="Settings"
          >
            ⚙
          </button>
        </div>
      </header>

      <main style={{ padding: '1rem' }}>
        {showSettings ? (
          <SettingsScreen />
        ) : section && tab ? (
          tab.render()
        ) : (
          <HubScreen name={name} onPick={openSection} />
        )}
      </main>

      {section && !showSettings && section.tabs.length > 1 && (
        <nav className="tabbar">
          {section.tabs.map((t) => (
            <button
              key={t.id}
              onClick={() => setTabId(t.id)}
              aria-current={tab?.id === t.id ? 'page' : undefined}
            >
              {t.label}
            </button>
          ))}
        </nav>
      )}
    </div>
  )
}