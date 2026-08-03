import { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
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
  const navigate = useNavigate()
  const exercises = useLiveQuery(() => allExercises(), [])
  const [query, setQuery] = useState('')
  const [bodyPart, setBodyPart] = useState('')
  const [equipment, setEquipment] = useState('')

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
      <ScreenHeader
        title="Exercises"
        onBack={() => navigate('/workouts/progress')}
        action={
          <Button size="sm" variant="primary" onClick={() => navigate('/workouts/exercises/new')}>
            New exercise
          </Button>
        }
      />

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
          onOpen={() => navigate(`/workouts/exercises/${encodeURIComponent(ex.key)}`)}
        />
      ))}
    </div>
  )
}

function ExerciseCard({ exercise, onOpen }: { exercise: ExerciseOption; onOpen: () => void }) {
  return (
    <Card style={{ marginBottom: '0.5rem' }}>
      <div className="row">
        <button className="btn-plain grow" onClick={onOpen}>
          <strong style={{ display: 'block' }}>{exercise.name}</strong>
          <span className="muted">
            {exercise.target} · {exercise.equipment}
            {exercise.custom && ' · custom'}
          </span>
        </button>

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
    </Card>
  )
}