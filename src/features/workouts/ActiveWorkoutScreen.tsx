import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useLiveQuery } from 'dexie-react-hooks'
import {
  activeWorkout,
  startWorkout,
  deleteWorkout,
  removeExerciseFromWorkout,
  getSets,
  addSet,
  updateSet,
  deleteSet,
  setRestSecondsForExercise,
  setRpeForExercise,
  lastSetsFor,
  workoutVolume,
  completedSets,
  isSetCompleted,
} from '../../data/workouts'
import { listRoutines, startWorkoutFromRoutine } from '../../data/routines'
import { findExercise } from '../../data/exercises'
import { playBeep } from '../../data/audio'
import { ExercisePicker } from './ExercisePicker'
import { REST_OPTIONS, formatTime, formatRestLabel } from './rest'
import { EquipmentIcon } from '../../components/EquipmentIcon'
import { Button, Card, Empty, Fab } from '../../components/ui'
import type { SetType, WorkoutSet } from '../../data/types'
import { parseDecimal } from '../../data/numbers'
import { useConfirm } from '../../components/DialogProvider'
import { OptionSheet } from '../../components/OptionSheet'
import { RPE_OPTIONS, formatRpe } from './rpe'

const SET_TYPES: { value: SetType; label: string }[] = [
  { value: 'normal', label: 'Normal' },
  { value: 'warmup', label: 'Warm-up' },
  { value: 'drop', label: 'Drop' },
  { value: 'failure', label: 'Failure' },
]

const SET_COL = '1.75rem'
const NUM_COL = '3.5rem'
const CHECK_COL = '2.625rem'

// Stores the wall-clock end time rather than a counter. A counter driven by
// setTimeout stops advancing when the phone locks; the clock doesn't.
interface RestTimer {
  exerciseKey: string
  endsAt: number
}

