import { useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { useLiveQuery } from 'dexie-react-hooks'
import {
  getWorkout,
  getSets,
  deleteWorkout,
  renameWorkout,
  updateSet,
  deleteSet,
  workoutVolume,
  completedSets,
} from '../../data/workouts'
import { saveWorkoutAsRoutine, getRoutine } from '../../data/routines'
import { formatDay } from '../../data/dates'
import { formatRestLabel } from './rest'
import { Button, Card, Empty, InlineRename, ScreenHeader } from '../../components/ui'
import type { SetType, WorkoutSet } from '../../data/types'

const SET_TYPES: { value: SetType; label: string }[] = [
  { value: 'normal', label: 'Normal' },
  { value: 'warmup', label: 'Warm-up' },
  { value: 'drop', label: 'Drop' },
  { value: 'failure', label: 'Failure' },
]

export function WorkoutDetailScreen() {
  const { id } = useParams()
  const workoutId = Number(id)
  const navigate = useNavigate()
  const [renaming, setRenaming] = useState(false)

  const workout = useLiveQuery(() => getWorkout(workoutId), [workoutId])
  const sets = useLiveQuery(() => getSets(workoutId), [workoutId])
  const routine = useLiveQuery(
    () => (workout?.routineId ? getRoutine(workout.routineId) : Promise.resolve(null)),
    [workout?.routineId]
  )

  if (workout === undefined || sets === undefined) return <Empty>Loading…</Empty>
  if (!workout) return <Empty>Workout not found.</Empty>

  const grouped = groupByExercise(sets)
  const volume = workoutVolume(sets)

  async function handleSaveAsRoutine() {
    const name = prompt('Name this routine', workout!.name)
    if (!name || !name.trim()) return
    await saveWorkoutAsRoutine(workoutId, name.trim())
    navigate('/workouts/routines')
  }

  async function handleDelete() {
    if (!confirm(`Delete ${workout!.name}?`)) return
    await deleteWorkout(workoutId)
    navigate('/workouts/history')
  }

  return (
    <div>
      <ScreenHeader
        title={workout.name}
        action={
          <Button size="sm" onClick={() => setRenaming(true)}>
            Rename
          </Button>
        }
      />

      {renaming && (
        <InlineRename
          initial={workout.name}
          onCancel={() => setRenaming(false)}
          onSave={async (name) => {
            await renameWorkout(workoutId, name)
            setRenaming(false)
          }}
        />
      )}

      <Card style={{ marginBottom: '1rem' }}>
        <div className="row">
          <span className="grow muted">Date</span>
          <strong>{formatDay(workout.date)}</strong>
        </div>
        <div className="row">
          <span className="grow muted">Volume</span>
          <strong>{Math.round(volume)} kg</strong>
        </div>
        <div className="row">
          <span className="grow muted">Sets</span>
          <strong>{completedSets(sets).length}</strong>
        </div>
      </Card>

      {grouped.map((group) => (
        <Card key={group.key} style={{ marginBottom: '0.75rem' }}>
          <Link
            to={`/workouts/exercises/${encodeURIComponent(group.key)}`}
            style={{ color: 'inherit', textDecoration: 'none' }}
          >
            <strong>{group.name}</strong>
          </Link>
          <div className="muted" style={{ fontSize: '0.8125rem' }}>
            Rest: {formatRestLabel(group.sets[0]?.restSeconds ?? 90)}
          </div>
          <div style={{ marginTop: '0.5rem' }}>
            {group.sets.map((set, i) => (
              <SetRow key={set.id} set={set} index={i} />
            ))}
          </div>
        </Card>
      ))}

      <div className="row" style={{ marginTop: '1rem' }}>
        {workout.routineId ? (
          <span className="muted grow" style={{ alignSelf: 'center' }}>
            Saved as {routine?.name ?? '…'}
          </span>
        ) : (
          <Button block onClick={handleSaveAsRoutine}>
            Save as routine
          </Button>
        )}
        <Button variant="ghost" block onClick={handleDelete}>
          Delete
        </Button>
      </div>
    </div>
  )
}

function SetRow({ set, index }: { set: WorkoutSet; index: number }) {
  const [weight, setWeight] = useState(String(set.weightKg || ''))
  const [reps, setReps] = useState(String(set.reps || ''))

  async function save(changes: { weightKg?: number; reps?: number; type?: SetType }) {
    await updateSet(set.id!, changes)
  }

  return (
    <div className="row set-row">
      <span className="muted" style={{ width: '1.5rem' }}>
        {index + 1}
      </span>

      <input
        type="number"
        inputMode="decimal"
        value={weight}
        onChange={(e) => setWeight(e.target.value)}
        onBlur={() => save({ weightKg: Number(weight) || 0 })}
        style={{ flex: 1 }}
      />

      <span className="muted">×</span>

      <input
        type="number"
        inputMode="numeric"
        value={reps}
        onChange={(e) => setReps(e.target.value)}
        onBlur={() => save({ reps: Number(reps) || 0 })}
        style={{ flex: 1 }}
      />

      <select
        aria-label="Set type"
        value={set.type}
        onChange={(e) => save({ type: e.target.value as SetType })}
      >
        {SET_TYPES.map((t) => (
          <option key={t.value} value={t.value}>
            {t.label[0]}
          </option>
        ))}
      </select>

      <button
        className="icon-btn"
        aria-label={`Delete set ${index + 1}`}
        onClick={() => set.id && deleteSet(set.id)}
      >
        ×
      </button>
    </div>
  )
}

function groupByExercise(sets: WorkoutSet[]) {
  const map = new Map<string, { key: string; name: string; order: number; sets: WorkoutSet[] }>()

  for (const set of sets) {
    const existing = map.get(set.exerciseKey)
    if (existing) existing.sets.push(set)
    else
      map.set(set.exerciseKey, {
        key: set.exerciseKey,
        name: set.exerciseName,
        order: set.order,
        sets: [set],
      })
  }

  return [...map.values()].sort((a, b) => a.order - b.order)
}
