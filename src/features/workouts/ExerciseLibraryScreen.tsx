import { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { useLiveQuery } from 'dexie-react-hooks'
import { Plus, Trash2, ChevronRight } from 'lucide-react'
import {
  allExercises,
  searchExercises,
  bodyParts,
  equipmentTypes,
  deleteCustomExercise,
  type ExerciseOption,
} from '../../data/exercises'
import { EquipmentIcon } from '../../components/EquipmentIcon'
import { Card, Empty, ScreenHeader } from '../../components/ui'
import { useConfirm } from '../../components/DialogProvider'

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
    <div style={{ paddingBottom: '2rem' }}>
      <ScreenHeader
        title="Exercises"
        onBack={() => navigate('/workouts/progress')}
        action={
          <button
            className="btn btn-sm btn-primary"
            onClick={() => navigate('/workouts/exercises/new')}
          >
            <Plus size={16} /> New
          </button>
        }
      />

      <input
        type="text"
        value={query}
        placeholder="Search exercises…"
        onChange={(e) => setQuery(e.target.value)}
        style={{ marginBottom: '0.5rem' }}
      />

      <div className="row" style={{ marginBottom: '1rem' }}>
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
        <p className="faint" style={{ marginBottom: '0.75rem' }}>
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
  const confirm = useConfirm()

  async function handleDelete() {
    const ok = await confirm({
      title: `Delete ${exercise.name}?`,
      message: 'This custom exercise will be removed from your library.',
      confirmLabel: 'Delete',
      destructive: true,
    })
    if (!ok) return
    const id = Number(exercise.key.split(':')[1])
    await deleteCustomExercise(id)
  }

  return (
    <Card style={{ marginBottom: '0.5rem', padding: '0.75rem' }}>
      <div className="row">
        <div
          style={{
            width: 40,
            height: 40,
            borderRadius: 'var(--radius-sm)',
            background: 'var(--surface-2)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'var(--accent)',
            flexShrink: 0,
          }}
        >
          <EquipmentIcon equipment={exercise.equipment} size={20} />
        </div>

        <button className="btn-plain grow" style={{ minWidth: 0 }} onClick={onOpen}>
          <span
            style={{
              display: 'block',
              fontWeight: 600,
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }}
          >
            {exercise.name}
          </span>
          <span
            className="faint"
            style={{
              display: 'block',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              textTransform: 'capitalize',
            }}
          >
            {exercise.target} · {exercise.equipment}
            {exercise.custom && ' · custom'}
          </span>
        </button>

        {exercise.custom ? (
          <button className="icon-btn" aria-label={`Delete ${exercise.name}`} onClick={handleDelete}>
            <Trash2 size={16} />
          </button>
        ) : (
          <ChevronRight size={16} style={{ color: 'var(--text-faint)', flexShrink: 0 }} />
        )}
      </div>
    </Card>
  )
}