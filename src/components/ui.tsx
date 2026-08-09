import { useState, type ReactNode, type CSSProperties } from 'react'
import { ChevronLeft } from 'lucide-react'

export function Button({
  children,
  onClick,
  variant = 'default',
  size,
  block,
  disabled,
  type = 'button',
  style,
  className,
}: {
  children: ReactNode
  onClick?: () => void
  variant?: 'default' | 'primary' | 'ghost'
  size?: 'sm'
  block?: boolean
  disabled?: boolean
  type?: 'button' | 'submit'
  style?: CSSProperties
  className?: string
}) {
  const classes = ['btn']
  if (variant === 'primary') classes.push('btn-primary')
  if (variant === 'ghost') classes.push('btn-ghost')
  if (size === 'sm') classes.push('btn-sm')
  if (block) classes.push('btn-block')
  if (className) classes.push(className)

  return (
    <button
      type={type}
      className={classes.join(' ')}
      onClick={onClick}
      disabled={disabled}
      style={style}
    >
      {children}
    </button>
  )
}

export function Fab({
  onClick,
  label = 'Add',
  children = '+',
}: {
  onClick: () => void
  label?: string
  children?: ReactNode
}) {
  return (
    <button className="fab" onClick={onClick} aria-label={label}>
      {children}
    </button>
  )
}

export function Card({ children, style }: { children: ReactNode; style?: CSSProperties }) {
  return (
    <div className="card" style={style}>
      {children}
    </div>
  )
}

export function ScreenHeader({
  title,
  action,
  onBack,
}: {
  title: string
  action?: ReactNode
  onBack?: () => void
}) {
  return (
    <div className="row" style={{ marginBottom: '0.75rem' }}>
      {onBack && (
        <button
          className="icon-btn"
          aria-label="Back"
          onClick={onBack}
          style={{ marginLeft: '-0.5rem' }}
        >
          <ChevronLeft size={22} />
        </button>
      )}
      <h2 className="grow" style={{ margin: 0 }}>
        {title}
      </h2>
      {action}
    </div>
  )
}

export function Empty({ children }: { children: ReactNode }) {
  return <p className="muted" style={{ padding: '1.5rem 0', textAlign: 'center' }}>{children}</p>
}

export function InlineRename({
  initial,
  onSave,
  onCancel,
}: {
  initial: string
  onSave: (name: string) => void
  onCancel: () => void
}) {
  const [name, setName] = useState(initial)

  return (
    <div className="row" style={{ marginBottom: '0.75rem' }}>
      <input
        type="text"
        value={name}
        autoFocus
        onChange={(e) => setName(e.target.value)}
        style={{ flex: 1 }}
      />
      <Button size="sm" variant="primary" onClick={() => name.trim() && onSave(name.trim())}>
        Save
      </Button>
      <Button size="sm" onClick={onCancel}>
        Cancel
      </Button>
    </div>
  )
}

/**
 * The app mark. Inline rather than an <img> so it inherits nothing from the
 * server and needs no base-path handling — and so it cannot flash in late on
 * the first screen a new user ever sees.
 */
export function Mark({ size = 60 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 512 512" aria-hidden="true">
      <defs>
        <linearGradient id="mark-uv" x1="0" y1="1" x2="1" y2="0">
          <stop offset="0" stopColor="#7c5cff" />
          <stop offset="1" stopColor="#c084fc" />
        </linearGradient>
        <linearGradient id="mark-ground" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#16161f" />
          <stop offset="1" stopColor="#0a0a10" />
        </linearGradient>
        <radialGradient id="mark-glow" cx="0.5" cy="0.46" r="0.5">
          <stop offset="0" stopColor="#7c5cff" stopOpacity="0.42" />
          <stop offset="0.55" stopColor="#7c5cff" stopOpacity="0.12" />
          <stop offset="1" stopColor="#7c5cff" stopOpacity="0" />
        </radialGradient>
      </defs>
      <rect width="512" height="512" rx="112" fill="url(#mark-ground)" />
      <circle cx="256" cy="236" r="210" fill="url(#mark-glow)" />
      <circle cx="256" cy="256" r="160" fill="none" stroke="url(#mark-uv)" strokeWidth="34" strokeLinecap="round" strokeDasharray="754.0 251.3" transform="rotate(-90 256 256)" />
      <circle cx="256" cy="256" r="114" fill="none" stroke="url(#mark-uv)" strokeWidth="30" strokeLinecap="round" strokeDasharray="537.2 179.1" opacity="0.6" transform="rotate(-30 256 256)" />
      <circle cx="256" cy="256" r="68" fill="none" stroke="url(#mark-uv)" strokeWidth="26" strokeLinecap="round" strokeDasharray="320.4 106.8" opacity="0.35" transform="rotate(30 256 256)" />
    </svg>
  )
}