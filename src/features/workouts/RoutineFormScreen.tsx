import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Plus } from 'lucide-react'
import {
  getRoutine,
  getRoutineExercises,
  createRoutine,
  updateRoutine,
  deleteRoutine,
  setRoutineExercises,
  type RoutineExerciseInput,
} from '../../data/routines'
import { lastSetsFor } from '../../data/workouts'
import { findExercise } from '../../data/exercises'
import { ExercisePicker } from './ExercisePicker'
import { FolderPicker } from './FolderPicker'
import { REST_OPTIONS, formatRestLabel } from './rest'
import { RPE_OPTIONS, formatRpe } from './rpe'
import { TextField } from '../../components/TextField'
import { OptionSheet } from '../../components/OptionSheet'
import { EquipmentIcon } from '../../components/EquipmentIcon'
import { Button, Card, Empty, ScreenHeader } from '../../components/ui'
import { useConfirm } from '../../components/DialogProvider'
import type { RoutineSet, SetType, WorkoutSet } from '../../data/types'

const SET_COL = '1.75rem'
const NUM_COL = '3.5rem'
const DEL_COL = '2rem'

const SET_TYPES: { value: SetType; label: string }[] = [
  { value: 'normal', label: 'Normal' },
  { value: 'warmup', label: 'Warm-up' },
  { value: 'drop', label: 'Drop' },
  { value: 'failure', label: 'Failure' },
]

// A target may legitimately have no numbers — "3 sets, work out the weight on
// the day" is a real routine. Empty stays empty all the way to save.
type SetDraft = {
  type: SetType
  weightKg: number | ''
  reps: number | ''
}

type ExerciseDraft = {
  exerciseKey: string
  exerciseName: string
  restSeconds: number
  /** A guideline for the whole exercise, not per set. Stored on every set. */
  rpe?: number
  notes: string
  sets: SetDraft[]
}

function blankSet(): SetDraft {
  return { type: 'normal', weightKg: '', reps: '' }
}

function toDraftSets(ex: { sets?: RoutineSet[]; targetSets: number }): SetDraft[] {
  if (ex.sets && ex.sets.length > 0) {
    return ex.sets.map((s) => ({
      type: s.type ?? 'normal',
      weightKg: s.weightKg ?? '',
      reps: s.reps ?? '',
    }))
  }
  // Routines saved before per-set targets existed only know how many.
  return Array.from({ length: Math.max(1, ex.targetSets) }, blankSet)
}

