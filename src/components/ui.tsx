import type { ReactNode, CSSProperties } from 'react'

export function Button({
  children,
  onClick,
  variant = 'default',
  size,
  block,
  disabled,
  type = 'button',
  style,
}: {
  children: ReactNode
  onClick?: () => void
  variant?: 'default' | 'primary' | 'ghost'
  size?: 'sm'
  block?: boolean
  disabled?: boolean
  type?: 'button' | 'submit'
  style?: CSSProperties
}) {
  const classes = ['btn']
  if (variant === 'primary') classes.push('btn-primary')
  if (variant === 'ghost') classes.push('btn-ghost')
  if (size === 'sm') classes.push('btn-sm')
  if (block) classes.push('btn-block')

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

export function ScreenHeader({ title, action }: { title: string; action?: ReactNode }) {
  return (
    <div className="row" style={{ marginBottom: '0.75rem' }}>
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