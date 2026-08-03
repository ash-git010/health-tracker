import { useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { useLiveQuery } from 'dexie-react-hooks'
import { Pencil, X, ChevronRight } from 'lucide-react'
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
import { getRoutine } from '../../data/routines'
import { formatDay } from '../../data/dates'
import { formatRestLabel } from './rest'
import { Button, Card, Empty, InlineRename, ScreenHeader } from '../../components/ui'
import { useConfirm } from '../../components/DialogProvider'
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
  const confirm = useConfirm()
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

  async function handleDelete() {
    const ok = await confirm({
      title: `Delete ${workout!.name || 'this workout'}?`,
      message: 'This workout and all its sets will be removed.',
      confirmLabel: 'Delete',
      destructive: true,
    })
    if (!ok) return
    await deleteWorkout(workoutId)
    navigate('/workouts/history')
  }

  return (
    <div style={{ paddingBottom: '2rem' }}>
      <ScreenHeader
        title={workout.name || 'Workout'}
        onBack={() => navigate('/workouts/history')}
        action={
          <button className="icon-btn" aria-label="Rename workout" onClick={() => setRenaming(true)}>
            <Pencil size={16} />
          </button>
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

      <Card style={{ marginBottom: '1.5rem' }}>
        <div className="row" style={{ textAlign: 'center' }}>
          <div className="grow">
            <div className="faint">Volume</div>
            <div className="stat-sm">{Math.round(volume)}</div>
          </div>
          <div className="grow">
            <div className="faint">Sets</div>
            <div className="stat-sm">{completedSets(sets).length}</div>
          </div>
          <div className="grow">
            <div className="faint">Exercises</div>
            <div className="stat-sm">{grouped.length}</div>
          </div>
        </div>
        <div className="faint" style={{ textAlign: 'center', marginTop: '0.75rem' }}>
          {formatDay(workout.date)}
        </div>
      </Card>

      {workout.notes && (
        <Card style={{ marginBottom: '1.5rem' }}>
          <p className="muted" style={{ margin: 0 }}>
            {workout.notes}
          </p>
        </Card>
      )}

      {grouped.map((group) => (
        <Card key={group.key} style={{ marginBottom: '0.75rem' }}>
          <Link
            to={`/workouts/exercises/${encodeURIComponent(group.key)}`}
            className="row"
            style={{ color: 'inherit', textDecoration: 'none' }}
          >
            <strong className="grow" style={{ minWidth: 0 }}>
              {group.name}
            </strong>
            <ChevronRight size={16} style={{ color: 'var(--text-faint)', flexShrink: 0 }} />
          </Link>
          <div className="faint">Rest: {formatRestLabel(group.sets[0]?.restSeconds ?? 90)}</div>
          <div style={{ marginTop: '0.6rem' }}>
            {group.sets.map((set, i) => (
              <SetRow key={set.id} set={set} index={i} />
            ))}
          </div>
        </Card>
      ))}

      <div className="stack" style={{ marginTop: '1.5rem' }}>
        {workout.routineId ? (
          <p className="muted" style={{ margin: 0 }}>
            Saved as routine: {routine?.name ?? '…'}
          </p>
        ) : (
          <Button
            block
            onClick={() => navigate(`/workouts/history/${workoutId}/save-as-routine`)}
          >
            Save as routine
          </Button>
        )}
        <Button variant="ghost" className="btn-warn" block onClick={handleDelete}>
          Delete workout
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
      <span
        className={`faint set-type-${set.type}`}
        style={{ width: '1.5rem', textAlign: 'center', fontWeight: 600 }}
      >
        {setLabel(set.type, index + 1)}
      </span>

      <input
        type="number"
        inputMode="decimal"
        value={weight}
        onChange={(e) => setWeight(e.target.value)}
        onBlur={() => save({ weightKg: Number(weight) || 0 })}
        style={{ flex: 1 }}
      />

      <span className="faint">×</span>

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
        <X size={16} />
      </button>
    </div>
  )
}

function setLabel(type: SetType, seqNumber: number): string {
  if (type === 'warmup') return 'W'
  if (type === 'drop') return 'D'
  if (type === 'failure') return 'F'
  return String(seqNumber)
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