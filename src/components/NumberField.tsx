import type { CSSProperties } from 'react'

interface Props {
  label: string
  value: number | ''
  onChange: (value: number | '') => void
  suffix?: string
  min?: number
  max?: number
  step?: number
  inputMode?: 'numeric' | 'decimal'
  placeholder?: string
  className?: string
  style?: CSSProperties
}

export function NumberField({
  label,
  value,
  onChange,
  suffix,
  min,
  max,
  step,
  inputMode = 'decimal',
  placeholder,
  className,
  style,
}: Props) {
  return (
    <label className={`field${className ? ` ${className}` : ''}`} style={style}>
      <span className="field-label">{label}</span>
      <span className="row">
        <input
          type="number"
          inputMode={inputMode}
          value={value}
          min={min}
          max={max}
          step={step}
          placeholder={placeholder}
          onChange={(e) => {
            const raw = e.target.value
            onChange(raw === '' ? '' : Number(raw))
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