import { Card, ScreenHeader } from '../../components/ui'

export function RoutinePlaceholder() {
  return (
    <div className="stack">
      <ScreenHeader title="Routines" />
      <Card>
        <p style={{ margin: 0 }}>Not built yet.</p>
        <p className="muted" style={{ margin: '0.5rem 0 0' }}>
          Coming here: skin and hair routines with daily checklists and streaks.
        </p>
      </Card>
    </div>
  )
}