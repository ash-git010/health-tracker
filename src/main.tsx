window.addEventListener('error', (e) => {
  document.title = `ERR: ${e.message}`
  alert(`Error: ${e.message}\n${e.filename}:${e.lineno}`)
})

window.addEventListener('unhandledrejection', (e) => {
  alert(`Promise rejected: ${e.reason?.message ?? e.reason}`)
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
