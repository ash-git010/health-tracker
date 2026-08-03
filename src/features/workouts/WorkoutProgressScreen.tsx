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
import { ChevronLeft, ChevronRight, Trophy, Library } from 'lucide-react'
import { listWorkouts, getAllSets, completedSets, workoutVolume } from '../../data/workouts'
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
import { Button, Card, Empty, ScreenHeader } from '../../components/ui'
import type { Workout, WorkoutSet } from '../../data/types'

const RANGE_OPTIONS: { key: string; label: string; days: number }[] = [
  { key: 'week', label: 'This week', days: 7 },
  { key: 'month', label: 'This month', days: 30 },
  { key: '3m', label: '3 months', days: 90 },
]

const WEEKDAY_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

const TOOLTIP_STYLE = {
  background: 'var(--bg-elevated)',
  border: '1px solid var(--border-strong)',
  borderRadius: '10px',
}

const AXIS_TICK = { fontSize: 11, fill: 'var(--text-faint)' }

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
    <div style={{ paddingBottom: '2rem' }}>
      <ScreenHeader title="Progress" />
      <StatCards workouts={workouts} sets={sets} />
      <CalendarSection workouts={workouts} navigate={navigate} />
      <RecentWorkoutsSection workouts={workouts} sets={sets} navigate={navigate} />
      <MuscleGroupSection sets={sets} exerciseLookup={exerciseLookup} />
      <VolumeSection workouts={workouts} sets={sets} />
      <RecentPRsSection sets={sets} workouts={workouts} navigate={navigate} />

      <div style={{ marginTop: '1.5rem' }}>
        <Button block onClick={() => navigate('/workouts/exercises')}>
          <Library size={16} /> Browse exercises
        </Button>
      </div>
    </div>
  )
}

function StatCards({ workouts, sets }: { workouts: Workout[]; sets: WorkoutSet[] }) {
  const streak = weekStreak(workouts)
  const thisMonthPrefix = todayISO().slice(0, 7)
  const monthWorkouts = workouts.filter((w) => w.date.startsWith(thisMonthPrefix))
  const monthIds = new Set(monthWorkouts.map((w) => w.id))
  const monthVolume = workoutVolume(sets.filter((s) => monthIds.has(s.workoutId)))

  return (
    <div className="row" style={{ marginBottom: '1.75rem', gap: '0.75rem', alignItems: 'stretch' }}>
      <StatCard label="Week streak" value={streak} unit={streak === 1 ? 'week' : 'weeks'} />
      <StatCard
        label="This month"
        value={monthWorkouts.length}
        unit={monthWorkouts.length === 1 ? 'workout' : 'workouts'}
      />
      <StatCard label="Volume" value={Math.round(monthVolume)} unit="kg" />
    </div>
  )
}

function StatCard({ label, value, unit }: { label: string; value: number; unit: string }) {
  return (
    <Card style={{ flex: 1, padding: '0.875rem 0.75rem' }}>
      <div className="faint" style={{ fontSize: '0.6875rem' }}>
        {label}
      </div>
      <div className="stat-sm" style={{ margin: '0.15rem 0' }}>
        {value}
      </div>
      <div className="faint" style={{ fontSize: '0.6875rem' }}>
        {unit}
      </div>
    </Card>
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
      <Card style={{ marginBottom: '1.75rem' }}>
        <div className="row" style={{ marginBottom: '0.75rem' }}>
          <button className="icon-btn" aria-label="Previous month" onClick={() => changeMonth(-1)}>
            <ChevronLeft size={18} />
          </button>
          <strong className="grow" style={{ textAlign: 'center' }}>
            {monthLabel}
          </strong>
          <button className="icon-btn" aria-label="Next month" onClick={() => changeMonth(1)}>
            <ChevronRight size={18} />
          </button>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '0.15rem' }}>
          {WEEKDAY_LABELS.map((d) => (
            <div
              key={d}
              className="faint"
              style={{ textAlign: 'center', fontSize: '0.6875rem', paddingBottom: '0.35rem' }}
            >
              {d}
            </div>
          ))}
          {days.map((d) => {
            const isToday = d.date === todayISO()
            return (
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
                  borderRadius: '10px',
                  opacity: d.inMonth ? 1 : 0.25,
                  background: d.hasWorkout
                    ? 'var(--accent-soft)'
                    : isToday
                      ? 'var(--surface-2)'
                      : 'transparent',
                  border: isToday ? '1px solid var(--border-strong)' : '1px solid transparent',
                  cursor: d.hasWorkout ? 'pointer' : 'default',
                }}
              >
                <span
                  className="num"
                  style={{
                    fontSize: '0.8125rem',
                    fontWeight: d.hasWorkout ? 650 : 400,
                    color: d.hasWorkout ? 'var(--accent)' : 'var(--text)',
                  }}
                >
                  {Number(d.date.slice(-2))}
                </span>
              </button>
            )
          })}
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

