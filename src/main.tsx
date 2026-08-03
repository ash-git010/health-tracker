function describe(x: unknown): string {
  if (x instanceof Error) return `${x.name}: ${x.message}`
  if (typeof x === 'object' && x !== null) {
    const o = x as Record<string, unknown>
    return `${o.name ?? 'Object'}: ${o.message ?? JSON.stringify(o).slice(0, 300)}`
  }
  return String(x)
}

window.addEventListener('error', (e) => {
  alert(`Error: ${describe(e.error ?? e.message)}`)
})

window.addEventListener('unhandledrejection', (e) => {
  alert(`Rejected: ${describe(e.reason)}`)
})

const redirect = sessionStorage.redirect
if (redirect) {
  delete sessionStorage.redirect
  history.replaceState(null, '', redirect)
}

import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