export function ActiveWorkoutScreen() {
  const navigate = useNavigate()
  const workout = useLiveQuery(() => activeWorkout(), [])
  const routines = useLiveQuery(() => listRoutines(), [])
  const [picking, setPicking] = useState(false)
  const [timer, setTimer] = useState<RestTimer | null>(null)
  const [now, setNow] = useState(() => Date.now())
  const confirm = useConfirm()

  const sets = useLiveQuery(
    () => (workout?.id ? getSets(workout.id) : Promise.resolve([])),
    [workout?.id]
  )

  useEffect(() => {
    if (!timer) return

    let cancelled = false

    function check() {
      if (cancelled || !timer) return

      if (Date.now() >= timer.endsAt) {
        playBeep()
        if ('vibrate' in navigator) navigator.vibrate([120, 80, 120, 80, 320])
        setTimer(null)
        return
      }

      // Only re-render when the displayed second actually changes.
      const stamp = Date.now()
      setNow((cur) => (Math.floor(stamp / 1000) === Math.floor(cur / 1000) ? cur : stamp))
    }

    // 250ms so returning to the foreground fires the chime promptly
    // rather than up to a second late.
    const handle = setInterval(check, 250)

    function onVisible() {
      if (document.visibilityState === 'visible') check()
    }
    document.addEventListener('visibilitychange', onVisible)

    check()

    return () => {
      cancelled = true
      clearInterval(handle)
      document.removeEventListener('visibilitychange', onVisible)
    }
  }, [timer])

  useEffect(() => {
    if (!workout || workout.finishedAt) return
    const handle = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(handle)
  }, [workout?.id, workout?.finishedAt])

  function startTimer(exerciseKey: string, seconds: number) {
    if (seconds <= 0) return
    setTimer({ exerciseKey, endsAt: Date.now() + seconds * 1000 })
  }

  function skipTimer() {
    setTimer(null)
  }

  function extendTimer(delta: number) {
    setTimer((cur) => (cur ? { ...cur, endsAt: cur.endsAt + delta * 1000 } : cur))
  }

  if (workout === undefined) return <Empty>Loading…</Empty>

  if (!workout) {
    return (
      <div className="stack">
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
            await startWorkout()
          }}
        >
          Start empty workout
        </Button>

        {(routines ?? []).length > 0 && <h3 style={{ marginTop: '1.25rem' }}>Routines</h3>}

        {(routines ?? []).map((r) => (
          <Button
            key={r.id}
            block
            onClick={async () => {
              await startWorkoutFromRoutine(r.id!)
            }}
          >
            {r.name}
          </Button>
        ))}
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
  const setCount = completedSets(sets ?? []).length
  const elapsedSeconds = Math.max(0, Math.floor((now - new Date(workout.startedAt).getTime()) / 1000))
  const restRemaining = timer ? Math.max(0, Math.ceil((timer.endsAt - now) / 1000)) : 0

  async function handleDiscard() {
    const ok = await confirm({
      title: 'Discard this workout?',
      message: 'Everything logged in this session will be deleted.',
      confirmLabel: 'Discard',
      destructive: true,
    })
    if (ok) await deleteWorkout(workout!.id!)
  }

  return (
    <div>
      <div className="workout-sticky">
        <div className="row" style={{ marginBottom: '0.75rem', justifyContent: 'flex-end' }}>
          <Button size="sm" variant="ghost" onClick={handleDiscard}>
            Discard
          </Button>
          <Button size="sm" variant="primary" onClick={() => navigate('/workouts/finish')}>
            Finish
          </Button>
        </div>

        <Card>
          <div className="row" style={{ textAlign: 'center' }}>
            <div className="grow">
              <div className="faint">Duration</div>
              <div className="stat-sm">{formatDuration(elapsedSeconds)}</div>
            </div>
            <div className="grow">
              <div className="faint">Volume</div>
              <div className="stat-sm">{Math.round(volume)}</div>
            </div>
            <div className="grow">
              <div className="faint">Sets</div>
              <div className="stat-sm">{setCount}</div>
            </div>
          </div>
        </Card>
      </div>

      <div style={{ marginTop: '1rem' }}>
        {grouped.map((group) => (
          <ExerciseBlock
            key={group.key}
            workoutId={workout.id}
            exerciseKey={group.key}
            exerciseName={group.name}
            order={group.order}
            sets={group.sets}
            activeRestKey={timer?.exerciseKey ?? null}
            restRemaining={restRemaining}
            onStartTimer={startTimer}
            onExtendTimer={extendTimer}
            onSkipTimer={skipTimer}
          />
        ))}
      </div>

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
  activeRestKey,
  restRemaining,
  onStartTimer,
  onExtendTimer,
  onSkipTimer,
}: {
  workoutId: string
  exerciseKey: string
  exerciseName: string
  order: number
  sets: WorkoutSet[]
  activeRestKey: string | null
  restRemaining: number
  onStartTimer: (exerciseKey: string, seconds: number) => void
  onExtendTimer: (delta: number) => void
  onSkipTimer: () => void
}) {
  const navigate = useNavigate()
  const confirm = useConfirm()
  const [previous, setPrevious] = useState<WorkoutSet[]>([])
  const [equipment, setEquipment] = useState<string | undefined>()
  const [menu, setMenu] = useState<'none' | 'actions' | 'rest' | 'rpe'>('none')

  useEffect(() => {
    lastSetsFor(exerciseKey, workoutId).then(setPrevious)
  }, [exerciseKey, workoutId])

  useEffect(() => {
    findExercise(exerciseKey).then((e) => setEquipment(e?.equipment))
  }, [exerciseKey])

  const restSeconds = sets[0]?.restSeconds ?? 90
  const targetRpe = sets[0]?.rpe
  const nonWarmup = sets.filter((s) => s.type !== 'warmup')
  const doneCount = nonWarmup.filter(isSetCompleted).length

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
      restSeconds: last?.restSeconds ?? 90,
    })
  }

  async function setRest(seconds: number) {
    await setRestSecondsForExercise(workoutId, exerciseKey, seconds)
  }

  async function handleRemove() {
    const ok = await confirm({
      title: `Remove ${exerciseName}?`,
      message: 'All its sets in this workout will be deleted.',
      confirmLabel: 'Remove',
      destructive: true,
    })
    if (ok) await removeExerciseFromWorkout(workoutId, exerciseKey)
  }

  let setNumber = 0

  return (
    <Card style={{ marginBottom: '0.75rem' }}>
      <div className="row" style={{ alignItems: 'flex-start' }}>
        <div
          style={{
            width: 48,
            height: 48,
            borderRadius: 'var(--radius-sm)',
            background: 'var(--surface-2)',
            flexShrink: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'var(--accent)',
          }}
        >
          <EquipmentIcon equipment={equipment} size={24} />
        </div>
        <div className="grow">
          <strong style={{ display: 'block' }}>{exerciseName}</strong>
          <span className="muted">
            {doneCount}/{nonWarmup.length} done
          </span>
        </div>
        <button
          className="icon-btn"
          aria-label={`Options for ${exerciseName}`}
          onClick={() => setMenu('actions')}
        >
          ⋮
        </button>
      </div>

      <div className="row rest-row">
        {activeRestKey === exerciseKey ? (
          <>
            <span className="grow rest-live">⏱ Rest {formatTime(restRemaining)}</span>
            <Button size="sm" onClick={() => onExtendTimer(15)}>
              +15s
            </Button>
            <Button size="sm" variant="ghost" onClick={onSkipTimer}>
              Skip
            </Button>
          </>
        ) : (
          <button className="btn-plain muted grow" onClick={() => setMenu('rest')}>
            ⏱ Rest timer: {formatRestLabel(restSeconds)}
          </button>
        )}
      </div>

      <div className="row rest-row">
        <button className="btn-plain muted grow" onClick={() => setMenu('rpe')}>
          ◎ Target RPE: {formatRpe(targetRpe)}
        </button>
      </div>

      <div className="row set-header">
        <span style={{ width: SET_COL, textAlign: 'center' }}>SET</span>
        <span className="grow">PREVIOUS</span>
        <span style={{ width: NUM_COL, textAlign: 'center' }}>KG</span>
        <span style={{ width: NUM_COL, textAlign: 'center' }}>REPS</span>
        <span style={{ width: CHECK_COL, textAlign: 'center' }}>✓</span>
      </div>

      <div>
        {sets.map((set, i) => {
          if (set.type !== 'warmup') setNumber++
          const label = setLabel(set.type, setNumber)
          return (
            <SetRow
              key={set.id}
              set={set}
              label={label}
              hint={previous[i]}
              onCompleted={(seconds) => onStartTimer(exerciseKey, seconds)}
            />
          )
        })}
      </div>

      <Button size="sm" onClick={addAnother} style={{ marginTop: '0.5rem' }}>
        Add set {sets.length + 1}
      </Button>

      {menu === 'actions' && (
        <OptionSheet
          title={exerciseName}
          onClose={() => setMenu('none')}
          options={[
            {
              label: 'View exercise',
              onSelect: () => {
                setMenu('none')
                navigate(`/workouts/exercises/${encodeURIComponent(exerciseKey)}`)
              },
            },
            { label: 'Set rest timer', onSelect: () => setMenu('rest') },
            { label: 'Set target RPE', onSelect: () => setMenu('rpe') },
            {
              label: 'Remove exercise',
              onSelect: () => {
                setMenu('none')
                handleRemove()
              },
            },
          ]}
        />
      )}

      {menu === 'rest' && (
        <OptionSheet
          title="Rest timer"
          onClose={() => setMenu('none')}
          options={REST_OPTIONS.map((o) => ({
            label: o.label,
            active: o.seconds === restSeconds,
            onSelect: () => {
              setRest(o.seconds)
              setMenu('none')
            },
          }))}
        />
      )}
            {menu === 'rpe' && (
        <OptionSheet
          title="Target RPE"
          onClose={() => setMenu('none')}
          options={RPE_OPTIONS.map((o) => ({
            label: o.label,
            active: o.value === targetRpe,
            onSelect: () => {
              setRpeForExercise(workoutId, exerciseKey, o.value)
              setMenu('none')
            },
          }))}
        />
      )}
    </Card>
  )
}

