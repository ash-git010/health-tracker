import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useLiveQuery } from 'dexie-react-hooks'
import { ChevronUp, ChevronDown, MoreVertical, Play } from 'lucide-react'
import {
  listRoutines,
  getRoutineExercises,
  startWorkoutFromRoutine,
  routineFolders,
  moveRoutine,
  moveFolder,
  moveRoutineToFolder,
  UNGROUPED,
} from '../../data/routines'
import { activeWorkout } from '../../data/workouts'
import { Card, Empty, Fab, ScreenHeader } from '../../components/ui'
import { usePrompt } from '../../components/DialogProvider'
import type { Routine } from '../../data/types'

export function RoutineListScreen() {
  const navigate = useNavigate()
  const routines = useLiveQuery(() => listRoutines(), [])
  const folders = useLiveQuery(() => routineFolders(), [routines])
  const runningWorkout = useLiveQuery(() => activeWorkout(), [])

  if (routines === undefined || folders === undefined) return <Empty>Loading…</Empty>

  const groups = groupByFolder(routines, folders)

  return (
    <div style={{ paddingBottom: '2rem' }}>
      <ScreenHeader title="Routines" />

      {routines.length === 0 && (
        <Empty>No routines yet. Build one, or save a finished workout as one.</Empty>
      )}

      {groups.map((group, gi) => {
        const isUngrouped = group.folder === UNGROUPED
        const realFolders = groups.filter((g) => g.folder !== UNGROUPED)
        const isLastFolder = gi >= realFolders.length - 1

        return (
          <div
            key={group.folder}
            style={{
              marginBottom: '1.5rem',
              marginTop: isUngrouped && gi > 0 ? '2.25rem' : 0,
              paddingTop: isUngrouped && gi > 0 ? '1.5rem' : 0,
              borderTop: isUngrouped && gi > 0 ? '1px solid var(--border)' : 'none',
            }}
          >
            <div className="row" style={{ marginBottom: '0.5rem' }}>
              <h3 className="grow" style={{ margin: 0 }}>
                {isUngrouped ? 'Not in a folder' : group.folder}
              </h3>
              {!isUngrouped && (
                <>
                  <button
                    className="icon-btn"
                    aria-label={`Move ${group.folder} up`}
                    disabled={gi === 0}
                    style={{ opacity: gi === 0 ? 0.25 : 1 }}
                    onClick={() => moveFolder(group.folder, -1)}
                  >
                    <ChevronUp size={16} />
                  </button>
                  <button
                    className="icon-btn"
                    aria-label={`Move ${group.folder} down`}
                    disabled={isLastFolder}
                    style={{ opacity: isLastFolder ? 0.25 : 1 }}
                    onClick={() => moveFolder(group.folder, 1)}
                  >
                    <ChevronDown size={16} />
                  </button>
                </>
              )}
            </div>

            {group.routines.map((r, i) => (
              <RoutineRow
                key={r.id}
                routine={r}
                blocked={!!runningWorkout}
                isFirst={i === 0}
                isLast={i === group.routines.length - 1}
                folders={folders}
                onNavigate={navigate}
              />
            ))}
          </div>
        )
      })}

      <Fab label="New routine" onClick={() => navigate('/workouts/routines/new')} />
    </div>
  )
}

function RoutineRow({
  routine,
  blocked,
  isFirst,
  isLast,
  folders,
  onNavigate,
}: {
  routine: Routine
  blocked: boolean
  isFirst: boolean
  isLast: boolean
  folders: string[]
  onNavigate: (path: string) => void
}) {
  const exercises = useLiveQuery(() => getRoutineExercises(routine.id!), [routine.id])
  const [menuOpen, setMenuOpen] = useState(false)
  const prompt = usePrompt()

  async function handleMoveToFolder(folder: string | undefined) {
    setMenuOpen(false)
    await moveRoutineToFolder(routine.id!, folder)
  }

  async function handleNewFolder() {
    setMenuOpen(false)
    const name = await prompt({
      title: 'New folder',
      placeholder: 'Push Pull Legs',
      confirmLabel: 'Move',
    })
    if (name) await moveRoutineToFolder(routine.id!, name)
  }

  return (
    <Card style={{ marginBottom: '0.5rem', padding: '0.875rem' }}>
      <div className="row">
        <button
          className="btn-plain grow"
          style={{ minWidth: 0 }}
          onClick={() => onNavigate(`/workouts/routines/${routine.id}/edit`)}
        >
          <span style={{ display: 'block', fontWeight: 600 }}>{routine.name}</span>
          <span className="faint">{(exercises ?? []).length} exercises</span>
        </button>

        <button
          className="icon-btn"
          aria-label={`Move ${routine.name} up`}
          disabled={isFirst}
          style={{ opacity: isFirst ? 0.25 : 1 }}
          onClick={() => moveRoutine(routine.id!, -1)}
        >
          <ChevronUp size={16} />
        </button>
        <button
          className="icon-btn"
          aria-label={`Move ${routine.name} down`}
          disabled={isLast}
          style={{ opacity: isLast ? 0.25 : 1 }}
          onClick={() => moveRoutine(routine.id!, 1)}
        >
          <ChevronDown size={16} />
        </button>
        <button
          className="icon-btn"
          aria-label={`Options for ${routine.name}`}
          onClick={() => setMenuOpen(true)}
        >
          <MoreVertical size={16} />
        </button>
      </div>

      <button
        className="btn btn-sm btn-primary btn-block"
        style={{ marginTop: '0.75rem' }}
        disabled={blocked}
        onClick={async () => {
          await startWorkoutFromRoutine(routine.id!)
          onNavigate('/workouts/log')
        }}
      >
        {blocked ? (
          'Finish current workout first'
        ) : (
          <>
            <Play size={14} /> Start workout
          </>
        )}
      </button>

      {menuOpen && (
        <div className="sheet-backdrop" onClick={() => setMenuOpen(false)}>
          <div className="sheet" onClick={(e) => e.stopPropagation()}>
            <div className="sheet-title">Move to folder</div>

            <button
              className={`sheet-item${!routine.folder ? ' active' : ''}`}
              onClick={() => handleMoveToFolder(undefined)}
            >
              No folder
            </button>

            {folders.map((f) => (
              <button
                key={f}
                className={`sheet-item${routine.folder === f ? ' active' : ''}`}
                onClick={() => handleMoveToFolder(f)}
              >
                {f}
              </button>
            ))}

            <button className="sheet-item" onClick={handleNewFolder}>
              New folder…
            </button>
          </div>
        </div>
      )}
    </Card>
  )
}

function groupByFolder(
  routines: Routine[],
  folderOrder: string[]
): { folder: string; routines: Routine[] }[] {
  const map = new Map<string, Routine[]>()

  for (const r of routines) {
    const key = r.folder || UNGROUPED
    const existing = map.get(key)
    if (existing) existing.push(r)
    else map.set(key, [r])
  }

  const groups: { folder: string; routines: Routine[] }[] = []

  for (const folder of folderOrder) {
    const list = map.get(folder)
    if (list) groups.push({ folder, routines: list })
  }

  const ungrouped = map.get(UNGROUPED)
  if (ungrouped) groups.push({ folder: UNGROUPED, routines: ungrouped })

  return groups
}