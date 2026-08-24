import { useState, useMemo } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { allExercises, searchExercises, type ExerciseOption } from '../../data/exercises'
import { Button, Empty, ScreenHeader } from '../../components/ui'
import { t } from '../../data/i18n'

interface Props {
  onPick: (exercise: ExerciseOption) => void
  onCancel: () => void
}

function bodyPartChips(): { key: string; label: string; parts: string[] | null }[] {
  return [
    { key: 'all', label: t('exercisePicker.all'), parts: null },
    { key: 'chest', label: t('exercisePicker.chest'), parts: ['chest'] },
    { key: 'back', label: t('exercisePicker.back'), parts: ['back'] },
    { key: 'legs', label: t('exercisePicker.legs'), parts: ['upper legs', 'lower legs'] },
    { key: 'shoulders', label: t('exercisePicker.shoulders'), parts: ['shoulders'] },
    { key: 'arms', label: t('exercisePicker.arms'), parts: ['upper arms', 'lower arms'] },
    { key: 'core', label: t('exercisePicker.core'), parts: ['waist', 'neck'] },
    { key: 'cardio', label: t('exercisePicker.cardio'), parts: ['cardio'] },
  ]
}

export function ExercisePicker({ onPick, onCancel }: Props) {
  const exercises = useLiveQuery(() => allExercises(), [])
  const [query, setQuery] = useState('')
  const [chip, setChip] = useState('all')

  const chips = bodyPartChips()

  const filtered = useMemo(() => {
    const parts = chips.find((c) => c.key === chip)?.parts ?? null
    const base = parts ? (exercises ?? []).filter((e) => parts.includes(e.bodyPart)) : exercises ?? []
    return searchExercises(base, query).slice(0, 40)
  }, [exercises, query, chip])

  return (
    <div>
      <ScreenHeader
        title={t('exercisePicker.title')}
        action={
          <Button size="sm" onClick={onCancel}>
            {t('common.cancel')}
          </Button>
        }
      />

      <div className="chip-row">
        {chips.map((c) => (
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
        placeholder={t('exercisePicker.search')}
        onChange={(e) => setQuery(e.target.value)}
        autoFocus
        style={{ marginBottom: '0.75rem' }}
      />

      {exercises === undefined && <Empty>{t('common.loading')}</Empty>}

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