import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useLiveQuery } from 'dexie-react-hooks'
import {
  activeWorkout,
  startWorkout,
  finishWorkout,
  deleteWorkout,
  getSets,
  addSet,
  updateSet,
  deleteSet,
  lastSetsFor,
  workoutVolume,
} from '../../data/workouts'
import { ExercisePicker } from './ExercisePicker'
import { Button, Card, Empty, Fab, ScreenHeader } from '../../components/ui'
import type { SetType, WorkoutSet } from '../../data/types'

const SET_TYPES: { value: SetType; label: string }[] = [
  { value: 'normal', label: 'Normal' },
  { value: 'warmup', label: 'Warm-up' },
  { value: 'drop', label: 'Drop' },
  { value: 'failure', label: 'Failure' },
]

export function ActiveWorkoutScreen() {
  const navigate = useNavigate()
  const workout = useLiveQuery(() => activeWorkout(), [])
  const [picking, setPicking] = useState(false)

  const sets = useLiveQuery(
    () => (workout?.id ? getSets(workout.id) : Promise.resolve([])),
    [workout?.id]
  )

  if (workout === undefined) return <Empty>Loading…</Empty>

  if (!workout) {
    return (
      <div className="stack">
        <ScreenHeader title="Workout" />
        <Card>
          <p style={{ margin: 0 }}>No workout in progress.</p>
          <p className="muted" style={{ margin: '0.5rem 0 0' }}>
            Start one and log your sets as you go.
          </p>
        </Card>
        <Button
          variant="primary"
          block
          onClick={async () => {
            await startWorkout(defaultName())
          }}
        >
          Start a workout
        </Button>
      </div>
    )
  }

  if (picking) {
    return (
      <ExercisePicker
        onCancel={() => setPicking(false)}
        onPick={async (ex) => {
          const existing = sets ?? []
          const maxOrder = existing.reduce((m, s) => Math.max(m, s.order), -1)
          await addSet({
            workoutId: workout.id!,
            exerciseKey: ex.key,
            exerciseName: ex.name,
            order: maxOrder + 1,
            setNumber: 1,
            weightKg: 0,
            reps: 0,
            type: 'normal',
          })
          setPicking(false)
        }}
      />
    )
  }

  const grouped = groupByExercise(sets ?? [])
  const volume = workoutVolume(sets ?? [])

  return (
    <div>
      <ScreenHeader
        title={workout.name}
        action={
          <span className="row">
            <Button
              size="sm"
              variant="ghost"
              onClick={async () => {
                if (confirm('Discard this workout? Everything logged will be deleted.')) {
                  await deleteWorkout(workout.id!)
                }
              }}
            >
              Discard
            </Button>
            <Button
              size="sm"
              variant="primary"
              onClick={async () => {
                if (confirm('Finish this workout?')) {
                  await finishWorkout(workout.id!)
                  navigate('/workouts/history')
                }
              }}
            >
              Finish
            </Button>
          </span>
        }
      />

      <Card style={{ marginBottom: '1rem' }}>
        <div className="row">
          <span className="grow muted">Volume</span>
          <strong>{Math.round(volume)} kg</strong>
        </div>
        <div className="row">
          <span className="grow muted">Sets</span>
          <strong>{(sets ?? []).filter((s) => s.type !== 'warmup').length}</strong>
        </div>
      </Card>

      {grouped.map((group) => (
        <ExerciseBlock
          key={group.key}
          workoutId={workout.id!}
          exerciseKey={group.key}
          exerciseName={group.name}
          order={group.order}
          sets={group.sets}
        />
      ))}

      <Fab label="Add exercise" onClick={() => setPicking(true)} />
    </div>
  )
}

function ExerciseBlock({
  workoutId,
  exerciseKey,
  exerciseName,
  order,
  sets,
}: {
  workoutId: number
  exerciseKey: string
  exerciseName: string
  order: number
  sets: WorkoutSet[]
}) {
  const [previous, setPrevious] = useState<WorkoutSet[]>([])

  useEffect(() => {
    lastSetsFor(exerciseKey, workoutId).then(setPrevious)
  }, [exerciseKey, workoutId])

  async function addAnother() {
    const last = sets[sets.length - 1]
    await addSet({
      workoutId,
      exerciseKey,
      exerciseName,
      order,
      setNumber: sets.length + 1,
      weightKg: last?.weightKg ?? 0,
      reps: last?.reps ?? 0,
      type: 'normal',
    })
  }

  return (
    <Card style={{ marginBottom: '0.75rem' }}>
      <strong>{exerciseName}</strong>

      {previous.length > 0 && (
        <p className="muted" style={{ margin: '0.25rem 0 0.5rem' }}>
          Last time: {previous.map((s) => `${s.weightKg}×${s.reps}`).join(', ')}
        </p>
      )}

      <div style={{ marginTop: '0.5rem' }}>
        {sets.map((set, i) => (
          <SetRow key={set.id} set={set} index={i} hint={previous[i]} />
        ))}
      </div>

      <Button size="sm" onClick={addAnother} style={{ marginTop: '0.5rem' }}>
        Add set
      </Button>
    </Card>
  )
}

function SetRow({
  set,
  index,
  hint,
}: {
  set: WorkoutSet
  index: number
  hint?: WorkoutSet
}) {
  const [weight, setWeight] = useState(String(set.weightKg || ''))
  const [reps, setReps] = useState(String(set.reps || ''))

  async function save(changes: { weightKg?: number; reps?: number; type?: SetType }) {
    await updateSet(set.id!, changes)
  }

  return (
    <div className="row" style={{ marginBottom: '0.4rem' }}>
      <span className="muted" style={{ width: '1.5rem' }}>
        {index + 1}
      </span>

      <input
        type="number"
        inputMode="decimal"
        value={weight}
        placeholder={hint ? String(hint.weightKg) : 'kg'}
        onChange={(e) => setWeight(e.target.value)}
        onBlur={() => save({ weightKg: Number(weight) || 0 })}
        style={{ flex: 1, padding: '0.4rem' }}
      />

      <span className="muted">×</span>

      <input
        type="number"
        inputMode="numeric"
        value={reps}
        placeholder={hint ? String(hint.reps) : 'reps'}
        onChange={(e) => setReps(e.target.value)}
        onBlur={() => save({ reps: Number(reps) || 0 })}
        style={{ flex: 1, padding: '0.4rem' }}
      />

      <select
        value={set.type}
        onChange={(e) => save({ type: e.target.value as SetType })}
        style={{ width: 'auto', padding: '0.4rem', fontSize: '0.75rem' }}
      >
        {SET_TYPES.map((t) => (
          <option key={t.value} value={t.value}>
            {t.label[0]}
          </option>
        ))}
      </select>

      <Button size="sm" variant="ghost" onClick={() => set.id && deleteSet(set.id)}>
        ×
      </Button>
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

function defaultName(): string {
  const h = new Date().getHours()
  if (h < 11) return 'Morning workout'
  if (h < 17) return 'Afternoon workout'
  return 'Evening workout'
}