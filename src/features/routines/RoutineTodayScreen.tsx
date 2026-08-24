import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useLiveQuery } from 'dexie-react-hooks'
import { ChevronLeft, ChevronRight, Flame, Plus, Check } from 'lucide-react'
import {
  listCareRoutines,
  getSteps,
  getDoneForDate,
  tickedStepIds,
  toggleStep,
  setSkipped,
  routineStreak,
  isComplete,
  times,
} from '../../data/careRoutines'
import { todayISO, addDays, formatDay } from '../../data/dates'
import { Button, Card, Empty } from '../../components/ui'
import { t } from '../../data/i18n'
import type { CareRoutine, CareDone } from '../../data/types'

export function RoutineTodayScreen() {
  const navigate = useNavigate()
  const [date, setDate] = useState(todayISO())

  const routines = useLiveQuery(() => listCareRoutines(), [])
  const done = useLiveQuery(() => getDoneForDate(date), [date])
  // Ticks now live in their own table, so they're a separate query. One query
  // for the whole day rather than one per routine.
  const ticked = useLiveQuery(() => tickedStepIds(date), [date])

  if (routines === undefined || done === undefined || ticked === undefined) {
    return <Empty>{t('common.loading')}</Empty>
  }

  if (routines.length === 0) {
    return (
      <div className="stack">
        <Card>
          <p style={{ margin: 0 }}>{t('care.emptyTitle')}</p>
          <p className="muted" style={{ margin: '0.5rem 0 0' }}>
            {t('care.emptyLead')}
          </p>
        </Card>
        <Button variant="primary" block onClick={() => navigate('/routines/manage/new')}>
          <Plus size={16} /> {t('care.createFirst')}
        </Button>
      </div>
    )
  }

  const doneByRoutine = new Map(done.map((d) => [d.careRoutineId, d]))
  const groups = times()
    .map((time) => ({
      time: time.value,
      label: time.label,
      routines: routines.filter((r) => r.timeOfDay === time.value),
    }))
    .filter((g) => g.routines.length > 0)

  return (
    <div style={{ paddingBottom: '2rem' }}>
      <div className="row" style={{ marginBottom: '1.25rem' }}>
        <button
          className="icon-btn"
          aria-label={t('care.prevDay')}
          onClick={() => setDate(addDays(date, -1))}
        >
          <ChevronLeft size={20} />
        </button>
        <h2 className="grow" style={{ textAlign: 'center', margin: 0 }}>
          {formatDay(date)}
        </h2>
        <button
          className="icon-btn"
          aria-label={t('care.nextDay')}
          disabled={date >= todayISO()}
          style={{ opacity: date >= todayISO() ? 0.3 : 1 }}
          onClick={() => setDate(addDays(date, 1))}
        >
          <ChevronRight size={20} />
        </button>
      </div>

      {groups.map((group) => (
        <div key={group.time} style={{ marginBottom: '1.5rem' }}>
          <h3>{group.label}</h3>
          {group.routines.map((r) => (
            <RoutineCard
              key={r.id}
              routine={r}
              done={doneByRoutine.get(r.id)}
              ticked={ticked}
              date={date}
            />
          ))}
        </div>
      ))}
    </div>
  )
}

function RoutineCard({
  routine,
  done,
  ticked,
  date,
}: {
  routine: CareRoutine
  done: CareDone | undefined
  ticked: Set<string>
  date: string
}) {
  const steps = useLiveQuery(() => getSteps(routine.id), [routine.id])
  // Recomputed when the tick set changes, not just when the skip row does.
  const streak = useLiveQuery(() => routineStreak(routine.id), [routine.id, done, ticked])

  if (steps === undefined) return null

  const complete = isComplete(done, steps, ticked)
  const doneCount = steps.filter((s) => ticked.has(s.id)).length

  return (
    <Card
      style={{
        marginBottom: '0.75rem',
        opacity: done?.skipped ? 0.55 : 1,
        borderColor: complete && !done?.skipped ? 'var(--accent)' : undefined,
      }}
    >
      <div className="row">
        <div className="grow" style={{ minWidth: 0 }}>
          <strong style={{ display: 'block' }}>{routine.name}</strong>
          <span className="faint">
            {done?.skipped
              ? t('care.skipped')
              : t('care.stepsDone', { done: doneCount, total: steps.length })}
          </span>
        </div>

        {(streak ?? 0) > 0 && (
          <span className="row faint" style={{ gap: '0.25rem', flexShrink: 0 }}>
            <Flame size={14} style={{ color: 'var(--warn)' }} />
            <span className="num">{streak}</span>
          </span>
        )}
      </div>

      {!done?.skipped && (
        <div style={{ marginTop: '0.75rem' }}>
          {steps.map((step) => {
            const isTicked = ticked.has(step.id)
            return (
              <button
                key={step.id}
                className="btn-plain care-step"
                onClick={() => toggleStep(routine.id, step.id, date)}
              >
                <span className={`check-btn${isTicked ? ' active' : ''}`} aria-hidden="true">
                  {isTicked && <Check size={15} />}
                </span>
                <span className="grow" style={{ minWidth: 0 }}>
                  <span
                    style={{
                      display: 'block',
                      opacity: isTicked ? 0.55 : 1,
                      textDecoration: isTicked ? 'line-through' : 'none',
                    }}
                  >
                    {step.name}
                  </span>
                  {step.product && <span className="faint">{step.product}</span>}
                </span>
              </button>
            )
          })}
        </div>
      )}

      <div className="row" style={{ marginTop: '0.6rem' }}>
        <Button
          size="sm"
          variant="ghost"
          onClick={() => setSkipped(routine.id, date, !done?.skipped)}
        >
          {done?.skipped ? t('care.undoSkip') : t('care.skipToday')}
        </Button>
      </div>
    </Card>
  )
}