interface Props {
  label: string
  value: number | ''
  onChange: (value: number | '') => void
  suffix?: string
  min?: number
  max?: number
}

export function NumberField({ label, value, onChange, suffix, min, max }: Props) {
  return (
    <label className="field">
      <span className="field-label">{label}</span>
      <span className="row">
        <input
          type="number"
          inputMode="decimal"
          value={value}
          min={min}
          max={max}
          onChange={(e) => {
            const raw = e.target.value
            onChange(raw === '' ? '' : Number(raw))
          }}
        />
        {suffix && <span className="muted" style={{ minWidth: '2.5rem' }}>{suffix}</span>}
      </span>
    </label>
  )
}