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

/**
 * One string, singular and plural halves separated by `|`. Both languages here
 * share the same one-versus-many rule, so a pair is all that is needed — and
 * keeping the pair in a single value means a translator can never see one half
 * without the other and get the agreement wrong.
 *
 *   'adopt.entries': '{n} entry|{n} entries'
 *   plural(1, 'adopt.entries')  →  '1 entry'
 *
 * `n` is passed to t() automatically, so `{n}` works in either half. A value
 * with no `|` falls back to itself, which is correct for the languages where
 * both forms are identical rather than being a silent failure.
 */
export function plural(
  n: number,
  key: TKey,
  vars?: Record<string, string | number>
): string {
  const [one, many] = t(key, { n, ...vars }).split('|')
  return n === 1 ? one : (many ?? one)
}

/**
 * Splits a string around one `{slot}` so a component can wrap that slot in JSX
 * — a bolded email address inside a sentence, say.
 *
 * The alternative is two half-sentence keys, which hard-codes English word
 * order into the catalogue and is the classic way to make a translation
 * unfixable. Here the placeholder can sit anywhere in either language's
 * sentence and the layout is unchanged.
 */
export function tParts(
  key: TKey,
  slot: string,
  vars?: Record<string, string | number>
): [string, string] {
  const text = t(key, vars)
  const token = `{${slot}}`
  const at = text.indexOf(token)
  if (at === -1) return [text, '']
  return [text.slice(0, at), text.slice(at + token.length)]
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