function RecentWorkoutsSection({
  workouts,
  sets,
  navigate,
}: {
  workouts: Workout[]
  sets: WorkoutSet[]
  navigate: (path: string) => void
}) {
  const recent = workouts.slice(0, 5)

  return (
    <div style={{ marginBottom: '1.75rem' }}>
      <div className="row" style={{ marginBottom: '0.5rem' }}>
        <h3 className="grow" style={{ margin: 0 }}>
          Recent workouts
        </h3>
        <button className="btn-plain muted" onClick={() => navigate('/workouts/history')}>
          See all
        </button>
      </div>

      {recent.length === 0 ? (
        <Card>
          <p className="muted" style={{ margin: 0 }}>
            No workouts logged yet.
          </p>
        </Card>
      ) : (
        <div>
          {recent.map((w) => (
            <RecentWorkoutCard
              key={w.id}
              workout={w}
              sets={sets.filter((s) => s.workoutId === w.id)}
              navigate={navigate}
            />
          ))}
        </div>
      )}
    </div>
  )
}

function RecentWorkoutCard({
  workout,
  sets,
  navigate,
}: {
  workout: Workout
  sets: WorkoutSet[]
  navigate: (path: string) => void
}) {
  const exercises = new Set(sets.map((s) => s.exerciseKey)).size
  const setCount = completedSets(sets).length
  const volume = workoutVolume(sets)

  return (
    <button
      className="btn-plain"
      style={{ display: 'block', width: '100%', marginBottom: '0.5rem' }}
      onClick={() => navigate(`/workouts/history/${workout.id!}`)}
    >
      <Card>
        <div className="row">
          <strong className="grow">{workout.name || 'Workout'}</strong>
          <span className="faint">{formatDay(workout.date)}</span>
        </div>
        <div className="muted" style={{ marginTop: '0.25rem' }}>
          {exercises} exercises · {setCount} sets · {Math.round(volume)} kg
        </div>
      </Card>
    </button>
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
  const totalSets = data.reduce((sum, d) => sum + d.value, 0)

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

      <Card style={{ marginBottom: '1.75rem' }}>
        {!hasData ? (
          <p className="muted" style={{ margin: 0 }}>
            No sets logged in this range yet.
          </p>
        ) : (
          <>
            <div className="faint">Total</div>
            <div className="row" style={{ alignItems: 'baseline', gap: '0.3rem', marginBottom: '0.75rem' }}>
              <span className="stat-sm">{Math.round(totalSets)}</span>
              <span className="stat-unit">sets</span>
            </div>

            <div style={{ height: Math.max(data.length * 32, 120) }}>
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
                    width={84}
                    tick={AXIS_TICK}
                    axisLine={false}
                    tickLine={false}
                  />
                  <Tooltip
                    formatter={(v) => [`${v} sets`, '']}
                    contentStyle={TOOLTIP_STYLE}
                    cursor={{ fill: 'var(--surface-2)' }}
                  />
                  <Bar dataKey="value" fill="var(--accent)" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </>
        )}
      </Card>

      <h3>Muscle balance</h3>
      <Card style={{ marginBottom: '1.75rem' }}>
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
                  <PolarAngleAxis dataKey="group" tick={AXIS_TICK} />
                  <PolarRadiusAxis tick={false} axisLine={false} />
                  <Radar
                    dataKey="value"
                    stroke="var(--accent)"
                    strokeWidth={2}
                    fill="var(--accent)"
                    fillOpacity={0.3}
                  />
                </RadarChart>
              </ResponsiveContainer>
            </div>
            <p className="faint" style={{ margin: '0.5rem 0 0' }}>
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
  const latest = series[series.length - 1]

  return (
    <div>
      <h3>Volume trend</h3>
      <Card style={{ marginBottom: '1.75rem' }}>
        {series.length < 2 ? (
          <p className="muted" style={{ margin: 0 }}>
            Log a couple more workouts to see a volume trend.
          </p>
        ) : (
          <>
            <div className="faint">Last session</div>
            <div className="row" style={{ alignItems: 'baseline', gap: '0.3rem', marginBottom: '0.75rem' }}>
              <span className="stat-sm">{Math.round(latest.volume)}</span>
              <span className="stat-unit">kg</span>
            </div>

            <div style={{ height: 180 }}>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={series} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}>
                  <XAxis
                    dataKey="date"
                    tickFormatter={(v) => shortDate(v as string)}
                    tick={AXIS_TICK}
                    axisLine={false}
                    tickLine={false}
                    minTickGap={30}
                  />
                  <YAxis tick={AXIS_TICK} axisLine={false} tickLine={false} />
                  <Tooltip
                    formatter={(v) => [`${v} kg`, 'Volume']}
                    labelFormatter={(v) => shortDate(v as string)}
                    contentStyle={TOOLTIP_STYLE}
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
          </>
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
              style={{
                display: 'block',
                width: '100%',
                padding: '0.7rem 0',
                borderBottom: i < prs.length - 1 ? '1px solid var(--border)' : 'none',
              }}
              onClick={() => navigate(`/workouts/exercises/${encodeURIComponent(pr.exerciseKey)}`)}
            >
              <div className="row">
                <Trophy size={15} style={{ color: 'var(--warn)', flexShrink: 0 }} />
                <strong className="grow" style={{ minWidth: 0 }}>
                  {pr.exerciseName}
                </strong>
                <span className="faint">{formatDay(pr.date)}</span>
              </div>
              <div className="muted" style={{ marginTop: '0.2rem', paddingLeft: '1.5rem' }}>
                {pr.weightKg}kg × {pr.reps} · {pr.oneRM}kg 1RM
              </div>
            </button>
          ))
        )}
      </Card>
    </div>
  )
}