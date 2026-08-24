import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useLiveQuery } from 'dexie-react-hooks'
import { ChevronUp, ChevronDown, MoreVertical, Play, Plus } from 'lucide-react'
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
import {
  listPrograms,
  activateProgram,
  deactivateProgram,
  deleteProgram,
  currentWeekNumber,
} from '../../data/programs'
import { activeWorkout } from '../../data/workouts'
import { Card, Empty, Fab, ScreenHeader } from '../../components/ui'
import { OptionSheet } from '../../components/OptionSheet'
import { usePrompt, useConfirm } from '../../components/DialogProvider'
import { t, plural } from '../../data/i18n'
import type { Routine, Program } from '../../data/types'

export function RoutineListScreen() {
  const navigate = useNavigate()
  const routines = useLiveQuery(() => listRoutines(), [])
  const folders = useLiveQuery(() => routineFolders(), [routines])
  const programs = useLiveQuery(() => listPrograms(), [])
  const runningWorkout = useLiveQuery(() => activeWorkout(), [])
  const [newProgramMenu, setNewProgramMenu] = useState(false)

  if (routines === undefined || folders === undefined || programs === undefined) {
    return <Empty>{t('common.loading')}</Empty>
  }

  const groups = groupByFolder(routines, folders)

  return (
    <div style={{ paddingBottom: '2rem' }}>
      <ScreenHeader title={t('routines.title')} />

      <div style={{ marginBottom: '2rem' }}>
        <div className="row" style={{ marginBottom: '0.5rem' }}>
          <h3 className="grow" style={{ margin: 0 }}>
            {t('programs.list.heading')}
          </h3>
          <button
            className="icon-btn"
            aria-label={t('programs.list.new')}
            onClick={() => setNewProgramMenu(true)}
          >
            <Plus size={16} />
          </button>
        </div>

        {programs.length === 0 && <Empty>{t('programs.list.empty')}</Empty>}

        {programs.map((p) => (
          <ProgramRow key={p.id} program={p} onNavigate={navigate} />
        ))}
      </div>

      {routines.length === 0 && <Empty>{t('routines.empty')}</Empty>}

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
                {isUngrouped ? t('routines.ungrouped') : group.folder}
              </h3>
              {!isUngrouped && (
                <>
                  <button
                    className="icon-btn"
                    aria-label={t('routines.moveFolderUp', { folder: group.folder })}
                    disabled={gi === 0}
                    style={{ opacity: gi === 0 ? 0.25 : 1 }}
                    onClick={() => moveFolder(group.folder, -1)}
                  >
                    <ChevronUp size={16} />
                  </button>
                  <button
                    className="icon-btn"
                    aria-label={t('routines.moveFolderDown', { folder: group.folder })}
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

      <Fab label={t('routines.newRoutine')} onClick={() => navigate('/workouts/routines/new')} />

      {newProgramMenu && (
        <OptionSheet
          title={t('programs.list.new')}
          onClose={() => setNewProgramMenu(false)}
          options={[
            {
              label: t('programs.list.importOption'),
              onSelect: () => {
                setNewProgramMenu(false)
                navigate('/workouts/programs/import')
              },
            },
            {
              label: t('programs.list.manualOption'),
              onSelect: () => {
                setNewProgramMenu(false)
                navigate('/workouts/programs/new')
              },
            },
          ]}
        />
      )}
    </div>
  )
}

function ProgramRow({
  program,
  onNavigate,
}: {
  program: Program
  onNavigate: (path: string) => void
}) {
  const [menuOpen, setMenuOpen] = useState(false)
  const confirm = useConfirm()

  async function handleToggleActive() {
    setMenuOpen(false)
    if (program.isActive) await deactivateProgram(program.id)
    else await activateProgram(program.id)
  }

  async function handleDelete() {
    setMenuOpen(false)
    const ok = await confirm({
      title: t('programs.list.deleteTitle', { name: program.name }),
      message: t('programs.list.deleteMessage'),
      confirmLabel: t('common.delete'),
      destructive: true,
    })
    if (ok) await deleteProgram(program.id)
  }

  return (
    <Card style={{ marginBottom: '0.5rem', padding: '0.875rem' }}>
      <div className="row">
        <button
          className="btn-plain grow"
          style={{ minWidth: 0 }}
          onClick={() => onNavigate(`/workouts/programs/${program.id}/edit`)}
        >
          <span style={{ display: 'block', fontWeight: 600 }}>{program.name}</span>
          <span className={program.isActive ? 'success' : 'faint'}>
            {program.isActive
              ? t('programs.list.active', { n: currentWeekNumber(program) })
              : t('programs.list.inactive')}
          </span>
        </button>

        <button
          className="icon-btn"
          aria-label={t('programs.list.optionsFor', { name: program.name })}
          onClick={() => setMenuOpen(true)}
        >
          <MoreVertical size={16} />
        </button>
      </div>

      {menuOpen && (
        <OptionSheet
          title={program.name}
          onClose={() => setMenuOpen(false)}
          options={[
            {
              label: program.isActive ? t('programs.list.deactivate') : t('programs.list.activate'),
              onSelect: handleToggleActive,
            },
            {
              label: t('programs.list.edit'),
              onSelect: () => {
                setMenuOpen(false)
                onNavigate(`/workouts/programs/${program.id}/edit`)
              },
            },
            { label: t('common.delete'), onSelect: handleDelete },
          ]}
        />
      )}
    </Card>
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
      title: t('routines.newFolderTitle'),
      placeholder: t('routines.newFolderPlaceholder'),
      confirmLabel: t('routines.newFolderConfirm'),
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
          <span className="faint">{plural((exercises ?? []).length, 'routines.exerciseCount')}</span>
        </button>

        <button
          className="icon-btn"
          aria-label={t('routines.moveRoutineUp', { name: routine.name })}
          disabled={isFirst}
          style={{ opacity: isFirst ? 0.25 : 1 }}
          onClick={() => moveRoutine(routine.id!, -1)}
        >
          <ChevronUp size={16} />
        </button>
        <button
          className="icon-btn"
          aria-label={t('routines.moveRoutineDown', { name: routine.name })}
          disabled={isLast}
          style={{ opacity: isLast ? 0.25 : 1 }}
          onClick={() => moveRoutine(routine.id!, 1)}
        >
          <ChevronDown size={16} />
        </button>
        <button
          className="icon-btn"
          aria-label={t('routines.optionsFor', { name: routine.name })}
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
          t('routines.finishCurrentFirst')
        ) : (
          <>
            <Play size={14} /> {t('routines.startWorkout')}
          </>
        )}
      </button>

      {menuOpen && (
        <div className="sheet-backdrop" onClick={() => setMenuOpen(false)}>
          <div className="sheet" onClick={(e) => e.stopPropagation()}>
            <div className="sheet-title">{t('routines.moveToFolder')}</div>

            <button
              className={`sheet-item${!routine.folder ? ' active' : ''}`}
              onClick={() => handleMoveToFolder(undefined)}
            >
              {t('routines.noFolder')}
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
              {t('routines.newFolderOption')}
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
