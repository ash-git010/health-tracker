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