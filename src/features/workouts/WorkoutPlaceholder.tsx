import { Card, ScreenHeader } from '../../components/ui'

export function WorkoutPlaceholder({ name }: { name: string }) {
  return (
    <div className="stack">
      <ScreenHeader title={name} />
      <Card>
        <p style={{ margin: 0 }}>Not built yet.</p>
        <p className="muted" style={{ margin: '0.5rem 0 0' }}>
          Coming here: an exercise library grouped by muscle, routines you build from it,
          set and rep logging, and charts showing your lifts over time.
        </p>
      </Card>
    </div>
  )
}