import { useNavigate } from 'react-router-dom'
import { useLiveQuery } from 'dexie-react-hooks'
import { Trash2 } from 'lucide-react'
import {
  listWorkouts,
  getSets,
  deleteWorkout,
  workoutVolume,
  completedSets,
} from '../../data/workouts'
import { formatDay } from '../../data/dates'
import { Card, Empty, ScreenHeader } from '../../components/ui'
import { useConfirm } from '../../components/DialogProvider'

export function WorkoutHistoryScreen() {
  const navigate = useNavigate()
  const workouts = useLiveQuery(() => listWorkouts(), [])

  return (
    <div style={{ paddingBottom: '2rem' }}>
      <ScreenHeader title="History" onBack={() => navigate('/workouts/progress')} />

      {workouts === undefined && <Empty>Loading…</Empty>}
      {workouts && workouts.length === 0 && <Empty>No workouts logged yet.</Empty>}

      {(workouts ?? []).map((w) => (
        <WorkoutRow key={w.id} id={w.id!} name={w.name} date={w.date} done={!!w.finishedAt} />
      ))}
    </div>
  )
}

function WorkoutRow({
  id,
  name,
  date,
  done,
}: {
  id: number
  name: string
  date: string
  done: boolean
}) {
  const navigate = useNavigate()
  const confirm = useConfirm()
  const sets = useLiveQuery(() => getSets(id), [id])
  const volume = workoutVolume(sets ?? [])
  const exercises = new Set((sets ?? []).map((s) => s.exerciseKey)).size

  async function handleDelete() {
    const ok = await confirm({
      title: `Delete ${name || 'this workout'}?`,
      message: 'This workout and all its sets will be removed.',
      confirmLabel: 'Delete',
      destructive: true,
    })
    if (ok) await deleteWorkout(id)
  }

  return (
    <Card style={{ marginBottom: '0.5rem' }}>
      <div className="row" style={{ alignItems: 'flex-start' }}>
        <button
          className="btn-plain grow"
          style={{ minWidth: 0 }}
          onClick={() => navigate(`/workouts/history/${id}`)}
        >
          <div className="row">
            <strong className="grow" style={{ minWidth: 0 }}>
              {name || 'Workout'}
            </strong>
            <span className="faint">{formatDay(date)}</span>
          </div>
          <div className="muted" style={{ marginTop: '0.25rem' }}>
            {exercises} exercises · {completedSets(sets ?? []).length} sets ·{' '}
            {Math.round(volume)} kg
            {!done && ' · in progress'}
          </div>
        </button>

        <button className="icon-btn" aria-label={`Delete ${name}`} onClick={handleDelete}>
          <Trash2 size={16} />
        </button>
      </div>
    </Card>
  )
}