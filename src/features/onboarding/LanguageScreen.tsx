import { Button, Mark } from '../../components/ui'
import type { Language } from '../../data/i18n'

/**
 * Deliberately not translated. It shows both languages at once, so it reads
 * correctly whichever one you speak — which sidesteps the chicken-and-egg
 * problem of a language picker needing a language.
 *
 * Shown to every new user rather than only when detection is uncertain: the
 * intro that follows is seven slides of copy, and guessing wrong means
 * reading all of it in the wrong language before finding Settings.
 */
export function LanguageScreen({ detected, onPick }: {
  detected: Language
  onPick: (language: Language) => void
}) {
  return (
    <div className="stack" style={{ padding: '3rem 1.5rem', textAlign: 'center' }}>
      <div style={{ display: 'flex', justifyContent: 'center' }}>
        <Mark />
      </div>

      <h1 style={{ marginBottom: 0 }}>Language</h1>
      <p className="muted" style={{ marginTop: '0.25rem' }}>Sprache</p>

      <div className="stack" style={{ marginTop: '1.5rem' }}>
        <Button
          block
          variant={detected === 'en' ? 'primary' : 'default'}
          onClick={() => onPick('en')}
        >
          English
        </Button>
        <Button
          block
          variant={detected === 'de' ? 'primary' : 'default'}
          onClick={() => onPick('de')}
        >
          Deutsch
        </Button>
      </div>

      <p className="faint" style={{ marginTop: '1rem' }}>
        You can change this later in Settings.
        <br />
        Du kannst dies später in den Einstellungen ändern.
      </p>
    </div>
  )
}