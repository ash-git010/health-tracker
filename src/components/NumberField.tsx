import { useEffect, useRef, useState, type CSSProperties } from 'react'

interface Props {
  label: string
  value: number | ''
  onChange: (value: number | '') => void
  suffix?: string
    /**
   * Accepted for call-site compatibility and deliberately not applied. They
   * only ever drove the spinner arrows and form-submit validation on the old
   * `type="number"` input; neither exists on a text input and no screen here
   * uses form validation. Clamping belongs on blur, as its own change.
   */
  min?: number
  max?: number
  step?: number
  inputMode?: 'numeric' | 'decimal'
  placeholder?: string
  className?: string
  style?: CSSProperties
}

/**
 * Turns typed text into a number, accepting both '.' and ',' as the decimal
 * separator. German keyboards produce ',' and German users type it.
 *
 * Returns:
 *   number — a committable value
 *   ''     — the field is empty
 *   null   — mid-typing, not yet a number ('67.', '-', ','). The draft is
 *            kept on screen but nothing is emitted, so the user can keep going.
 */
function parse(raw: string): number | '' | null {
  const trimmed = raw.trim()
  if (trimmed === '') return ''

  const normalised = trimmed.replace(',', '.')
  // One optional sign, digits, one optional point, digits. Rejects a second
  // separator, so '6,7,5' never silently becomes something else.
  if (!/^-?\d*\.?\d*$/.test(normalised)) return null

  const n = Number(normalised)
  return Number.isFinite(n) ? n : null
}

export function NumberField({
  label,
  value,
  onChange,
  suffix,
  inputMode = 'decimal',
  placeholder,
  className,
  style,
}: Props) {
  /**
   * The input is text, not number, so the browser cannot swallow the comma —
   * that was the bug. The cost is that we hold the raw text ourselves: a
   * half-typed '67,' has no numeric value but must stay on screen, which a
   * value-derived input cannot express.
   */
  const [draft, setDraft] = useState(value === '' ? '' : String(value))

  // What we last told the parent. Lets the effect below tell "the parent
  // changed this" apart from "our own onChange came back to us", without
  // putting `draft` in the dependency array and fighting the user's typing.
  const lastEmitted = useRef<number | ''>(value)

  useEffect(() => {
    if (value !== lastEmitted.current) {
      setDraft(value === '' ? '' : String(value))
      lastEmitted.current = value
    }
  }, [value])

  return (
    <label className={`field${className ? ` ${className}` : ''}`} style={style}>
      <span className="field-label">{label}</span>
      <span className="row">
        <input
          type="text"
          inputMode={inputMode}
          value={draft}
          placeholder={placeholder}
          onChange={(e) => {
            const raw = e.target.value
            setDraft(raw)

            const parsed = parse(raw)
            if (parsed === null) return // mid-typing; keep the draft, emit nothing

            lastEmitted.current = parsed
            onChange(parsed)
          }}
        />
        {suffix && (
          <span className="muted" style={{ minWidth: '2.5rem' }}>
            {suffix}
          </span>
        )}
      </span>
    </label>
  )
}