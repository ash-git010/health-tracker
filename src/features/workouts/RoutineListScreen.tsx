import { useNavigate } from 'react-router-dom'
import { useLiveQuery } from 'dexie-react-hooks'
import { listRoutines, getRoutineExercises, startWorkoutFromRoutine } from '../../data/routines'
import { activeWorkout } from '../../data/workouts'
import { Button, Card, Empty, Fab, ScreenHeader } from '../../components/ui'
import type { Routine } from '../../data/types'

export function RoutineListScreen() {
  const navigate = useNavigate()
  const routines = useLiveQuery(() => listRoutines(), [])
  const runningWorkout = useLiveQuery(() => activeWorkout(), [])

  if (routines === undefined) return <Empty>Loading…</Empty>

  const groups = groupByFolder(routines)

  return (
    <div>
      <ScreenHeader title="Routines" />

      {routines.length === 0 && (
        <Empty>No routines yet. Build one, or save a finished workout as one.</Empty>
      )}

      {groups.map((group) => (
        <div key={group.folder} style={{ marginBottom: '1.25rem' }}>
          {group.folder !== UNGROUPED && <h3>{group.folder}</h3>}
          {group.routines.map((r) => (
            <RoutineRow
              key={r.id}
              routine={r}
              blocked={!!runningWorkout}
              onNavigate={navigate}
            />
          ))}
        </div>
      ))}

      <Fab label="New routine" onClick={() => navigate('/workouts/routines/new')} />
    </div>
  )
}

function RoutineRow({
  routine,
  blocked,
  onNavigate,
}: {
  routine: Routine
  blocked: boolean
  onNavigate: (path: string) => void
}) {
  const exercises = useLiveQuery(() => getRoutineExercises(routine.id!), [routine.id])

  return (
    <Card style={{ marginBottom: '0.5rem' }}>
      <div
        className="row"
        style={{ cursor: 'pointer' }}
        onClick={() => onNavigate(`/workouts/routines/${routine.id}/edit`)}
      >
        <strong className="grow">{routine.name}</strong>
        <span className="muted">{(exercises ?? []).length} exercises</span>
      </div>

      <Button
        size="sm"
        variant="primary"
        style={{ marginTop: '0.5rem' }}
        disabled={blocked}
        onClick={async () => {
          await startWorkoutFromRoutine(routine.id!)
          onNavigate('/workouts/log')
        }}
      >
        {blocked ? 'Finish current workout first' : 'Start workout'}
      </Button>
    </Card>
  )
}

const UNGROUPED = 'Routines'

function groupByFolder(routines: Routine[]): { folder: string; routines: Routine[] }[] {
  const map = new Map<string, Routine[]>()

  for (const r of routines) {
    const key = r.folder || UNGROUPED
    const existing = map.get(key)
    if (existing) existing.push(r)
    else map.set(key, [r])
  }

  const folders = [...map.keys()].filter((f) => f !== UNGROUPED).sort()
  if (map.has(UNGROUPED)) folders.push(UNGROUPED)

  return folders.map((folder) => ({ folder, routines: map.get(folder)! }))
}
