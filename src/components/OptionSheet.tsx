export interface SheetOption {
  label: string
  onSelect: () => void
  active?: boolean
  className?: string
}

export function OptionSheet({
  title,
  options,
  onClose,
}: {
  title: string
  options: SheetOption[]
  onClose: () => void
}) {
  return (
    <div className="sheet-backdrop" onClick={onClose}>
      <div className="sheet" onClick={(e) => e.stopPropagation()}>
        <div className="sheet-title">{title}</div>
        {options.map((o) => (
          <button
            key={o.label}
            className={`sheet-item${o.active ? ' active' : ''}${o.className ? ` ${o.className}` : ''}`}
            onClick={o.onSelect}
          >
            {o.label}
          </button>
        ))}
      </div>
    </div>
  )
}