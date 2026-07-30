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
    <label style={{ display: 'block', marginBottom: '1rem' }}>
      <span style={{ display: 'block', marginBottom: '0.25rem', fontSize: '0.9rem' }}>
        {label}
      </span>
      <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
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
          style={{ flex: 1, padding: '0.6rem', fontSize: '1rem' }}
        />
        {suffix && <span style={{ fontSize: '0.9rem', opacity: 0.7 }}>{suffix}</span>}
      </span>
    </label>
  )
}