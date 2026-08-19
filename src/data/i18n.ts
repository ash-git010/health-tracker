import { useSyncExternalStore } from 'react'
import en, { type TKey } from './locales/en'
import de from './locales/de'

export type Language = 'en' | 'de'

const CATALOGUES: Record<Language, Record<TKey, string>> = { en, de }

/**
 * Module-level rather than React context, because plain modules need this too:
 * dates.ts formats "Today", rpe.ts labels "Off", and neither can call a hook.
 * Components stay reactive via useLanguage() below.
 */
let current: Language = 'en'
const listeners = new Set<() => void>()

export function getLanguage(): Language {
  return current
}

/**
 * The phone's language, not its IP address. IP says where someone is; the
 * browser says what they read — and an English-speaking resident of Germany
 * is exactly the case IP detection gets wrong.
 */
export function detectLanguage(): Language {
  return navigator.language?.toLowerCase().startsWith('de') ? 'de' : 'en'
}

/**
 * Also sets <html lang>, which is what stops Chrome offering to translate a
 * German UI into German. Other languages still get the offer, which is fine —
 * we only hand-translate these two.
 */
export function applyLanguage(language: Language): void {
  // <html lang> is set unconditionally — it is what stops Chrome offering to
  // translate a German UI into German, and it must be right even on the paths
  // where the language did not change.
  document.documentElement.lang = language

  // Notifying on an unchanged value remounts the whole tree for nothing.
  if (language === current) return

  current = language
  listeners.forEach((fn) => fn())
}

/** For toLocaleDateString and friends — the app's language, not the phone's. */
export function locale(): string {
  return current === 'de' ? 'de-DE' : 'en-GB'
}

/**
 * `{name}` placeholders are replaced from vars. A missing key falls back to
 * the key itself, which is ugly on screen and therefore easy to spot — but
 * de.ts's typing means it should never happen in a build that compiled.
 */
export function t(key: TKey, vars?: Record<string, string | number>): string {
  let text: string = CATALOGUES[current][key] ?? key
  if (vars) {
    for (const [name, value] of Object.entries(vars)) {
      text = text.replaceAll(`{${name}}`, String(value))
    }
  }
  return text
}

export function onLanguageChange(fn: () => void): () => void {
  listeners.add(fn)
  return () => {
    listeners.delete(fn)
  }
}

/** Re-renders a component when the language changes. */
export function useLanguage(): Language {
  return useSyncExternalStore(onLanguageChange, getLanguage)
}