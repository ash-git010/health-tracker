import { useState, useMemo } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { allExercises, searchExercises, type ExerciseOption } from '../../data/exercises'
import { Button, Empty, ScreenHeader } from '../../components/ui'

interface Props {
  onPick: (exercise: ExerciseOption) => void
  onCancel: () => void
}

export function ExercisePicker({ onPick, onCancel }: Props) {
  const exercises = useLiveQuery(() => allExercises(), [])
  const [query, setQuery] = useState('')

  const filtered = useMemo(
    () => searchExercises(exercises ?? [], query).slice(0, 40),
    [exercises, query]
  )

  return (
    <div>
      <ScreenHeader
        title="Add exercise"
        action={
          <Button size="sm" onClick={onCancel}>
            Cancel
          </Button>
        }
      />

      <input
        type="text"
        value={query}
        placeholder="Search exercises…"
        onChange={(e) => setQuery(e.target.value)}
        autoFocus
        style={{ marginBottom: '0.75rem' }}
      />

      {exercises === undefined && <Empty>Loading…</Empty>}

      {filtered.map((ex) => (
        <button
          key={ex.key}
          className="btn btn-block"
          onClick={() => onPick(ex)}
          style={{
            display: 'block',
            textAlign: 'left',
            marginBottom: '0.4rem',
            padding: '0.6rem 0.75rem',
          }}
        >
          <strong style={{ display: 'block' }}>{ex.name}</strong>
          <span className="muted" style={{ fontWeight: 400 }}>
            {ex.target} · {ex.equipment}
          </span>
        </button>
      ))}
    </div>
  )
}