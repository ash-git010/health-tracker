import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useLiveQuery } from 'dexie-react-hooks'
import { activeWorkout, finishWorkout, deleteWorkout, defaultWorkoutName } from '../../data/workouts'
import { saveWorkoutAsRoutine, getRoutine } from '../../data/routines'
import { formatDay } from '../../data/dates'
import { FolderPicker } from './FolderPicker'
import { TextField } from '../../components/TextField'
import { Button, Empty, ScreenHeader } from '../../components/ui'
import { useConfirm } from '../../components/DialogProvider'

export function FinishWorkoutScreen() {
  const navigate = useNavigate()
  const confirm = useConfirm()
  const workout = useLiveQuery(() => activeWorkout(), [])
  const savedRoutine = useLiveQuery(
    () => (workout?.routineId ? getRoutine(workout.routineId) : Promise.resolve(null)),
    [workout?.routineId]
  )
  const [name, setName] = useState<string | null>(null)
  const [notes, setNotes] = useState<string | null>(null)
  const [saveAsRoutine, setSaveAsRoutine] = useState(false)
  const [routineName, setRoutineName] = useState<string | null>(null)
  const [routineFolder, setRoutineFolder] = useState('')
  const [saving, setSaving] = useState(false)

  if (workout === undefined) return <Empty>Loading…</Empty>
  if (!workout) return <Empty>No workout in progress.</Empty>

  const displayName = name ?? (workout.name || defaultWorkoutName())
  const displayNotes = notes ?? (workout.notes ?? '')
  const displayRoutineName = routineName ?? displayName
  const durationSeconds = Math.max(
    0,
    Math.floor((Date.now() - new Date(workout.startedAt).getTime()) / 1000)
  )

  async function handleSave() {
    if (!displayName.trim() || saving) return
    setSaving(true)
    if (saveAsRoutine && !workout!.routineId && displayRoutineName.trim()) {
      await saveWorkoutAsRoutine(
        workout!.id!,
        displayRoutineName.trim(),
        routineFolder.trim() || undefined
      )
    }
    await finishWorkout(workout!.id!, {
      name: displayName.trim(),
      notes: displayNotes.trim() || undefined,
    })
    navigate(`/workouts/history/${workout!.id}`)
  }

  async function handleDiscard() {
    const ok = await confirm({
      title: 'Discard this workout?',
      message: 'Everything logged in this session will be deleted.',
      confirmLabel: 'Discard',
      destructive: true,
    })
    if (!ok) return
    await deleteWorkout(workout!.id!)
    navigate('/workouts/log')
  }

  return (
    <div className="stack" style={{ paddingBottom: '2rem' }}>
      <ScreenHeader
        title="Finish workout"
        action={
          <Button size="sm" variant="ghost" onClick={() => navigate('/workouts/log')}>
            Cancel
          </Button>
        }
      />

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

      {workout.routineId ? (
        <p className="muted">Saved as {savedRoutine?.name ?? '…'}</p>
      ) : (
        <>
          <label className="toggle-row">
            <span>
              <span className="toggle-row-title">Save as routine</span>
              <span className="muted">Reuse these exercises for future workouts</span>
            </span>
            <input
              type="checkbox"
              checked={saveAsRoutine}
              onChange={(e) => setSaveAsRoutine(e.target.checked)}
            />
          </label>

          {saveAsRoutine && (
            <>
              <TextField
                label="Routine name"
                value={displayRoutineName}
                onChange={setRoutineName}
                placeholder={displayName}
              />
              <FolderPicker value={routineFolder} onChange={setRoutineFolder} />
            </>
          )}
        </>
      )}

      <div style={{ marginTop: '0.5rem' }}>
        <div className="row" style={{ padding: '0.35rem 0' }}>
          <span className="grow faint">Date</span>
          <span className="muted">{formatDay(workout.date)}</span>
        </div>
        <div className="row" style={{ padding: '0.35rem 0' }}>
          <span className="grow faint">Duration</span>
          <span className="muted num">{formatDuration(durationSeconds)}</span>
        </div>
      </div>

      <Button variant="primary" block onClick={handleSave} disabled={!displayName.trim() || saving}>
        {saving ? 'Saving…' : 'Save workout'}
      </Button>

      <Button variant="ghost" className="btn-warn" block onClick={handleDiscard}>
        Discard workout
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