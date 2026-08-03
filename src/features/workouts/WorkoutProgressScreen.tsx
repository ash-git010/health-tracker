import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useLiveQuery } from 'dexie-react-hooks'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  ResponsiveContainer,
  Tooltip,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  LineChart,
  Line,
} from 'recharts'
import { listWorkouts, getAllSets } from '../../data/workouts'
import { allExercises } from '../../data/exercises'
import {
  setsPerMuscleGroup,
  workoutCalendar,
  weekStreak,
  volumeSeries,
  recentPRs,
  type ExerciseMuscleInfo,
} from '../../data/workoutStats'
import { MUSCLE_GROUPS } from '../../data/muscleGroups'
import { todayISO, addDays, formatDay } from '../../data/dates'
import { Card, Empty, ScreenHeader } from '../../components/ui'
import type { Workout, WorkoutSet } from '../../data/types'

const RANGE_OPTIONS: { key: string; label: string; days: number }[] = [
  { key: 'week', label: 'This week', days: 7 },
  { key: 'month', label: 'This month', days: 30 },
  { key: '3m', label: '3 months', days: 90 },
]

const WEEKDAY_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

export function WorkoutProgressScreen() {
  const navigate = useNavigate()

  const workouts = useLiveQuery(() => listWorkouts(2000), [])
  const sets = useLiveQuery(() => getAllSets(), [])
  const exercises = useLiveQuery(() => allExercises(), [])

  const exerciseLookup = useMemo(() => {
    const map = new Map<string, ExerciseMuscleInfo>()
    for (const e of exercises ?? []) map.set(e.key, { target: e.target, secondary: e.secondary })
    return map
  }, [exercises])

  if (workouts === undefined || sets === undefined || exercises === undefined) {
    return <Empty>Loading…</Empty>
  }

  return (
    <div>
      <ScreenHeader title="Progress" />
      <StatCards workouts={workouts} />
      <CalendarSection workouts={workouts} navigate={navigate} />
      <MuscleGroupSection sets={sets} exerciseLookup={exerciseLookup} />
      <VolumeSection workouts={workouts} sets={sets} />
      <RecentPRsSection sets={sets} workouts={workouts} navigate={navigate} />
    </div>
  )
}

function StatCards({ workouts }: { workouts: Workout[] }) {
  const streak = weekStreak(workouts)
  const thisMonthPrefix = todayISO().slice(0, 7)
  const workoutsThisMonth = workouts.filter((w) => w.date.startsWith(thisMonthPrefix)).length

  return (
    <div className="row" style={{ marginBottom: '1.25rem', gap: '0.75rem' }}>
      <Card style={{ flex: 1, textAlign: 'center' }}>
        <div className="muted">Week streak</div>
        <strong style={{ fontSize: '1.6rem', display: 'block' }}>{streak}</strong>
        <div className="muted">{streak === 1 ? 'week' : 'weeks'}</div>
      </Card>
      <Card style={{ flex: 1, textAlign: 'center' }}>
        <div className="muted">This month</div>
        <strong style={{ fontSize: '1.6rem', display: 'block' }}>{workoutsThisMonth}</strong>
        <div className="muted">{workoutsThisMonth === 1 ? 'workout' : 'workouts'}</div>
      </Card>
    </div>
  )
}

