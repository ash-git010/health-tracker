import { useState, useMemo } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import {
  allExercises,
  searchExercises,
  bodyParts,
  equipmentTypes,
  deleteCustomExercise,
  type ExerciseOption,
} from '../../data/exercises'
import { Button, Card, Empty, ScreenHeader } from '../../components/ui'

export function ExerciseLibraryScreen() {
  const exercises = useLiveQuery(() => allExercises(), [])
  const [query, setQuery] = useState('')
  const [bodyPart, setBodyPart] = useState('')
  const [equipment, setEquipment] = useState('')
  const [open, setOpen] = useState<string | null>(null)

  const list = exercises ?? []
  const parts = useMemo(() => bodyParts(list), [list])
  const kit = useMemo(() => equipmentTypes(list), [list])

  const filtered = useMemo(
    () => searchExercises(list, query, bodyPart || undefined, equipment || undefined),
    [list, query, bodyPart, equipment]
  )

  const shown = filtered.slice(0, 60)

  return (
    <div>
      <ScreenHeader title="Exercises" />

      <input
        type="text"
        value={query}
        placeholder="Search exercises…"
        onChange={(e) => setQuery(e.target.value)}
        style={{ marginBottom: '0.5rem' }}
      />

      <div className="row" style={{ marginBottom: '0.75rem' }}>
        <select value={bodyPart} onChange={(e) => setBodyPart(e.target.value)}>
          <option value="">All body parts</option>
          {parts.map((p) => (
            <option key={p} value={p}>
              {p}
            </option>
          ))}
        </select>
        <select value={equipment} onChange={(e) => setEquipment(e.target.value)}>
          <option value="">All equipment</option>
          {kit.map((e) => (
            <option key={e} value={e}>
              {e}
            </option>
          ))}
        </select>
      </div>

      {exercises === undefined && <Empty>Loading…</Empty>}

      {exercises && filtered.length === 0 && <Empty>No exercises match that.</Empty>}

      {filtered.length > shown.length && (
        <p className="muted">
          Showing {shown.length} of {filtered.length} — narrow your search to see more.
        </p>
      )}

      {shown.map((ex) => (
        <ExerciseCard
          key={ex.key}
          exercise={ex}
          expanded={open === ex.key}
          onToggle={() => setOpen(open === ex.key ? null : ex.key)}
        />
      ))}
    </div>
  )
}

function ExerciseCard({
  exercise,
  expanded,
  onToggle,
}: {
  exercise: ExerciseOption
  expanded: boolean
  onToggle: () => void
}) {
  return (
    <Card style={{ marginBottom: '0.5rem' }}>
      <button className="btn-plain" style={{ width: '100%' }} onClick={onToggle}>
        <div className="row">
          <strong className="grow">{exercise.name}</strong>
          <span className="muted">{expanded ? '−' : '+'}</span>
        </div>
        <div className="muted" style={{ marginTop: '0.2rem' }}>
          {exercise.target} · {exercise.equipment}
          {exercise.custom && ' · custom'}
        </div>
      </button>

      {expanded && (
        <div style={{ marginTop: '0.75rem' }}>
          {exercise.secondary.length > 0 && (
            <p className="muted" style={{ marginBottom: '0.5rem' }}>
              Also works: {exercise.secondary.join(', ')}
            </p>
          )}

          {exercise.steps.length > 0 && (
            <ol style={{ margin: 0, paddingLeft: '1.1rem', fontSize: '0.875rem' }}>
              {exercise.steps.map((s, i) => (
                <li key={i} style={{ marginBottom: '0.25rem' }}>
                  {s}
                </li>
              ))}
            </ol>
          )}

          {exercise.custom && (
            <Button
              size="sm"
              variant="ghost"
              onClick={() => {
                const id = Number(exercise.key.split(':')[1])
                if (confirm(`Delete ${exercise.name}?`)) deleteCustomExercise(id)
              }}
            >
              Delete
            </Button>
          )}
        </div>
      )}
    </Card>
  )
}