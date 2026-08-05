import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ChevronUp, ChevronDown, X, Plus } from 'lucide-react'
import {
  getRoutine,
  getRoutineExercises,
  createRoutine,
  updateRoutine,
  deleteRoutine,
  setRoutineExercises,
  type RoutineExerciseInput,
} from '../../data/routines'
import { ExercisePicker } from './ExercisePicker'
import { FolderPicker } from './FolderPicker'
import { TextField } from '../../components/TextField'
import { Button, Card, Empty, ScreenHeader } from '../../components/ui'
import { useConfirm } from '../../components/DialogProvider'

export function RoutineFormScreen() {
  const { id } = useParams()
  const routineId = id
  const navigate = useNavigate()
  const confirm = useConfirm()

  const [loading, setLoading] = useState(!!routineId)
  const [name, setName] = useState('')
  const [folder, setFolder] = useState('')
  const [exercises, setExercises] = useState<RoutineExerciseInput[]>([])
  const [picking, setPicking] = useState(false)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (!routineId) return
    Promise.all([getRoutine(routineId), getRoutineExercises(routineId)]).then(
      ([routine, routineExercises]) => {
        setName(routine?.name ?? '')
        setFolder(routine?.folder ?? '')
        setExercises(
          routineExercises.map((ex) => ({
            exerciseKey: ex.exerciseKey,
            exerciseName: ex.exerciseName,
            targetSets: ex.targetSets,
            restSeconds: ex.restSeconds,
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
            { exerciseKey: ex.key, exerciseName: ex.name, targetSets: 3, restSeconds: 90 },
          ])
          setPicking(false)
        }}
      />
    )
  }

  const canSave = name.trim().length > 0

  function updateExercise(index: number, changes: Partial<RoutineExerciseInput>) {
    setExercises((prev) => prev.map((ex, i) => (i === index ? { ...ex, ...changes } : ex)))
  }

  function removeExercise(index: number) {
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

  async function handleSave() {
    if (!canSave || saving) return
    setSaving(true)

    const cleanFolder = folder.trim() || undefined
    const finalId = routineId ?? (await createRoutine(name.trim(), cleanFolder))
    if (routineId) await updateRoutine(routineId, { name: name.trim(), folder: cleanFolder })
    await setRoutineExercises(finalId, exercises)

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

      <TextField label="Name" value={name} onChange={setName} placeholder="Push day" />

      <FolderPicker value={folder} onChange={setFolder} />

      <h3 style={{ marginTop: '1.25rem' }}>Exercises</h3>

      {exercises.length === 0 && <Empty>No exercises yet.</Empty>}

      {exercises.map((ex, i) => (
        <Card key={`${ex.exerciseKey}-${i}`} style={{ marginBottom: '0.5rem' }}>
          <div className="row">
            <strong className="grow" style={{ minWidth: 0 }}>
              {ex.exerciseName}
            </strong>
            <button
              className="icon-btn"
              aria-label={`Move ${ex.exerciseName} up`}
              disabled={i === 0}
              style={{ opacity: i === 0 ? 0.3 : 1 }}
              onClick={() => move(i, -1)}
            >
              <ChevronUp size={18} />
            </button>
            <button
              className="icon-btn"
              aria-label={`Move ${ex.exerciseName} down`}
              disabled={i === exercises.length - 1}
              style={{ opacity: i === exercises.length - 1 ? 0.3 : 1 }}
              onClick={() => move(i, 1)}
            >
              <ChevronDown size={18} />
            </button>
            <button
              className="icon-btn"
              aria-label={`Remove ${ex.exerciseName}`}
              onClick={() => removeExercise(i)}
            >
              <X size={16} />
            </button>
          </div>

          <div className="row" style={{ marginTop: '0.5rem', alignItems: 'flex-start' }}>
            <label className="field grow" style={{ marginBottom: 0 }}>
              <span className="field-label">Target sets</span>
              <input
                type="number"
                inputMode="numeric"
                min={1}
                value={ex.targetSets}
                onChange={(e) => updateExercise(i, { targetSets: Number(e.target.value) || 1 })}
              />
            </label>
            <label className="field grow" style={{ marginBottom: 0 }}>
              <span className="field-label">Rest (sec)</span>
              <input
                type="number"
                inputMode="numeric"
                min={0}
                step={15}
                value={ex.restSeconds}
                onChange={(e) => updateExercise(i, { restSeconds: Number(e.target.value) || 0 })}
              />
            </label>
          </div>
        </Card>
      ))}

      <Button block onClick={() => setPicking(true)}>
        <Plus size={16} /> Add exercise
      </Button>

      <div className="form-actions">
        {routineId && (
          <Button variant="ghost" className="btn-warn" onClick={handleDelete}>
            Delete
          </Button>
        )}
        <span className="grow">
          <Button variant="primary" block onClick={handleSave} disabled={!canSave || saving}>
            {saving ? 'Saving…' : 'Save routine'}
          </Button>
        </span>
      </div>
    </div>
  )
}