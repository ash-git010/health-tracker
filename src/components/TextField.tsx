interface Props {
  label: string
  value: string
  onChange: (value: string) => void
  placeholder?: string
}

export function TextField({ label, value, onChange, placeholder }: Props) {
  return (
    <label style={{ display: 'block', marginBottom: '1rem' }}>
      <span style={{ display: 'block', marginBottom: '0.25rem', fontSize: '0.9rem' }}>
        {label}
      </span>
      <input
        type="text"
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        style={{ width: '100%', padding: '0.6rem', fontSize: '1rem', boxSizing: 'border-box' }}
      />
    </label>
  )
}