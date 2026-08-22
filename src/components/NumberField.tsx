import { useEffect, useRef, useState, type CSSProperties } from 'react'
import { parseDecimal } from '../data/numbers'

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
  autoFocus?: boolean
  placeholder?: string
  className?: string
  style?: CSSProperties
}

export function NumberField({
  label,
  value,
  onChange,
  suffix,
  inputMode = 'decimal',
  autoFocus,
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
          autoFocus={autoFocus}
          value={draft}
          placeholder={placeholder}
          onChange={(e) => {
            const raw = e.target.value
            setDraft(raw)

            const parsed = parseDecimal(raw)
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