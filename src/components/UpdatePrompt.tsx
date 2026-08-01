import { useRegisterSW } from 'virtual:pwa-register/react'
import { Button } from './ui'

export function UpdatePrompt() {
  const {
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker,
  } = useRegisterSW({
    onRegisteredSW(_url, registration) {
      if (!registration) return
      setInterval(() => registration.update(), 60 * 60 * 1000)
    },
  })

  if (!needRefresh) return null

  return (
    <div
      style={{
        position: 'fixed',
        left: '1rem',
        right: '1rem',
        bottom: 'calc(5rem + env(safe-area-inset-bottom))',
        zIndex: 30,
        maxWidth: '448px',
        margin: '0 auto',
        padding: '0.875rem',
        background: 'var(--surface)',
        border: '1px solid var(--border)',
        borderRadius: 'var(--radius)',
        boxShadow: '0 2px 16px rgba(0,0,0,0.3)',
      }}
      className="row"
    >
      <span className="grow">A new version is ready.</span>
      <Button size="sm" onClick={() => setNeedRefresh(false)}>
        Later
      </Button>
      <Button size="sm" variant="primary" onClick={() => updateServiceWorker(true)}>
        Reload
      </Button>
    </div>
  )
}