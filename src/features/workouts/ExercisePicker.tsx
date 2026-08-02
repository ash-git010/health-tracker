import { useState, useMemo } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { allExercises, searchExercises, type ExerciseOption } from '../../data/exercises'
import { Button, Empty, ScreenHeader } from '../../components/ui'

interface Props {
  onPick: (exercise: ExerciseOption) => void
  onCancel: () => void
}

const BODY_PART_CHIPS: { key: string; label: string; parts: string[] | null }[] = [
  { key: 'all', label: 'All', parts: null },
  { key: 'chest', label: 'Chest', parts: ['chest'] },
  { key: 'back', label: 'Back', parts: ['back'] },
  { key: 'legs', label: 'Legs', parts: ['upper legs', 'lower legs'] },
  { key: 'shoulders', label: 'Shoulders', parts: ['shoulders'] },
  { key: 'arms', label: 'Arms', parts: ['upper arms', 'lower arms'] },
  { key: 'core', label: 'Core', parts: ['waist', 'neck'] },
  { key: 'cardio', label: 'Cardio', parts: ['cardio'] },
]

export function ExercisePicker({ onPick, onCancel }: Props) {
  const exercises = useLiveQuery(() => allExercises(), [])
  const [query, setQuery] = useState('')
  const [chip, setChip] = useState('all')

  const filtered = useMemo(() => {
    const parts = BODY_PART_CHIPS.find((c) => c.key === chip)?.parts ?? null
    const base = parts ? (exercises ?? []).filter((e) => parts.includes(e.bodyPart)) : exercises ?? []
    return searchExercises(base, query).slice(0, 40)
  }, [exercises, query, chip])

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

      <div className="chip-row">
        {BODY_PART_CHIPS.map((c) => (
          <button
            key={c.key}
            className={`chip${chip === c.key ? ' active' : ''}`}
            onClick={() => setChip(c.key)}
          >
            {c.label}
          </button>
        ))}
      </div>

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