function CalendarSection({
  workouts,
  navigate,
}: {
  workouts: Workout[]
  navigate: (path: string) => void
}) {
  const today = new Date()
  const [year, setYear] = useState(today.getFullYear())
  const [month, setMonth] = useState(today.getMonth())
  const [pickerDate, setPickerDate] = useState<string | null>(null)

  const days = workoutCalendar(workouts, year, month)
  const monthLabel = new Date(year, month, 1).toLocaleDateString(undefined, {
    month: 'long',
    year: 'numeric',
  })

  function changeMonth(delta: number) {
    let m = month + delta
    let y = year
    if (m < 0) {
      m = 11
      y -= 1
    } else if (m > 11) {
      m = 0
      y += 1
    }
    setMonth(m)
    setYear(y)
  }

  function workoutsOn(date: string) {
    return workouts.filter((w) => w.date === date)
  }

  function handleDayTap(date: string, hasWorkout: boolean) {
    if (!hasWorkout) return
    const dayWorkouts = workoutsOn(date)
    if (dayWorkouts.length === 1) {
      navigate(`/workouts/history/${dayWorkouts[0].id!}`)
    } else {
      setPickerDate(date)
    }
  }

  return (
    <div>
      <h3>Calendar</h3>
      <Card style={{ marginBottom: '1.25rem' }}>
        <div className="row" style={{ marginBottom: '0.5rem' }}>
          <button className="icon-btn" aria-label="Previous month" onClick={() => changeMonth(-1)}>
            ‹
          </button>
          <strong className="grow" style={{ textAlign: 'center' }}>
            {monthLabel}
          </strong>
          <button className="icon-btn" aria-label="Next month" onClick={() => changeMonth(1)}>
            ›
          </button>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '0.15rem' }}>
          {WEEKDAY_LABELS.map((d) => (
            <div key={d} className="muted" style={{ textAlign: 'center', fontSize: '0.7rem' }}>
              {d}
            </div>
          ))}
          {days.map((d) => (
            <button
              key={d.date}
              onClick={() => handleDayTap(d.date, d.hasWorkout)}
              className="btn-plain"
              style={{
                aspectRatio: '1',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                borderRadius: '8px',
                opacity: d.inMonth ? 1 : 0.35,
                background: d.date === todayISO() ? 'var(--surface-2)' : 'transparent',
                cursor: d.hasWorkout ? 'pointer' : 'default',
              }}
            >
              <span style={{ fontSize: '0.8125rem' }}>{Number(d.date.slice(-2))}</span>
              <span
                style={{
                  width: 5,
                  height: 5,
                  borderRadius: '50%',
                  marginTop: 2,
                  background: d.hasWorkout ? 'var(--accent)' : 'transparent',
                }}
              />
            </button>
          ))}
        </div>
      </Card>

      {pickerDate && (
        <div className="sheet-backdrop" onClick={() => setPickerDate(null)}>
          <div className="sheet" onClick={(e) => e.stopPropagation()}>
            <div className="sheet-title">{formatDay(pickerDate)}</div>
            {workoutsOn(pickerDate).map((w) => (
              <button
                key={w.id}
                className="sheet-item"
                onClick={() => navigate(`/workouts/history/${w.id!}`)}
              >
                {w.name || 'Workout'}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

function MuscleGroupSection({
  sets,
  exerciseLookup,
}: {
  sets: WorkoutSet[]
  exerciseLookup: Map<string, ExerciseMuscleInfo>
}) {
  const [rangeKey, setRangeKey] = useState('month')
  const days = RANGE_OPTIONS.find((r) => r.key === rangeKey)!.days
  const sinceDate = addDays(todayISO(), -days)

  const totals = setsPerMuscleGroup(sets, exerciseLookup, sinceDate)
  const data = MUSCLE_GROUPS.filter((g) => g !== 'Other' || totals[g] > 0)
    .map((g) => ({ group: g, value: totals[g] }))
    .sort((a, b) => b.value - a.value)

  const hasData = data.some((d) => d.value > 0)

  return (
    <div>
      <h3>Sets per muscle group</h3>
      <div className="chip-row">
        {RANGE_OPTIONS.map((r) => (
          <button
            key={r.key}
            className={`chip${rangeKey === r.key ? ' active' : ''}`}
            onClick={() => setRangeKey(r.key)}
          >
            {r.label}
          </button>
        ))}
      </div>

      <Card style={{ marginBottom: '1.25rem' }}>
        {!hasData ? (
          <p className="muted" style={{ margin: 0 }}>
            No sets logged in this range yet.
          </p>
        ) : (
          <div style={{ height: Math.max(data.length * 34, 120) }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={data}
                layout="vertical"
                margin={{ top: 4, right: 16, left: 0, bottom: 0 }}
              >
                <XAxis type="number" hide />
                <YAxis
                  type="category"
                  dataKey="group"
                  width={80}
                  tick={{ fontSize: 11, fill: 'var(--text-muted)' }}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip
                  formatter={(v) => [`${v} sets`, '']}
                  contentStyle={{
                    background: 'var(--surface)',
                    border: '1px solid var(--border)',
                    borderRadius: '8px',
                  }}
                />
                <Bar dataKey="value" fill="var(--accent)" radius={[0, 3, 3, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </Card>

      <h3>Muscle balance</h3>
      <Card style={{ marginBottom: '1.25rem' }}>
        {!hasData ? (
          <p className="muted" style={{ margin: 0 }}>
            Log a few workouts to see your muscle balance.
          </p>
        ) : (
          <>
            <div style={{ height: 260 }}>
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart data={data}>
                  <PolarGrid stroke="var(--border)" />
                  <PolarAngleAxis
                    dataKey="group"
                    tick={{ fontSize: 11, fill: 'var(--text-muted)' }}
                  />
                  <PolarRadiusAxis tick={false} axisLine={false} />
                  <Radar
                    dataKey="value"
                    stroke="var(--accent)"
                    fill="var(--accent)"
                    fillOpacity={0.35}
                  />
                </RadarChart>
              </ResponsiveContainer>
            </div>
            <p className="muted" style={{ margin: '0.5rem 0 0' }}>
              A lopsided shape shows what's undertrained relative to the rest.
            </p>
          </>
        )}
      </Card>
    </div>
  )
}

function VolumeSection({ workouts, sets }: { workouts: Workout[]; sets: WorkoutSet[] }) {
  const series = volumeSeries(workouts, sets, 90)

  return (
    <div>
      <h3>Volume trend</h3>
      <Card style={{ marginBottom: '1.25rem' }}>
        {series.length < 2 ? (
          <p className="muted" style={{ margin: 0 }}>
            Log a couple more workouts to see a volume trend.
          </p>
        ) : (
          <div style={{ height: 180 }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={series} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}>
                <XAxis
                  dataKey="date"
                  tickFormatter={(v) => shortDate(v as string)}
                  tick={{ fontSize: 11, fill: 'var(--text-muted)' }}
                  axisLine={false}
                  tickLine={false}
                  minTickGap={30}
                />
                <YAxis
                  tick={{ fontSize: 11, fill: 'var(--text-muted)' }}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip
                  formatter={(v) => [`${v} kg`, 'Volume']}
                  labelFormatter={(v) => shortDate(v as string)}
                  contentStyle={{
                    background: 'var(--surface)',
                    border: '1px solid var(--border)',
                    borderRadius: '8px',
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="volume"
                  stroke="var(--accent)"
                  strokeWidth={2.5}
                  dot={{ r: 2 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
      </Card>
    </div>
  )
}

function shortDate(iso: string): string {
  return new Date(iso + 'T12:00:00').toLocaleDateString(undefined, {
    day: 'numeric',
    month: 'short',
  })
}

function RecentPRsSection({
  sets,
  workouts,
  navigate,
}: {
  sets: WorkoutSet[]
  workouts: Workout[]
  navigate: (path: string) => void
}) {
  const prs = recentPRs(sets, workouts, 5)

  return (
    <div>
      <h3>Recent PRs</h3>
      <Card>
        {prs.length === 0 ? (
          <p className="muted" style={{ margin: 0 }}>
            No personal records yet — keep logging to see your best lifts here.
          </p>
        ) : (
          prs.map((pr, i) => (
            <button
              key={`${pr.exerciseKey}-${pr.date}-${i}`}
              className="btn-plain"
              style={{ display: 'block', width: '100%', padding: '0.4rem 0' }}
              onClick={() => navigate(`/workouts/exercises/${encodeURIComponent(pr.exerciseKey)}`)}
            >
              <div className="row">
                <strong className="grow">{pr.exerciseName}</strong>
                <span className="muted">{formatDay(pr.date)}</span>
              </div>
              <div className="muted">
                {pr.weightKg}kg × {pr.reps} · {pr.oneRM}kg 1RM
              </div>
            </button>
          ))
        )}
      </Card>
    </div>
  )
}
