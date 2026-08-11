import { useState } from 'react'
import { Eye, EyeOff } from 'lucide-react'

interface Props {
  label: string
  value: string
  onChange: (value: string) => void
  /** 'current-password' when logging in, 'new-password' when setting one. */
  autoComplete: 'current-password' | 'new-password'
  placeholder?: string
}

/**
 * A password input with a show/hide toggle.
 *
 * Typing a password blind on a phone keyboard is the most common reason a
 * correct password gets rejected, so every password field in the app uses this.
 *
 * The toggle sits inside the label. Clicking it also focuses the input, which
 * is what you want — the user is mid-typing and wants to carry on.
 */
export function PasswordField({
  label,
  value,
  onChange,
  autoComplete,
  placeholder,
}: Props) {
  const [visible, setVisible] = useState(false)

  return (
    <label className="field">
      <span className="field-label">{label}</span>

      <div style={{ position: 'relative' }}>
        <input
          type={visible ? 'text' : 'password'}
          value={value}
          autoComplete={autoComplete}
          autoCapitalize="none"
          autoCorrect="off"
          spellCheck={false}
          placeholder={placeholder}
          onChange={(e) => onChange(e.target.value)}
          style={{ width: '100%', paddingRight: '2.75rem' }}
        />

        <button
          type="button"
          className="btn-plain"
          aria-label={visible ? 'Hide password' : 'Show password'}
          // Without this the input loses focus on tap and the keyboard closes.
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => setVisible((v) => !v)}
          style={{
            position: 'absolute',
            right: 0,
            top: 0,
            height: '100%',
            width: '2.75rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'var(--text-muted)',
          }}
        >
          {visible ? <EyeOff size={18} /> : <Eye size={18} />}
        </button>
      </div>
    </label>
  )
}