function SetRow({
  set,
  label,
  hint,
  onCompleted,
}: {
  set: WorkoutSet
  label: string
  hint?: WorkoutSet
  onCompleted: (restSeconds: number) => void
}) {
  const [weight, setWeight] = useState(String(set.weightKg || ''))
  const [reps, setReps] = useState(String(set.reps || ''))
  const [typeMenuOpen, setTypeMenuOpen] = useState(false)
  const [needsReps, setNeedsReps] = useState(false)
  const repsRef = useRef<HTMLInputElement>(null)

  const completed = isSetCompleted(set)

  async function commit(changes: { weightKg?: number; reps?: number; type?: SetType }) {
    await updateSet(set.id!, changes)
  }

  /**
   * Both inputs are text, not number. `type="number"` let Chrome sanitise the
   * value before we ever saw it: typing '67,5' on a German keyboard dropped
   * the comma and closed the digits up, saving 675kg with no error anywhere.
   * A wrong set weight is worse than a wrong body weight because it also
   * poisons volume, 1RM and the PR list, which stay wrong after the row is
   * corrected.
   *
   * On blur the draft is rewritten to what was actually stored, so what is on
   * screen and what is in Dexie can never disagree — the 2.1.1 bug was
   * precisely a field that looked like it had accepted the input.
   */
  function commitWeight() {
    const parsed = parseDecimal(weight)
    const value = typeof parsed === 'number' ? parsed : 0
    setWeight(value ? String(value) : '')
    void commit({ weightKg: value })
  }

  function commitReps() {
    const parsed = parseDecimal(reps)
    // Reps are whole. A typed decimal is a slip, not an intention.
    const value = typeof parsed === 'number' ? Math.round(parsed) : 0
    setReps(value ? String(value) : '')
    void commit({ reps: value })
  }

  function flagMissingReps() {
    setNeedsReps(true)
    repsRef.current?.focus()
    window.setTimeout(() => setNeedsReps(false), 1400)
  }

  async function toggleComplete() {
    if (completed) {
      await updateSet(set.id!, { completed: false })
      return
    }

    // Reps decide whether a set counts. Weight does not: 0 kg is a
    // bodyweight set, which is a real answer rather than a missing one.
    const parsedReps = parseDecimal(reps)
    const typedReps = typeof parsedReps === 'number' ? Math.round(parsedReps) : NaN
    const repsVal = Number.isFinite(typedReps) && typedReps > 0 ? typedReps : (hint?.reps ?? 0)

    if (repsVal <= 0) {
      flagMissingReps()
      return
    }

    const parsedWeight = parseDecimal(weight)
    const typedWeight = typeof parsedWeight === 'number' ? parsedWeight : NaN
    const weightVal =
      Number.isFinite(typedWeight) && typedWeight >= 0 ? typedWeight : (hint?.weightKg ?? 0)

    setWeight(String(weightVal || ''))
    setReps(String(repsVal))
    await updateSet(set.id!, { weightKg: weightVal, reps: repsVal, completed: true })
    onCompleted(set.restSeconds ?? 90)
  }

  return (
    <div className={`row set-row${completed ? ' set-row-completed' : ''}`}>
      <button
        className={`btn-plain set-type-${set.type}`}
        style={{ width: SET_COL, textAlign: 'center', fontWeight: 600 }}
        onClick={() => setTypeMenuOpen(true)}
        aria-label={`Set ${label}, tap to change type or delete`}
      >
        {label}
      </button>

      <span
        className="faint grow"
        style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}
      >
        {hint ? (hint.weightKg > 0 ? `${hint.weightKg}kg × ${hint.reps}` : `${hint.reps} reps`) : '–'}
      </span>

      <input
        type="text"
        inputMode="decimal"
        value={weight}
        placeholder={hint && hint.weightKg > 0 ? String(hint.weightKg) : '–'}
        onChange={(e) => setWeight(e.target.value)}
        onBlur={commitWeight}
        style={{ width: NUM_COL }}
      />

      <input
        ref={repsRef}
        type="text"
        inputMode="numeric"
        className={needsReps ? 'set-input-invalid' : undefined}
        value={reps}
        placeholder={hint ? String(hint.reps) : '–'}
        onChange={(e) => {
          setNeedsReps(false)
          setReps(e.target.value)
        }}
        onBlur={commitReps}
        style={{ width: NUM_COL }}
      />

      <button
        className={`check-btn${completed ? ' active' : ''}`}
        style={{ width: CHECK_COL }}
        aria-label={completed ? `Mark set ${label} incomplete` : `Mark set ${label} complete`}
        onClick={toggleComplete}
      >
        ✓
      </button>

      {typeMenuOpen && (
        <OptionSheet
          title="Set type"
          onClose={() => setTypeMenuOpen(false)}
          options={[
            ...SET_TYPES.map((t) => ({
              label: t.label,
              active: t.value === set.type,
              className: `set-type-${t.value}`,
              onSelect: () => {
                commit({ type: t.value })
                setTypeMenuOpen(false)
              },
            })),
            {
              label: 'Remove set',
              onSelect: () => {
                setTypeMenuOpen(false)
                if (set.id) deleteSet(set.id)
              },
            },
          ]}
        />
      )}
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

function formatDuration(totalSeconds: number): string {
  const h = Math.floor(totalSeconds / 3600)
  const m = Math.floor((totalSeconds % 3600) / 60)
  const s = totalSeconds % 60
  return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
}

function setLabel(type: SetType, seqNumber: number): string {
  if (type === 'warmup') return 'W'
  if (type === 'drop') return 'D'
  if (type === 'failure') return 'F'
  return String(seqNumber)
}