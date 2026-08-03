import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useLiveQuery } from 'dexie-react-hooks'
import { getWorkout } from '../../data/workouts'
import { saveWorkoutAsRoutine } from '../../data/routines'
import { FolderPicker } from './FolderPicker'
import { TextField } from '../../components/TextField'
import { Button, Empty, ScreenHeader } from '../../components/ui'

export function SaveAsRoutineScreen() {
  const { id } = useParams()
  const workoutId = Number(id)
  const navigate = useNavigate()

  const workout = useLiveQuery(() => getWorkout(workoutId), [workoutId])
  const [name, setName] = useState<string | null>(null)
  const [folder, setFolder] = useState('')
  const [saving, setSaving] = useState(false)

  if (workout === undefined) return <Empty>Loading…</Empty>
  if (!workout) return <Empty>Workout not found.</Empty>

  const displayName = name ?? workout.name ?? ''

  async function handleSave() {
    if (!displayName.trim() || saving) return
    setSaving(true)
    await saveWorkoutAsRoutine(workoutId, displayName.trim(), folder.trim() || undefined)
    navigate('/workouts/routines')
  }

  return (
    <div className="stack">
      <ScreenHeader
        title="Save as routine"
        onBack={() => navigate(`/workouts/history/${workoutId}`)}
      />

      <p className="muted">Reuse these exercises for future workouts.</p>

      <TextField label="Routine name" value={displayName} onChange={setName} placeholder="Push day" />

      <FolderPicker value={folder} onChange={setFolder} />

      <div className="form-actions">
        <span className="grow">
          <Button
            variant="primary"
            block
            onClick={handleSave}
            disabled={!displayName.trim() || saving}
          >
            {saving ? 'Saving…' : 'Save routine'}
          </Button>
        </span>
      </div>
    </div>
  )
}