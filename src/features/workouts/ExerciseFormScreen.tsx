import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useLiveQuery } from 'dexie-react-hooks'
import { allExercises, addCustomExercise, bodyParts, equipmentTypes } from '../../data/exercises'
import { TextField } from '../../components/TextField'
import { Button, Empty, ScreenHeader } from '../../components/ui'

export function ExerciseFormScreen() {
  const navigate = useNavigate()
  const exercises = useLiveQuery(() => allExercises(), [])
  const list = exercises ?? []
  const parts = useMemo(() => bodyParts(list), [list])
  const kit = useMemo(() => equipmentTypes(list), [list])

  const [name, setName] = useState('')
  const [bodyPart, setBodyPart] = useState('')
  const [equipment, setEquipment] = useState('')
  const [target, setTarget] = useState('')
  const [secondary, setSecondary] = useState('')
  const [steps, setSteps] = useState('')
  const [saving, setSaving] = useState(false)

  const canSave = name.trim().length > 0 && bodyPart.length > 0 && equipment.length > 0 && !saving

  async function handleSave() {
    if (!canSave) return
    setSaving(true)

    const id = await addCustomExercise({
      name: name.trim(),
      bodyPart,
      equipment,
      target: target.trim(),
      secondary: secondary
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean),
      steps: steps
        .split('\n')
        .map((s) => s.trim())
        .filter(Boolean),
    })

    navigate(`/workouts/exercises/${encodeURIComponent(`custom:${id}`)}`)
  }

  return (
    <div className="stack">
      <ScreenHeader
        title="New exercise"
        action={
          <Button size="sm" onClick={() => navigate(-1)}>
            Cancel
          </Button>
        }
      />

      {exercises === undefined ? (
        <Empty>Loading…</Empty>
      ) : (
        <>
          <TextField
            label="Name"
            value={name}
            onChange={setName}
            placeholder="Cable lateral raise"
          />

          <label className="field">
            <span className="field-label">Body part</span>
            <select value={bodyPart} onChange={(e) => setBodyPart(e.target.value)}>
              <option value="">Select…</option>
              {parts.map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </select>
          </label>

          <label className="field">
            <span className="field-label">Equipment</span>
            <select value={equipment} onChange={(e) => setEquipment(e.target.value)}>
              <option value="">Select…</option>
              {kit.map((e) => (
                <option key={e} value={e}>
                  {e}
                </option>
              ))}
            </select>
          </label>

          <TextField label="Target muscle" value={target} onChange={setTarget} placeholder="delts" />

          <TextField
            label="Secondary muscles (comma-separated)"
            value={secondary}
            onChange={setSecondary}
            placeholder="traps, triceps"
          />

          <label className="field">
            <span className="field-label">Instructions (one step per line)</span>
            <textarea
              rows={5}
              value={steps}
              onChange={(e) => setSteps(e.target.value)}
              placeholder={'Stand holding dumbbells at your sides.\nRaise arms out to shoulder height.'}
            />
          </label>

          <Button variant="primary" block onClick={handleSave} disabled={!canSave}>
            Add exercise
          </Button>
        </>
      )}
    </div>
  )
}
