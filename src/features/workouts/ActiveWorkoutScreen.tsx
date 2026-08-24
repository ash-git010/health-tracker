import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useLiveQuery } from 'dexie-react-hooks'
import {
  activeWorkout,
  startWorkout,
  deleteWorkout,
  removeExerciseFromWorkout,
  swapExerciseInWorkout,
  getSets,
  getAllSets,
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
import { isAllTimePR } from '../../data/workoutStats'
import { listRoutines, startWorkoutFromRoutine, getRoutineExercises } from '../../data/routines'
import {
  activeProgram,
  listPrograms,
  activateProgram,
  deactivateProgram,
  getProgramDays,
  currentWeekNumber,
  todaysProgramDay,
  isProgramComplete,
} from '../../data/programs'
import { findExercise, allExercises, suggestSubstitutes, type ExerciseOption } from '../../data/exercises'
import { playBeep } from '../../data/audio'
import { ExercisePicker } from './ExercisePicker'
import { restOptions, formatTime, formatRestLabel } from './rest'
import { EquipmentIcon } from '../../components/EquipmentIcon'
import { Button, Card, Empty } from '../../components/ui'
import type { SetType, WorkoutSet, Program, ProgramDay, Routine } from '../../data/types'
import { parseDecimal } from '../../data/numbers'
import { useConfirm } from '../../components/DialogProvider'
import { OptionSheet } from '../../components/OptionSheet'
import { rpeOptions, formatRpe } from './rpe'
import { t, plural } from '../../data/i18n'
import { Plus, Crown } from 'lucide-react'

function setTypeOptions(): { value: SetType; label: string }[] {
  return [
    { value: 'normal', label: t('setType.normal') },
    { value: 'warmup', label: t('setType.warmup') },
    { value: 'drop', label: t('setType.drop') },
    { value: 'failure', label: t('setType.failure') },
  ]
}

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
  const program = useLiveQuery(() => activeProgram(), [])
  const programs = useLiveQuery(() => listPrograms(), [])
  const programDays = useLiveQuery(
    () => (program?.id ? getProgramDays(program.id) : Promise.resolve([])),
    [program?.id]
  )
  const [picking, setPicking] = useState(false)
  const [swapTarget, setSwapTarget] = useState<string | null>(null)
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

  // A rest timer belongs to the workout that started it. Without this, a
  // timer left running when a workout is discarded or finished used to be
  // harmless — nothing rendered it once its exercise card was gone. Now that
  // the countdown lives in a workout-independent floating bar, an uncleared
  // timer would keep counting down over whatever workout (or none) starts next.
  useEffect(() => {
    setTimer(null)
  }, [workout?.id])

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

  if (workout === undefined) return <Empty>{t('common.loading')}</Empty>

  if (!workout) {
    return (
      <NoWorkoutView
        program={program}
        programDays={programDays ?? []}
        programs={programs ?? []}
        routines={routines ?? []}
      />
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

  if (swapTarget) {
    return (
      <ExercisePicker
        onCancel={() => setSwapTarget(null)}
        onPick={async (ex) => {
          await swapExerciseInWorkout(workout.id!, swapTarget, { key: ex.key, name: ex.name })
          setSwapTarget(null)
        }}
      />
    )
  }

  const grouped = groupByExercise(sets ?? [])
  const volume = workoutVolume(sets ?? [])
  const setCount = completedSets(sets ?? []).length
  const elapsedSeconds = Math.max(0, Math.floor((now - new Date(workout.startedAt).getTime()) / 1000))
  const restRemaining = timer ? Math.max(0, Math.ceil((timer.endsAt - now) / 1000)) : 0
  const routineNotes = (sets ?? [])[0]?.notes

  async function handleDiscard() {
    const ok = await confirm({
      title: t('activeWorkout.discardTitle'),
      message: t('activeWorkout.discardMessage'),
      confirmLabel: t('activeWorkout.discard'),
      destructive: true,
    })
    if (ok) await deleteWorkout(workout!.id!)
  }

  // Read after the set that earned it is already saved, and excludes that
  // set from the comparison — see isAllTimePR's own comment on why the
  // incumbent keeps a tie rather than the newly-ticked set.
  async function checkAllTimePR(
    exerciseKey: string,
    weightKg: number,
    reps: number,
    excludeSetId: string
  ): Promise<boolean> {
    const all = await getAllSets()
    return isAllTimePR(all, exerciseKey, weightKg, reps, excludeSetId)
  }

  return (
    <div>
      <div className="workout-sticky">
        <div className="row" style={{ marginBottom: '0.75rem' }}>
          <Button size="sm" variant="ghost" onClick={() => setPicking(true)}>
            <Plus size={14} /> {t('activeWorkout.addExercise')}
          </Button>
          <span className="grow" />
          <Button size="sm" variant="ghost" onClick={handleDiscard}>
            {t('activeWorkout.discard')}
          </Button>
          <Button size="sm" variant="primary" onClick={() => navigate('/workouts/finish')}>
            {t('activeWorkout.finish')}
          </Button>
        </div>

        <Card>
          <div className="row" style={{ textAlign: 'center' }}>
            <div className="grow">
              <div className="faint">{t('activeWorkout.duration')}</div>
              <div className="stat-sm">{formatDuration(elapsedSeconds)}</div>
            </div>
            <div className="grow">
              <div className="faint">{t('activeWorkout.volume')}</div>
              <div className="stat-sm">{Math.round(volume)}</div>
            </div>
            <div className="grow">
              <div className="faint">{t('activeWorkout.sets')}</div>
              <div className="stat-sm">{setCount}</div>
            </div>
          </div>
        </Card>
      </div>

      {routineNotes && (
        <Card style={{ marginTop: '1rem' }}>
          <div className="faint" style={{ marginBottom: '0.25rem' }}>
            {t('activeWorkout.notes')}
          </div>
          <p style={{ margin: 0, whiteSpace: 'pre-wrap' }}>{routineNotes}</p>
        </Card>
      )}

      <div style={{ marginTop: '1rem' }}>
        {grouped.map((group) => (
          <ExerciseBlock
            key={group.key}
            workoutId={workout.id}
            routineId={workout.routineId}
            exerciseKey={group.key}
            exerciseName={group.name}
            order={group.order}
            sets={group.sets}
            onStartTimer={startTimer}
            onCheckPR={checkAllTimePR}
            onSwapSearch={setSwapTarget}
          />
        ))}
      </div>

      {timer && (
        <div className="rest-bar">
          <span className="grow rest-bar-time">⏱ {formatTime(restRemaining)}</span>
          <Button size="sm" onClick={() => extendTimer(15)}>
            +15s
          </Button>
          <Button size="sm" variant="ghost" onClick={skipTimer}>
            {t('activeWorkout.skip')}
          </Button>
        </div>
      )}
    </div>
  )
}

function NoWorkoutView({
  program,
  programDays,
  programs,
  routines,
}: {
  program: Program | null | undefined
  programDays: ProgramDay[]
  programs: Program[]
  routines: Routine[]
}) {
  const [chooserOpen, setChooserOpen] = useState(false)

  if (program === undefined) return <Empty>{t('common.loading')}</Empty>

  if (program) {
    return <ActiveProgramView program={program} programDays={programDays} routines={routines} />
  }

  return (
    <div className="stack">
      <Card>
        <p style={{ margin: 0 }}>{t('activeWorkout.noneTitle')}</p>
        <p className="muted" style={{ margin: '0.5rem 0 0' }}>
          {t('activeWorkout.noneLead')}
        </p>
      </Card>

      <Button variant="primary" block onClick={() => setChooserOpen(true)}>
        {t('activeWorkout.startNew')}
      </Button>

      {chooserOpen && (
        <OptionSheet
          title={t('activeWorkout.startNew')}
          onClose={() => setChooserOpen(false)}
          options={[
            ...programs.map((p) => ({
              label: p.name,
              onSelect: async () => {
                setChooserOpen(false)
                await activateProgram(p.id)
              },
            })),
            ...routines.map((r) => ({
              label: r.name,
              onSelect: async () => {
                setChooserOpen(false)
                await startWorkoutFromRoutine(r.id!)
              },
            })),
            {
              label: t('activeWorkout.startEmpty'),
              onSelect: async () => {
                setChooserOpen(false)
                await startWorkout()
              },
            },
          ]}
        />
      )}
    </div>
  )
}

function ActiveProgramView({
  program,
  programDays,
  routines,
}: {
  program: Program
  programDays: ProgramDay[]
  routines: Routine[]
}) {
  if (isProgramComplete(program, programDays)) {
    return (
      <div className="stack">
        <Card>
          <button
            className="btn-plain"
            style={{ fontWeight: 700, textAlign: 'left' }}
            onClick={() => deactivateProgram(program.id)}
          >
            {program.name}
          </button>
          <p className="muted" style={{ margin: '0.5rem 0 0' }}>{t('activeWorkout.complete')}</p>
        </Card>
      </div>
    )
  }

  const week = currentWeekNumber(program)
  const day = todaysProgramDay(program, programDays)
  const routine = day?.routineId ? routines.find((r) => r.id === day.routineId) : undefined

  return (
    <div className="stack">
      <Card>
        <button
          className="btn-plain"
          style={{ fontWeight: 700, textAlign: 'left' }}
          onClick={() => deactivateProgram(program.id)}
        >
          {program.name}
        </button>
        <p className="muted" style={{ margin: '0.25rem 0 0' }}>
          {t('activeWorkout.weekLabel', { n: week })}
        </p>
      </Card>

      {routine ? (
        <Button
          variant="primary"
          block
          onClick={async () => {
            await startWorkoutFromRoutine(routine.id!, day!.id)
          }}
        >
          {t('activeWorkout.startToday', { name: routine.name })}
        </Button>
      ) : (
        <Card>
          <p className="muted" style={{ margin: 0 }}>{t('activeWorkout.noWorkoutToday')}</p>
        </Card>
      )}

      <Button
        block
        onClick={async () => {
          await startWorkout()
        }}
      >
        {t('activeWorkout.startEmpty')}
      </Button>
    </div>
  )
}

function ExerciseBlock({
  workoutId,
  routineId,
  exerciseKey,
  exerciseName,
  order,
  sets,
  onStartTimer,
  onCheckPR,
  onSwapSearch,
}: {
  workoutId: string
  routineId?: string
  exerciseKey: string
  exerciseName: string
  order: number
  sets: WorkoutSet[]
  onStartTimer: (exerciseKey: string, seconds: number) => void
  onCheckPR: (
    exerciseKey: string,
    weightKg: number,
    reps: number,
    excludeSetId: string
  ) => Promise<boolean>
  onSwapSearch: (exerciseKey: string) => void
}) {
  const navigate = useNavigate()
  const confirm = useConfirm()
  const [previous, setPrevious] = useState<WorkoutSet[]>([])
  const [equipment, setEquipment] = useState<string | undefined>()
  const [menu, setMenu] = useState<'none' | 'actions' | 'rest' | 'rpe' | 'swap'>('none')
  const [swapSuggestions, setSwapSuggestions] = useState<ExerciseOption[]>([])

  useEffect(() => {
    lastSetsFor(exerciseKey, workoutId).then(setPrevious)
  }, [exerciseKey, workoutId])

  useEffect(() => {
    findExercise(exerciseKey).then((e) => setEquipment(e?.equipment))
  }, [exerciseKey])

  useEffect(() => {
    if (menu !== 'swap') return
    let cancelled = false

    async function load() {
      const [current, all] = await Promise.all([findExercise(exerciseKey), allExercises()])
      if (!current) return

      const stored: ExerciseOption[] = []
      if (routineId) {
        const routineExercises = await getRoutineExercises(routineId)
        const match = routineExercises.find((re) => re.exerciseKey === exerciseKey)
        for (const key of match?.substitutes ?? []) {
          const ex = all.find((e) => e.key === key)
          if (ex) stored.push(ex)
        }
      }

      const suggested = suggestSubstitutes(current, all).filter(
        (e) => !stored.some((s) => s.key === e.key)
      )

      if (!cancelled) setSwapSuggestions([...stored, ...suggested].slice(0, 8))
    }

    load()
    return () => {
      cancelled = true
    }
  }, [menu, exerciseKey, routineId])

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

  function checkPR(weightKg: number, reps: number, excludeSetId: string) {
    return onCheckPR(exerciseKey, weightKg, reps, excludeSetId)
  }

  async function handleRemove() {
    const ok = await confirm({
      title: t('activeWorkout.removeExerciseTitle', { name: exerciseName }),
      message: t('activeWorkout.removeExerciseMessage'),
      confirmLabel: t('activeWorkout.removeConfirm'),
      destructive: true,
    })
    if (ok) await removeExerciseFromWorkout(workoutId, exerciseKey)
  }

  async function handleSwap(ex: ExerciseOption) {
    setMenu('none')
    await swapExerciseInWorkout(workoutId, exerciseKey, { key: ex.key, name: ex.name })
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
            {t('activeWorkout.doneCount', { done: doneCount, total: nonWarmup.length })}
          </span>
        </div>
        <button
          className="icon-btn"
          aria-label={t('activeWorkout.optionsFor', { name: exerciseName })}
          onClick={() => setMenu('actions')}
        >
          ⋮
        </button>
      </div>

      <div className="row rest-row">
        <button className="btn-plain muted grow" onClick={() => setMenu('rest')}>
          ⏱ {t('activeWorkout.restTimer', { label: formatRestLabel(restSeconds) })}
        </button>
      </div>

      <div className="row rest-row">
        <button className="btn-plain muted grow" onClick={() => setMenu('rpe')}>
          ◎ {t('activeWorkout.targetRpeRow', { value: formatRpe(targetRpe) })}
        </button>
      </div>

      <div className="row set-header">
        <span style={{ width: SET_COL, textAlign: 'center' }}>{t('activeWorkout.colSet')}</span>
        <span className="grow">{t('activeWorkout.colPrevious')}</span>
        <span style={{ width: NUM_COL, textAlign: 'center' }}>{t('activeWorkout.colKg')}</span>
        <span style={{ width: NUM_COL, textAlign: 'center' }}>{t('activeWorkout.colReps')}</span>
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
              checkPR={checkPR}
            />
          )
        })}
      </div>

      <Button size="sm" onClick={addAnother} style={{ marginTop: '0.5rem' }}>
        {t('activeWorkout.addSet', { n: sets.length + 1 })}
      </Button>

      {menu === 'actions' && (
        <OptionSheet
          title={exerciseName}
          onClose={() => setMenu('none')}
          options={[
            {
              label: t('activeWorkout.viewExercise'),
              onSelect: () => {
                setMenu('none')
                navigate(`/workouts/exercises/${encodeURIComponent(exerciseKey)}`)
              },
            },
            { label: t('activeWorkout.setRestTimer'), onSelect: () => setMenu('rest') },
            { label: t('activeWorkout.setTargetRpe'), onSelect: () => setMenu('rpe') },
            { label: t('activeWorkout.swapExercise'), onSelect: () => setMenu('swap') },
            {
              label: t('activeWorkout.removeExercise'),
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
          title={t('activeWorkout.restTimerTitle')}
          onClose={() => setMenu('none')}
          options={restOptions().map((o) => ({
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
          title={t('activeWorkout.targetRpeTitle')}
          onClose={() => setMenu('none')}
          options={rpeOptions().map((o) => ({
            label: o.label,
            active: o.value === targetRpe,
            onSelect: () => {
              setRpeForExercise(workoutId, exerciseKey, o.value)
              setMenu('none')
            },
          }))}
        />
      )}

      {menu === 'swap' && (
        <OptionSheet
          title={t('activeWorkout.swapExercise')}
          onClose={() => setMenu('none')}
          options={[
            ...swapSuggestions.map((ex) => ({
              label: ex.name,
              onSelect: () => handleSwap(ex),
            })),
            {
              label: t('activeWorkout.swapSearch'),
              onSelect: () => {
                setMenu('none')
                onSwapSearch(exerciseKey)
              },
            },
          ]}
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
  checkPR,
}: {
  set: WorkoutSet
  label: string
  hint?: WorkoutSet
  onCompleted: (restSeconds: number) => void
  checkPR: (weightKg: number, reps: number, excludeSetId: string) => Promise<boolean>
}) {
  const [weight, setWeight] = useState(String(set.weightKg || ''))
  const [reps, setReps] = useState(String(set.reps || ''))
  const [typeMenuOpen, setTypeMenuOpen] = useState(false)
  const [needsReps, setNeedsReps] = useState(false)
  const [showCrown, setShowCrown] = useState(false)
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

    if (await checkPR(weightVal, repsVal, set.id!)) {
      setShowCrown(true)
      window.setTimeout(() => setShowCrown(false), 2500)
    }
  }

  return (
    <div className={`row set-row${completed ? ' set-row-completed' : ''}`}>
      <button
        className={`btn-plain set-type-${set.type}`}
        style={{ width: SET_COL, textAlign: 'center', fontWeight: 600 }}
        onClick={() => setTypeMenuOpen(true)}
        aria-label={t('activeWorkout.setTypeAria', { label })}
      >
        {label}
      </button>

      <span
        className="faint grow"
        style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}
      >
        {hint
          ? hint.weightKg > 0
            ? `${hint.weightKg}kg × ${hint.reps}`
            : plural(hint.reps, 'activeWorkout.hintReps')
          : '–'}
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
        className={`check-btn${completed ? ' active' : ''}${showCrown ? ' crown' : ''}`}
        style={{ width: CHECK_COL }}
        aria-label={
          completed
            ? t('activeWorkout.markIncomplete', { label })
            : t('activeWorkout.markComplete', { label })
        }
        onClick={toggleComplete}
      >
        {showCrown ? <Crown size={16} /> : '✓'}
      </button>

      {typeMenuOpen && (
        <OptionSheet
          title={t('activeWorkout.setTypeTitle')}
          onClose={() => setTypeMenuOpen(false)}
          options={[
            ...setTypeOptions().map((st) => ({
              label: st.label,
              active: st.value === set.type,
              className: `set-type-${st.value}`,
              onSelect: () => {
                commit({ type: st.value })
                setTypeMenuOpen(false)
              },
            })),
            {
              label: t('activeWorkout.removeSet'),
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