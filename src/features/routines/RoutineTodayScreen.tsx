import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useLiveQuery } from 'dexie-react-hooks'
import { ChevronLeft, ChevronRight, Flame, Plus, Check } from 'lucide-react'
import {
  listCareRoutines,
  getSteps,
  getDoneForDate,
  toggleStep,
  setSkipped,
  routineStreak,
  isComplete,
  TIMES,
} from '../../data/careRoutines'
import { todayISO, addDays, formatDay } from '../../data/dates'
import { Button, Card, Empty } from '../../components/ui'
import type { CareRoutine, CareDone } from '../../data/types'

export function RoutineTodayScreen() {
  const navigate = useNavigate()
  const [date, setDate] = useState(todayISO())

  const routines = useLiveQuery(() => listCareRoutines(), [])
  const done = useLiveQuery(() => getDoneForDate(date), [date])

  if (routines === undefined || done === undefined) return <Empty>Loading…</Empty>

  if (routines.length === 0) {
    return (
      <div className="stack">
        <Card>
          <p style={{ margin: 0 }}>No routines yet.</p>
          <p className="muted" style={{ margin: '0.5rem 0 0' }}>
            Build a skin or hair routine and tick off each step as you go.
          </p>
        </Card>
        <Button variant="primary" block onClick={() => navigate('/routines/manage/new')}>
          <Plus size={16} /> Create a routine
        </Button>
      </div>
    )
  }

  const doneByRoutine = new Map(done.map((d) => [d.careRoutineId, d]))
  const groups = TIMES.map((t) => ({
    time: t.value,
    label: t.label,
    routines: routines.filter((r) => r.timeOfDay === t.value),
  })).filter((g) => g.routines.length > 0)

  return (
    <div style={{ paddingBottom: '2rem' }}>
      <div className="row" style={{ marginBottom: '1.25rem' }}>
        <button
          className="icon-btn"
          aria-label="Previous day"
          onClick={() => setDate(addDays(date, -1))}
        >
          <ChevronLeft size={20} />
        </button>
        <h2 className="grow" style={{ textAlign: 'center', margin: 0 }}>
          {formatDay(date)}
        </h2>
        <button
          className="icon-btn"
          aria-label="Next day"
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
              done={doneByRoutine.get(r.id!)}
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
  date,
}: {
  routine: CareRoutine
  done: CareDone | undefined
  date: string
}) {
  const steps = useLiveQuery(() => getSteps(routine.id!), [routine.id])
  const streak = useLiveQuery(() => routineStreak(routine.id!), [routine.id, done])

  if (steps === undefined) return null

  const complete = isComplete(done, steps)
  const doneCount = steps.filter((s) => done?.stepIds.includes(s.id!)).length

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
            {done?.skipped ? 'Skipped' : `${doneCount}/${steps.length} done`}
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
            const ticked = done?.stepIds.includes(step.id!) ?? false
            return (
              <button
                key={step.id}
                className="btn-plain care-step"
                onClick={() => toggleStep(routine.id!, step.id!, date)}
              >
                <span className={`check-btn${ticked ? ' active' : ''}`} aria-hidden="true">
                  {ticked && <Check size={15} />}
                </span>
                <span className="grow" style={{ minWidth: 0 }}>
                  <span
                    style={{
                      display: 'block',
                      opacity: ticked ? 0.55 : 1,
                      textDecoration: ticked ? 'line-through' : 'none',
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
          onClick={() => setSkipped(routine.id!, date, !done?.skipped)}
        >
          {done?.skipped ? 'Undo skip' : 'Skip today'}
        </Button>
      </div>
    </Card>
  )
}