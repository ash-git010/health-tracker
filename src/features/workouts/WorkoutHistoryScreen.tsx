import { useNavigate } from 'react-router-dom'
import { useLiveQuery } from 'dexie-react-hooks'
import { listWorkouts, getSets, deleteWorkout, workoutVolume, completedSets } from '../../data/workouts'
import { formatDay } from '../../data/dates'
import { Button, Card, Empty, ScreenHeader } from '../../components/ui'

export function WorkoutHistoryScreen() {
  const workouts = useLiveQuery(() => listWorkouts(), [])

  return (
    <div>
      <ScreenHeader title="History" />

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
  const sets = useLiveQuery(() => getSets(id), [id])
  const volume = workoutVolume(sets ?? [])
  const exercises = new Set((sets ?? []).map((s) => s.exerciseKey)).size
  const navigate = useNavigate()

  return (
    <Card style={{ marginBottom: '0.5rem', cursor: 'pointer' }}>
      <div onClick={() => navigate(`/workouts/history/${id}`)}>
        <div className="row">
          <strong className="grow">{name}</strong>
          <span className="muted">{formatDay(date)}</span>
        </div>
        <div className="muted" style={{ marginTop: '0.2rem' }}>
          {exercises} exercises · {completedSets(sets ?? []).length} sets · {Math.round(volume)} kg
          {!done && ' · in progress'}
        </div>
      </div>
      <Button
        size="sm"
        variant="ghost"
        style={{ marginTop: '0.5rem' }}
        onClick={() => {
          if (confirm(`Delete ${name}?`)) deleteWorkout(id)
        }}
      >
        Delete
      </Button>
    </Card>
  )
}