export function RoutineFormScreen() {
  const { id } = useParams()
  const routineId = id
  const navigate = useNavigate()
  const confirm = useConfirm()

  const [loading, setLoading] = useState(!!routineId)
  const [name, setName] = useState('')
  const [folder, setFolder] = useState('')
  const [notes, setNotes] = useState('')
  const [exercises, setExercises] = useState<ExerciseDraft[]>([])
  const [picking, setPicking] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!routineId) return
    Promise.all([getRoutine(routineId), getRoutineExercises(routineId)]).then(
      ([routine, routineExercises]) => {
        setName(routine?.name ?? '')
        setFolder(routine?.folder ?? '')
        setNotes(routine?.notes ?? '')
        setExercises(
          routineExercises.map((ex) => ({
            exerciseKey: ex.exerciseKey,
            exerciseName: ex.exerciseName,
            restSeconds: ex.restSeconds,
            rpe: ex.sets?.[0]?.rpe,
            notes: ex.notes ?? '',
            sets: toDraftSets(ex),
          }))
        )
        setLoading(false)
      }
    )
  }, [routineId])

  if (loading) return <Empty>Loading…</Empty>

  if (picking) {
    return (
      <ExercisePicker
        onCancel={() => setPicking(false)}
        onPick={(ex) => {
          setExercises((prev) => [
            ...prev,
            {
              exerciseKey: ex.key,
              exerciseName: ex.name,
              restSeconds: 90,
              notes: '',
              sets: [blankSet()],
            },
          ])
          setError(null)
          setPicking(false)
        }}
      />
    )
  }

  function updateExercise(index: number, changes: Partial<ExerciseDraft>) {
    setError(null)
    setExercises((prev) => prev.map((ex, i) => (i === index ? { ...ex, ...changes } : ex)))
  }

  function removeExercise(index: number) {
    setError(null)
    setExercises((prev) => prev.filter((_, i) => i !== index))
  }

  function move(index: number, dir: -1 | 1) {
    setExercises((prev) => {
      const next = [...prev]
      const target = index + dir
      if (target < 0 || target >= next.length) return prev
      ;[next[index], next[target]] = [next[target], next[index]]
      return next
    })
  }

  function findProblem(): string | null {
    if (!name.trim()) return 'Give the routine a name.'

    for (const ex of exercises) {
      if (ex.sets.length === 0) return `${ex.exerciseName}: add at least one set.`
    }

    return null
  }

  async function handleSave() {
    if (saving) return

    const problem = findProblem()
    if (problem) {
      setError(problem)
      return
    }

    setError(null)
    setSaving(true)

    const clean: RoutineExerciseInput[] = exercises.map((ex) => ({
      exerciseKey: ex.exerciseKey,
      exerciseName: ex.exerciseName,
      // targetSets means working sets, so warm-ups don't count towards it.
      targetSets: ex.sets.filter((s) => s.type !== 'warmup').length,
      restSeconds: ex.restSeconds,
      notes: ex.notes.trim() || undefined,
      sets: ex.sets.map((s) => ({
        type: s.type,
        weightKg: s.weightKg === '' ? undefined : Number(s.weightKg),
        reps: s.reps === '' ? undefined : Number(s.reps),
        rpe: ex.rpe,
      })),
    }))

    const cleanFolder = folder.trim() || undefined
    const cleanNotes = notes.trim() || undefined
    const finalId = routineId ?? (await createRoutine(name.trim(), cleanFolder))

    // createRoutine takes no notes, so the update runs either way.
    await updateRoutine(finalId, {
      name: name.trim(),
      folder: cleanFolder,
      notes: cleanNotes,
    })
    await setRoutineExercises(finalId, clean)

    setSaving(false)
    navigate('/workouts/routines')
  }

  async function handleDelete() {
    if (!routineId) return
    const ok = await confirm({
      title: 'Delete this routine?',
      message: 'Workouts already logged from it are unaffected.',
      confirmLabel: 'Delete',
      destructive: true,
    })
    if (!ok) return
    await deleteRoutine(routineId)
    navigate('/workouts/routines')
  }

  return (
    <div className="stack">
      <ScreenHeader
        title={routineId ? 'Edit routine' : 'New routine'}
        onBack={() => navigate('/workouts/routines')}
      />

      <TextField
        label="Name"
        value={name}
        onChange={(v) => {
          setError(null)
          setName(v)
        }}
        placeholder="Push day"
      />

      <label className="field">
        <span className="field-label">Notes</span>
        <textarea
          value={notes}
          placeholder="Optional notes"
          rows={2}
          onChange={(e) => setNotes(e.target.value)}
        />
      </label>

      <FolderPicker value={folder} onChange={setFolder} />

      <h3 style={{ marginTop: '1.25rem' }}>Exercises</h3>

      {exercises.length === 0 && <Empty>No exercises yet.</Empty>}

      {exercises.map((ex, i) => (
        <ExerciseCard
          key={`${ex.exerciseKey}-${i}`}
          draft={ex}
          isFirst={i === 0}
          isLast={i === exercises.length - 1}
          onChange={(changes) => updateExercise(i, changes)}
          onRemove={() => removeExercise(i)}
          onMove={(dir) => move(i, dir)}
        />
      ))}

      <Button block onClick={() => setPicking(true)}>
        <Plus size={16} /> Add exercise
      </Button>

      {error && (
        <p className="danger" style={{ margin: 0 }}>
          {error}
        </p>
      )}

      <div className="form-actions">
        {routineId && (
          <Button variant="ghost" className="btn-warn" onClick={handleDelete}>
            Delete
          </Button>
        )}
        <span className="grow">
          <Button variant="primary" block onClick={handleSave} disabled={saving}>
            {saving ? 'Saving…' : 'Save routine'}
          </Button>
        </span>
      </div>
    </div>
  )
}

