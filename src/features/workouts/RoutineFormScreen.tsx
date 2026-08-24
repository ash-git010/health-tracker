import { useEffect, useState, useRef } from 'react'
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
import { restOptions, formatRestLabel } from './rest'
import { rpeOptions, formatRpe } from './rpe'
import { TextField } from '../../components/TextField'
import { OptionSheet } from '../../components/OptionSheet'
import { EquipmentIcon } from '../../components/EquipmentIcon'
import { Button, Card, Empty, ScreenHeader } from '../../components/ui'
import { useConfirm } from '../../components/DialogProvider'
import type { RoutineSet, SetType, WorkoutSet } from '../../data/types'
import { parseDecimal } from '../../data/numbers'
import { t, plural } from '../../data/i18n'

const SET_COL = '1.75rem'
const NUM_COL = '3.5rem'

const MAX_SUBSTITUTES = 2

function setTypeOptions(): { value: SetType; label: string }[] {
  return [
    { value: 'normal', label: t('setType.normal') },
    { value: 'warmup', label: t('setType.warmup') },
    { value: 'drop', label: t('setType.drop') },
    { value: 'failure', label: t('setType.failure') },
  ]
}

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
  substitutes: string[]
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
  const [substituteTarget, setSubstituteTarget] = useState<number | null>(null)
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
            substitutes: ex.substitutes ?? [],
          }))
        )
        setLoading(false)
      }
    )
  }, [routineId])

  if (loading) return <Empty>{t('common.loading')}</Empty>

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
              substitutes: [],
            },
          ])
          setError(null)
          setPicking(false)
        }}
      />
    )
  }

  if (substituteTarget !== null) {
    return (
      <ExercisePicker
        onCancel={() => setSubstituteTarget(null)}
        onPick={(ex) => {
          const target = exercises[substituteTarget]
          if (
            target &&
            ex.key !== target.exerciseKey &&
            !target.substitutes.includes(ex.key) &&
            target.substitutes.length < MAX_SUBSTITUTES
          ) {
            updateExercise(substituteTarget, { substitutes: [...target.substitutes, ex.key] })
          }
          setSubstituteTarget(null)
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
    if (!name.trim()) return t('routines.form.errName')

    for (const ex of exercises) {
      if (ex.sets.length === 0) return t('routines.form.errNoSets', { name: ex.exerciseName })
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
      substitutes: ex.substitutes.length > 0 ? ex.substitutes : undefined,
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
      title: t('routines.form.deleteTitle'),
      message: t('routines.form.deleteMessage'),
      confirmLabel: t('common.delete'),
      destructive: true,
    })
    if (!ok) return
    await deleteRoutine(routineId)
    navigate('/workouts/routines')
  }

  return (
    <div className="stack">
      <ScreenHeader
        title={routineId ? t('routines.form.editTitle') : t('routines.form.newTitle')}
        onBack={() => navigate('/workouts/routines')}
      />

      <TextField
        label={t('routines.form.name')}
        value={name}
        onChange={(v) => {
          setError(null)
          setName(v)
        }}
        placeholder={t('routines.form.namePlaceholder')}
      />

      <label className="field">
        <span className="field-label">{t('routines.form.notes')}</span>
        <textarea
          value={notes}
          placeholder={t('routines.form.notesPlaceholder')}
          rows={2}
          onChange={(e) => setNotes(e.target.value)}
        />
      </label>

      <FolderPicker value={folder} onChange={setFolder} />

      <h3 style={{ marginTop: '1.25rem' }}>{t('routines.form.exercisesHeading')}</h3>

      {exercises.length === 0 && <Empty>{t('routines.form.noExercises')}</Empty>}

      {exercises.map((ex, i) => (
        <ExerciseCard
          key={`${ex.exerciseKey}-${i}`}
          draft={ex}
          isFirst={i === 0}
          isLast={i === exercises.length - 1}
          onChange={(changes) => updateExercise(i, changes)}
          onRemove={() => removeExercise(i)}
          onMove={(dir) => move(i, dir)}
          onPickSubstitute={() => setSubstituteTarget(i)}
        />
      ))}

      <Button block onClick={() => setPicking(true)}>
        <Plus size={16} /> {t('routines.form.addExercise')}
      </Button>

      {error && (
        <p className="danger" style={{ margin: 0 }}>
          {error}
        </p>
      )}

      <div className="form-actions">
        {routineId && (
          <Button variant="ghost" className="btn-warn" onClick={handleDelete}>
            {t('common.delete')}
          </Button>
        )}
        <span className="grow">
          <Button variant="primary" block onClick={handleSave} disabled={saving}>
            {saving ? t('routines.form.saving') : t('routines.form.save')}
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
  onPickSubstitute,
}: {
  draft: ExerciseDraft
  isFirst: boolean
  isLast: boolean
  onChange: (changes: Partial<ExerciseDraft>) => void
  onRemove: () => void
  onMove: (dir: -1 | 1) => void
  onPickSubstitute: () => void
}) {
  const confirm = useConfirm()
  const [equipment, setEquipment] = useState<string | undefined>()
  const [previous, setPrevious] = useState<WorkoutSet[]>([])
  const [menu, setMenu] = useState<'none' | 'actions' | 'rest' | 'rpe'>('none')
  const [typeMenu, setTypeMenu] = useState<number | null>(null)
  const [substituteNames, setSubstituteNames] = useState<Record<string, string>>({})

  useEffect(() => {
    findExercise(draft.exerciseKey).then((e) => setEquipment(e?.equipment))
  }, [draft.exerciseKey])

  useEffect(() => {
    lastSetsFor(draft.exerciseKey).then(setPrevious)
  }, [draft.exerciseKey])

  useEffect(() => {
    let cancelled = false
    Promise.all(draft.substitutes.map((key) => findExercise(key))).then((results) => {
      if (cancelled) return
      const map: Record<string, string> = {}
      results.forEach((ex, i) => {
        if (ex) map[draft.substitutes[i]] = ex.name
      })
      setSubstituteNames(map)
    })
    return () => {
      cancelled = true
    }
  }, [draft.substitutes])

  function removeSubstitute(key: string) {
    onChange({ substitutes: draft.substitutes.filter((k) => k !== key) })
  }

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
      title: t('activeWorkout.removeExerciseTitle', { name: draft.exerciseName }),
      message: t('routines.form.removeExerciseMessage'),
      confirmLabel: t('activeWorkout.removeConfirm'),
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
          aria-label={t('routines.optionsFor', { name: draft.exerciseName })}
          onClick={() => setMenu('actions')}
        >
          ⋮
        </button>
      </div>

      <input
        type="text"
        value={draft.notes}
        placeholder={t('routines.form.exerciseNotesPlaceholder')}
        onChange={(e) => onChange({ notes: e.target.value })}
        style={{ marginTop: '0.5rem' }}
      />

      <div className="row rest-row">
        <button className="btn-plain rest-live grow" onClick={() => setMenu('rest')}>
          ⏱ {t('activeWorkout.restTimer', { label: formatRestLabel(draft.restSeconds) })}
        </button>
      </div>

      <div className="row rest-row">
        <button className="btn-plain muted grow" onClick={() => setMenu('rpe')}>
          ◎ {t('activeWorkout.targetRpeRow', { value: formatRpe(draft.rpe) })}
        </button>
      </div>

      <div className="faint" style={{ marginTop: '0.5rem' }}>
        {t('routines.form.substitutesHeading')}
      </div>
      <div className="chip-row">
        {draft.substitutes.map((key) => (
          <button key={key} className="chip active" onClick={() => removeSubstitute(key)}>
            {substituteNames[key] ?? key} ×
          </button>
        ))}
        {draft.substitutes.length < MAX_SUBSTITUTES && (
          <button className="chip" onClick={onPickSubstitute}>
            <Plus size={12} /> {t('routines.form.addSubstitute')}
          </button>
        )}
      </div>

      <div className="row set-header">
        <span style={{ width: SET_COL, textAlign: 'center' }}>{t('activeWorkout.colSet')}</span>
        <span className="grow">{t('activeWorkout.colPrevious')}</span>
        <span style={{ width: NUM_COL, textAlign: 'center' }}>{t('activeWorkout.colKg')}</span>
        <span style={{ width: NUM_COL, textAlign: 'center' }}>{t('activeWorkout.colReps')}</span>
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
              aria-label={t('routines.form.setTypeAria', { label })}
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

            <DraftNumber
              value={set.weightKg}
              inputMode="decimal"
              onChange={(v) => updateSet(i, { weightKg: v })}
            />

            <DraftNumber
              value={set.reps}
              inputMode="numeric"
              whole
              onChange={(v) => updateSet(i, { reps: v })}
            />
          </div>
        )
      })}

      <Button size="sm" onClick={addSet} style={{ marginTop: '0.5rem' }}>
        <Plus size={14} /> {t('routines.form.addSet')}
      </Button>

      {menu === 'actions' && (
        <OptionSheet
          title={draft.exerciseName}
          onClose={() => setMenu('none')}
          options={[
            {
              label: t('routines.form.addWarmup'),
              onSelect: () => {
                setMenu('none')
                addWarmup()
              },
            },
            { label: t('activeWorkout.setRestTimer'), onSelect: () => setMenu('rest') },
            { label: t('activeWorkout.setTargetRpe'), onSelect: () => setMenu('rpe') },
            ...(isFirst
              ? []
              : [
                  {
                    label: t('routines.form.moveUp'),
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
                    label: t('routines.form.moveDown'),
                    onSelect: () => {
                      setMenu('none')
                      onMove(1)
                    },
                  },
                ]),
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
          title={t('activeWorkout.targetRpeTitle')}
          onClose={() => setMenu('none')}
          options={rpeOptions().map((o) => ({
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
          title={t('activeWorkout.setTypeTitle')}
          onClose={() => setTypeMenu(null)}
          options={[
            ...setTypeOptions().map((st) => ({
              label: st.label,
              active: st.value === draft.sets[typeMenu]?.type,
              className: `set-type-${st.value}`,
              onSelect: () => {
                updateSet(typeMenu, { type: st.value })
                setTypeMenu(null)
              },
            })),
            {
              label: t('activeWorkout.removeSet'),
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

/**
 * A bare number input that survives a comma.
 *
 * The parent holds `number | ''`, which cannot represent a half-typed '67,' —
 * so the raw text is held here instead and only committed once it parses.
 * This is NumberField's contract without NumberField's label and .field
 * wrapper, which do not fit a set row.
 *
 * Rows are keyed by index, so React reuses this component when a set is
 * removed and the props change underneath it. The lastEmitted ref is what
 * makes that safe: a value that did not come from us resets the draft.
 */
function DraftNumber({
  value,
  onChange,
  inputMode,
  whole,
}: {
  value: number | ''
  onChange: (value: number | '') => void
  inputMode: 'numeric' | 'decimal'
  whole?: boolean
}) {
  const [draft, setDraft] = useState(value === '' ? '' : String(value))
  const lastEmitted = useRef<number | ''>(value)

  useEffect(() => {
    if (value !== lastEmitted.current) {
      setDraft(value === '' ? '' : String(value))
      lastEmitted.current = value
    }
  }, [value])

  return (
    <input
      type="text"
      inputMode={inputMode}
      value={draft}
      placeholder="–"
      onChange={(e) => {
        const raw = e.target.value
        setDraft(raw)

        const parsed = parseDecimal(raw)
        if (parsed === null) return // mid-typing; keep the draft, emit nothing

        const next = whole && typeof parsed === 'number' ? Math.round(parsed) : parsed
        lastEmitted.current = next
        onChange(next)
      }}
      style={{ width: NUM_COL }}
    />
  )
}