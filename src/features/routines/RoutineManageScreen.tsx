import { useNavigate } from 'react-router-dom'
import { useLiveQuery } from 'dexie-react-hooks'
import { ChevronUp, ChevronDown, ChevronRight } from 'lucide-react'
import {
  listCareRoutines,
  getSteps,
  moveCareRoutine,
  routineKinds,
  kindLabel,
  times,
} from '../../data/careRoutines'
import { Card, Empty, Fab, ScreenHeader } from '../../components/ui'
import { t, plural } from '../../data/i18n'
import type { CareRoutine } from '../../data/types'

export function RoutineManageScreen() {
  const navigate = useNavigate()
  const routines = useLiveQuery(() => listCareRoutines(), [])
  const kinds = useLiveQuery(() => routineKinds(), [routines])

  if (routines === undefined || kinds === undefined) return <Empty>{t('common.loading')}</Empty>

  const groups = kinds
    .map((k) => ({
      kind: k,
      routines: routines.filter((r) => r.kind === k),
    }))
    .filter((g) => g.routines.length > 0)

  return (
    <div style={{ paddingBottom: '2rem' }}>
      <ScreenHeader title={t('care.manageTitle')} />

      {routines.length === 0 && <Empty>{t('care.manageEmpty')}</Empty>}

      {groups.map((group) => (
        <div key={group.kind} style={{ marginBottom: '1.5rem' }}>
          <h3>{kindLabel(group.kind)}</h3>
          {group.routines.map((r, i) => (
            <RoutineRow
              key={r.id}
              routine={r}
              isFirst={i === 0}
              isLast={i === group.routines.length - 1}
              onOpen={() => navigate(`/routines/manage/${r.id}/edit`)}
            />
          ))}
        </div>
      ))}

      <Fab label={t('care.newRoutine')} onClick={() => navigate('/routines/manage/new')} />
    </div>
  )
}

function RoutineRow({
  routine,
  isFirst,
  isLast,
  onOpen,
}: {
  routine: CareRoutine
  isFirst: boolean
  isLast: boolean
  onOpen: () => void
}) {
  const steps = useLiveQuery(() => getSteps(routine.id!), [routine.id])
  const timeLabel = times().find((time) => time.value === routine.timeOfDay)?.label

  return (
    <Card style={{ marginBottom: '0.5rem', padding: '0.875rem' }}>
      <div className="row">
        <button className="btn-plain grow row" style={{ minWidth: 0 }} onClick={onOpen}>
          <span className="grow" style={{ minWidth: 0 }}>
            <span style={{ display: 'block', fontWeight: 600 }}>{routine.name}</span>
            <span className="faint">
              {timeLabel} · {plural((steps ?? []).length, 'care.stepsCount')}
            </span>
          </span>
          <ChevronRight size={16} style={{ color: 'var(--text-faint)', flexShrink: 0 }} />
        </button>

        <button
          className="icon-btn"
          aria-label={t('care.moveUp', { name: routine.name })}
          disabled={isFirst}
          style={{ opacity: isFirst ? 0.25 : 1 }}
          onClick={() => moveCareRoutine(routine.id!, -1)}
        >
          <ChevronUp size={16} />
        </button>
        <button
          className="icon-btn"
          aria-label={t('care.moveDown', { name: routine.name })}
          disabled={isLast}
          style={{ opacity: isLast ? 0.25 : 1 }}
          onClick={() => moveCareRoutine(routine.id!, 1)}
        >
          <ChevronDown size={16} />
        </button>
      </div>
    </Card>
  )
}