function ExerciseCard({
  draft,
  isFirst,
  isLast,
  onChange,
  onRemove,
  onMove,
}: {
  draft: ExerciseDraft
  isFirst: boolean
  isLast: boolean
  onChange: (changes: Partial<ExerciseDraft>) => void
  onRemove: () => void
  onMove: (dir: -1 | 1) => void
}) {
  const confirm = useConfirm()
  const [equipment, setEquipment] = useState<string | undefined>()
  const [previous, setPrevious] = useState<WorkoutSet[]>([])
  const [menu, setMenu] = useState<'none' | 'actions' | 'rest' | 'rpe'>('none')
  const [typeMenu, setTypeMenu] = useState<number | null>(null)

  useEffect(() => {
    findExercise(draft.exerciseKey).then((e) => setEquipment(e?.equipment))
  }, [draft.exerciseKey])

  useEffect(() => {
    lastSetsFor(draft.exerciseKey).then(setPrevious)
  }, [draft.exerciseKey])

  function updateSet(index: number, changes: Partial<SetDraft>) {
    onChange({
      sets: draft.sets.map((s, i) => (i === index ? { ...s, ...changes } : s)),
    })
  }

  function addSet() {
    // Copies the last row rather than adding a blank one: building
    // "3 × 60kg × 8" should be three taps, not three rows of typing.
    const last = draft.sets[draft.sets.length - 1]
    onChange({ sets: [...draft.sets, last ? { ...last, type: 'normal' } : blankSet()] })
  }

  function addWarmup() {
    onChange({ sets: [{ ...blankSet(), type: 'warmup' }, ...draft.sets] })
  }

  function removeSet(index: number) {
    onChange({ sets: draft.sets.filter((_, i) => i !== index) })
  }

  async function handleRemove() {
    const ok = await confirm({
      title: `Remove ${draft.exerciseName}?`,
      message: 'Its sets in this routine will be discarded.',
      confirmLabel: 'Remove',
      destructive: true,
    })
    if (ok) onRemove()
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
        <strong className="grow" style={{ minWidth: 0 }}>
          {draft.exerciseName}
        </strong>
        <button
          className="icon-btn"
          aria-label={`Options for ${draft.exerciseName}`}
          onClick={() => setMenu('actions')}
        >
          ⋮
        </button>
      </div>

      <input
        type="text"
        value={draft.notes}
        placeholder="Notes…"
        onChange={(e) => onChange({ notes: e.target.value })}
        style={{ marginTop: '0.5rem' }}
      />

      <div className="row rest-row">
        <button className="btn-plain rest-live grow" onClick={() => setMenu('rest')}>
          ⏱ Rest timer: {formatRestLabel(draft.restSeconds)}
        </button>
      </div>

      <div className="row rest-row">
        <button className="btn-plain muted grow" onClick={() => setMenu('rpe')}>
          ◎ Target RPE: {formatRpe(draft.rpe)}
        </button>
      </div>

      <div className="row set-header">
        <span style={{ width: SET_COL, textAlign: 'center' }}>SET</span>
        <span className="grow">PREVIOUS</span>
        <span style={{ width: NUM_COL, textAlign: 'center' }}>KG</span>
        <span style={{ width: NUM_COL, textAlign: 'center' }}>REPS</span>
        <span style={{ width: DEL_COL }} aria-hidden="true" />
      </div>

      {draft.sets.map((set, i) => {
        if (set.type !== 'warmup') setNumber++
        const label = setLabel(set.type, setNumber)
        const hint = previous[i]

        return (
          <div className="row set-row" key={i}>
            <button
              className={`btn-plain set-type-${set.type}`}
              style={{ width: SET_COL, textAlign: 'center', fontWeight: 600 }}
              onClick={() => setTypeMenu(i)}
              aria-label={`Set ${label}, tap to change type`}
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
                  : `${hint.reps} reps`
                : '–'}
            </span>

            <input
              type="number"
              inputMode="decimal"
              value={set.weightKg}
              placeholder="–"
              onChange={(e) =>
                updateSet(i, { weightKg: e.target.value === '' ? '' : Number(e.target.value) })
              }
              style={{ width: NUM_COL }}
            />

            <input
              type="number"
              inputMode="numeric"
              value={set.reps}
              placeholder="–"
              onChange={(e) =>
                updateSet(i, { reps: e.target.value === '' ? '' : Number(e.target.value) })
              }
              style={{ width: NUM_COL }}
            />

            <button
              className="set-delete"
              style={{ width: DEL_COL }}
              aria-label={`Remove set ${label}`}
              onClick={() => removeSet(i)}
            >
              ×
            </button>
          </div>
        )
      })}

      <Button size="sm" onClick={addSet} style={{ marginTop: '0.5rem' }}>
        <Plus size={14} /> Add set
      </Button>

      {menu === 'actions' && (
        <OptionSheet
          title={draft.exerciseName}
          onClose={() => setMenu('none')}
          options={[
            {
              label: 'Add warm-up set',
              onSelect: () => {
                setMenu('none')
                addWarmup()
              },
            },
            { label: 'Set rest timer', onSelect: () => setMenu('rest') },
            { label: 'Set target RPE', onSelect: () => setMenu('rpe') },
            ...(isFirst
              ? []
              : [
                  {
                    label: 'Move up',
                    onSelect: () => {
                      setMenu('none')
                      onMove(-1)
                    },
                  },
                ]),
            ...(isLast
              ? []
              : [
                  {
                    label: 'Move down',
                    onSelect: () => {
                      setMenu('none')
                      onMove(1)
                    },
                  },
                ]),
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
            active: o.seconds === draft.restSeconds,
            onSelect: () => {
              onChange({ restSeconds: o.seconds })
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
            active: o.value === draft.rpe,
            onSelect: () => {
              onChange({ rpe: o.value })
              setMenu('none')
            },
          }))}
        />
      )}

      {typeMenu !== null && (
        <OptionSheet
          title="Set type"
          onClose={() => setTypeMenu(null)}
          options={[
            ...SET_TYPES.map((t) => ({
              label: t.label,
              active: t.value === draft.sets[typeMenu]?.type,
              className: `set-type-${t.value}`,
              onSelect: () => {
                updateSet(typeMenu, { type: t.value })
                setTypeMenu(null)
              },
            })),
            {
              label: 'Remove set',
              onSelect: () => {
                removeSet(typeMenu)
                setTypeMenu(null)
              },
            },
          ]}
        />
      )}
    </Card>
  )
}

function setLabel(type: SetType, seqNumber: number): string {
  if (type === 'warmup') return 'W'
  if (type === 'drop') return 'D'
  if (type === 'failure') return 'F'
  return String(seqNumber)
}