import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useLiveQuery } from 'dexie-react-hooks'
import { activeWorkout, finishWorkout, defaultWorkoutName } from '../../data/workouts'
import { formatDay } from '../../data/dates'
import { Button, Card, Empty, ScreenHeader } from '../../components/ui'

export function FinishWorkoutScreen() {
  const navigate = useNavigate()
  const workout = useLiveQuery(() => activeWorkout(), [])
  const [name, setName] = useState<string | null>(null)
  const [notes, setNotes] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  if (workout === undefined) return <Empty>Loading…</Empty>
  if (!workout) return <Empty>No workout in progress.</Empty>

  const displayName = name ?? (workout.name || defaultWorkoutName())
  const displayNotes = notes ?? (workout.notes ?? '')
  const durationSeconds = Math.max(
    0,
    Math.floor((Date.now() - new Date(workout.startedAt).getTime()) / 1000)
  )

  async function handleSave() {
    if (!displayName.trim() || saving) return
    setSaving(true)
    await finishWorkout(workout!.id!, {
      name: displayName.trim(),
      notes: displayNotes.trim() || undefined,
    })
    navigate(`/workouts/history/${workout!.id}`)
  }

  return (
    <div className="stack">
      <ScreenHeader title="Finish workout" />

      <label className="field">
        <span className="field-label">Name</span>
        <input type="text" value={displayName} autoFocus onChange={(e) => setName(e.target.value)} />
      </label>

      <label className="field">
        <span className="field-label">Notes</span>
        <textarea
          value={displayNotes}
          placeholder="Optional notes"
          rows={3}
          onChange={(e) => setNotes(e.target.value)}
        />
      </label>

      <Card>
        <div className="row">
          <span className="grow muted">Date</span>
          <strong>{formatDay(workout.date)}</strong>
        </div>
        <div className="row">
          <span className="grow muted">Duration</span>
          <strong>{formatDuration(durationSeconds)}</strong>
        </div>
      </Card>

      <Button variant="primary" block onClick={handleSave} disabled={!displayName.trim() || saving}>
        Save
      </Button>
    </div>
  )
}

function formatDuration(totalSeconds: number): string {
  const h = Math.floor(totalSeconds / 3600)
  const m = Math.floor((totalSeconds % 3600) / 60)
  const s = totalSeconds % 60
  return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
}
