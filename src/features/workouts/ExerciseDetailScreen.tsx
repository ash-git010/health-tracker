import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams, type NavigateFunction } from 'react-router-dom'
import { useLiveQuery } from 'dexie-react-hooks'
import { LineChart, Line, XAxis, YAxis, ResponsiveContainer, Tooltip } from 'recharts'
import { findExercise, type ExerciseOption } from '../../data/exercises'
import { getWorkoutsByIds } from '../../data/workouts'
import {
  getSetsForExercise,
  exercisePRs,
  lifetimeStats,
  performanceTable,
  progressSeries,
  epley1RM,
  type ExercisePR,
  type ProgressPoint,
} from '../../data/exerciseStats'
import { formatDay, addDays, todayISO } from '../../data/dates'
import { EquipmentIcon, categoryFor, CATEGORY_LABEL } from '../../components/EquipmentIcon'
import { Card, Empty } from '../../components/ui'
import type { Workout, WorkoutSet } from '../../data/types'

type Tab = 'about' | 'history' | 'progress' | 'records'

const TABS: { key: Tab; label: string }[] = [
  { key: 'about', label: 'About' },
  { key: 'history', label: 'History' },
  { key: 'progress', label: 'Progress' },
  { key: 'records', label: 'Records' },
]

export function ExerciseDetailScreen() {
  const navigate = useNavigate()
  const { key: rawKey } = useParams()
  const key = decodeURIComponent(rawKey ?? '')
  const [tab, setTab] = useState<Tab>('about')

  const [exercise, setExercise] = useState<ExerciseOption | null | undefined>(undefined)

  useEffect(() => {
    let cancelled = false
    setExercise(undefined)
    findExercise(key).then((e) => {
      if (!cancelled) setExercise(e ?? null)
    })
    return () => {
      cancelled = true
    }
  }, [key])

  const sets = useLiveQuery(() => getSetsForExercise(key), [key])
  const workoutIds = useMemo(() => [...new Set((sets ?? []).map((s) => s.workoutId))], [sets])
  const workoutIdsKey = workoutIds.join(',')
  const workouts = useLiveQuery(() => getWorkoutsByIds(workoutIds), [workoutIdsKey])

  if (exercise === undefined) return <Empty>Loading…</Empty>
  if (exercise === null) return <Empty>Exercise not found.</Empty>

  return (
    <div>
      <div className="row" style={{ marginBottom: '0.75rem' }}>
        <button
          className="icon-btn"
          aria-label="Back"
          onClick={() => navigate(-1)}
          style={{ marginLeft: '-0.5rem' }}
        >
          ‹
        </button>
        <h2 className="grow" style={{ margin: 0 }}>
          {exercise.name}
        </h2>
      </div>

      <div className="chip-row">
        {TABS.map((t) => (
          <button
            key={t.key}
            className={`chip${tab === t.key ? ' active' : ''}`}
            onClick={() => setTab(t.key)}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'about' && <AboutTab exercise={exercise} />}
      {tab === 'history' && <HistoryTab sets={sets} workouts={workouts} navigate={navigate} />}
      {tab === 'progress' && <ProgressTab sets={sets} workouts={workouts} />}
      {tab === 'records' && <RecordsTab sets={sets} workouts={workouts} />}
    </div>
  )
}

function AboutTab({ exercise }: { exercise: ExerciseOption }) {
  return (
    <div>
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '0.5rem',
          margin: '0 auto 1.25rem',
        }}
      >
        <div
          style={{
            width: 96,
            height: 96,
            borderRadius: 'var(--radius-lg)',
            background: 'var(--surface-2)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'var(--accent)',
          }}
        >
          <EquipmentIcon equipment={exercise.equipment} size={40} />
        </div>
        <span className="faint">{CATEGORY_LABEL[categoryFor(exercise.equipment)]}</span>
      </div>

      <Card style={{ marginBottom: '1rem' }}>
        <InfoRow label="Body part" value={exercise.bodyPart} />
        <InfoRow label="Equipment" value={exercise.equipment} />
        <InfoRow label="Target muscle" value={exercise.target} />
        {exercise.secondary.length > 0 && (
          <InfoRow label="Secondary muscles" value={exercise.secondary.join(', ')} />
        )}
      </Card>

      {exercise.steps.length > 0 && (
        <>
          <h3>Instructions</h3>
          <ol style={{ margin: 0, paddingLeft: '1.1rem' }}>
            {exercise.steps.map((s, i) => (
              <li key={i} style={{ marginBottom: '0.5rem' }}>
                {s}
              </li>
            ))}
          </ol>
        </>
      )}
    </div>
  )
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="row" style={{ padding: '0.35rem 0' }}>
      <span className="grow muted">{label}</span>
      <strong style={{ textTransform: 'capitalize' }}>{value}</strong>
    </div>
  )
}

function HistoryTab({
  sets,
  workouts,
  navigate,
}: {
  sets?: WorkoutSet[]
  workouts?: Workout[]
  navigate: NavigateFunction
}) {
  if (sets === undefined || workouts === undefined) return <Empty>Loading…</Empty>

  const groups = groupByWorkout(sets, workouts)

  if (groups.length === 0) return <Empty>No history for this exercise yet.</Empty>

  return (
    <div>
      {groups.map((g) => {
        const bestSetId = bestSet(g.sets)?.id
        return (
          <Card key={g.workout.id} style={{ marginBottom: '0.75rem', cursor: 'pointer' }}>
            <div onClick={() => navigate(`/workouts/history/${g.workout.id}`)}>
              <div className="row">
                <strong className="grow">{g.workout.name}</strong>
                <span className="muted">{formatDay(g.workout.date)}</span>
              </div>
              <div style={{ marginTop: '0.5rem' }}>
                {g.sets.map((s) => (
                  <div key={s.id} className="row" style={{ padding: '0.2rem 0' }}>
                    <span className="grow">
                      {s.weightKg}kg × {s.reps} reps
                      {s.id === bestSetId && (
                        <strong style={{ color: 'var(--accent)' }}> · Best</strong>
                      )}
                    </span>
                    <span className="muted">{epley1RM(s.weightKg, s.reps)}kg 1RM</span>
                  </div>
                ))}
              </div>
            </div>
          </Card>
        )
      })}
    </div>
  )
}

function bestSet(sets: WorkoutSet[]): WorkoutSet | null {
  return sets.reduce<WorkoutSet | null>((best, s) => {
    if (!best) return s
    return epley1RM(s.weightKg, s.reps) > epley1RM(best.weightKg, best.reps) ? s : best
  }, null)
}

function groupByWorkout(
  sets: WorkoutSet[],
  workouts: Workout[]
): { workout: Workout; sets: WorkoutSet[] }[] {
  const workoutById = new Map(workouts.map((w) => [w.id!, w]))
  const map = new Map<string, WorkoutSet[]>()

  for (const s of sets) {
    const list = map.get(s.workoutId) ?? []
    list.push(s)
    map.set(s.workoutId, list)
  }

  const groups: { workout: Workout; sets: WorkoutSet[] }[] = []
  for (const [workoutId, workoutSets] of map) {
    const workout = workoutById.get(workoutId)
    if (!workout) continue
    groups.push({ workout, sets: workoutSets.sort((a, b) => a.setNumber - b.setNumber) })
  }

  return groups.sort((a, b) => b.workout.date.localeCompare(a.workout.date))
}

const RANGE_OPTIONS: { key: string; label: string; days: number | null }[] = [
  { key: '3m', label: '3m', days: 90 },
  { key: '1y', label: '1y', days: 365 },
  { key: 'all', label: 'All', days: null },
]

function ProgressTab({ sets, workouts }: { sets?: WorkoutSet[]; workouts?: Workout[] }) {
  const [range, setRange] = useState('3m')

  if (sets === undefined || workouts === undefined) return <Empty>Loading…</Empty>

  const series = progressSeries(sets, workouts)

  if (series.length < 2) {
    return <Empty>Log this exercise in at least 2 workouts to see progress charts.</Empty>
  }

  const days = RANGE_OPTIONS.find((r) => r.key === range)?.days ?? null
  const cutoff = days === null ? null : addDays(todayISO(), -days)
  const filtered = cutoff === null ? series : series.filter((p) => p.date >= cutoff)
  const latest = series[series.length - 1]
  const best = {
    oneRM: Math.max(...series.map((p) => p.oneRM)),
    maxWeight: Math.max(...series.map((p) => p.maxWeight)),
    volume: Math.max(...series.map((p) => p.volume)),
  }

  return (
    <div>
      <div className="chip-row">
        {RANGE_OPTIONS.map((r) => (
          <button
            key={r.key}
            className={`chip${range === r.key ? ' active' : ''}`}
            onClick={() => setRange(r.key)}
          >
            {r.label}
          </button>
        ))}
      </div>

      <ProgressChart
        title="Estimated 1RM"
        unit="kg"
        latest={latest.oneRM}
        best={best.oneRM}
        dataKey="oneRM"
        points={filtered}
      />
      <ProgressChart
        title="Max weight"
        unit="kg"
        latest={latest.maxWeight}
        best={best.maxWeight}
        dataKey="maxWeight"
        points={filtered}
      />
      <ProgressChart
        title="Volume per session"
        unit="kg"
        latest={latest.volume}
        best={best.volume}
        dataKey="volume"
        points={filtered}
      />
    </div>
  )
}

function ProgressChart({
  title,
  unit,
  latest,
  best,
  dataKey,
  points,
}: {
  title: string
  unit: string
  latest: number
  best: number
  dataKey: keyof ProgressPoint
  points: ProgressPoint[]
}) {
  const hasDuplicateDates = new Set(points.map((p) => p.date)).size !== points.length
  const chartData = points.map((p, i) => ({ ...p, session: i + 1 }))
  const xKey = hasDuplicateDates ? 'session' : 'date'

  function formatTick(v: string | number): string {
    return hasDuplicateDates ? `#${v}` : shortDate(v as string)
  }

  return (
    <Card style={{ marginBottom: '1rem' }}>
      <h3 style={{ marginBottom: '0.5rem' }}>{title}</h3>

      <div className="faint">Latest</div>
      <div className="row" style={{ alignItems: 'baseline', gap: '0.3rem' }}>
        <span className="stat-sm">{Math.round(latest * 10) / 10}</span>
        <span className="stat-unit">{unit}</span>
      </div>
      <div className="muted" style={{ marginBottom: '0.75rem' }}>
        Best: {Math.round(best * 10) / 10}
        {unit}
      </div>

      {points.length < 2 ? (
        <p className="muted" style={{ margin: 0 }}>
          Not enough sessions in this range to show a trend.
        </p>
      ) : (
        <div style={{ height: 160 }}>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}>
              <XAxis
                dataKey={xKey}
                tickFormatter={formatTick}
                tick={{ fontSize: 11, fill: 'var(--text-muted)' }}
                axisLine={false}
                tickLine={false}
                minTickGap={30}
              />
              <YAxis
                domain={[0, 'auto']}
                tick={{ fontSize: 11, fill: 'var(--text-muted)' }}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip
                formatter={(v) => [`${v} ${unit}`, title]}
                labelFormatter={(v) => formatTick(v as string | number)}
                contentStyle={{
                  background: 'var(--bg-elevated)',
                  border: '1px solid var(--border-strong)',
                  borderRadius: '10px',
                }}
              />
              <Line
                type="monotone"
                dataKey={dataKey}
                stroke="var(--accent)"
                strokeWidth={2.5}
                dot={{ r: 2 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}
    </Card>
  )
}

function shortDate(iso: string): string {
  return new Date(iso + 'T12:00:00').toLocaleDateString(undefined, {
    day: 'numeric',
    month: 'short',
  })
}

function RecordsTab({ sets, workouts }: { sets?: WorkoutSet[]; workouts?: Workout[] }) {
  if (sets === undefined || workouts === undefined) return <Empty>Loading…</Empty>

  const prs = exercisePRs(sets, workouts)
  const lifetime = lifetimeStats(sets, workouts)
  const table = prs.oneRM ? performanceTable(prs.oneRM.value) : []

  return (
    <div>
      <h3>Personal records</h3>
      <Card style={{ marginBottom: '1.25rem' }}>
        <PRRow label="Estimated 1RM" unit="kg" pr={prs.oneRM} />
        <PRRow label="Max weight" unit="kg" pr={prs.maxWeight} />
        <PRRow label="Max reps" unit="reps" pr={prs.maxReps} />
        <PRRow label="Max workout volume" unit="kg" pr={prs.maxWorkoutVolume} />
        <PRRow label="Max set volume" unit="kg" pr={prs.maxSetVolume} />
      </Card>

      <h3>Lifetime stats</h3>
      <Card style={{ marginBottom: '1.25rem' }}>
        <StatRow label="Workouts" value={String(lifetime.workouts)} />
        <StatRow label="Total sets" value={String(lifetime.totalSets)} />
        <StatRow label="Total reps" value={String(lifetime.totalReps)} />
        <StatRow label="Total volume" value={`${Math.round(lifetime.totalVolume)} kg`} />
      </Card>

      {table.length > 0 && (
        <>
          <h3>Estimated performance</h3>
          <Card>
            {table.map((row) => (
              <div key={row.reps} className="row" style={{ marginBottom: '0.4rem' }}>
                <div
                  style={{
                    flex: 1,
                    position: 'relative',
                    height: '1.85rem',
                    background: 'var(--surface-2)',
                    borderRadius: 6,
                    overflow: 'hidden',
                  }}
                >
                  <div
                    style={{
                      position: 'absolute',
                      inset: 0,
                      width: `${Math.min(row.percent, 100)}%`,
                      background: 'var(--accent)',
                    }}
                  />
                  <span
                    style={{
                      position: 'relative',
                      display: 'block',
                      padding: '0.3rem 0.6rem',
                      fontSize: '0.8125rem',
                      fontWeight: 600,
                      color: 'var(--accent-text)',
                    }}
                  >
                    {row.weight}kg × {row.reps}
                  </span>
                </div>
                <span className="muted" style={{ width: '3rem', textAlign: 'right' }}>
                  {row.percent}%
                </span>
              </div>
            ))}
            <p className="muted" style={{ margin: '0.75rem 0 0' }}>
              Estimated using the Epley formula from your best set — actual performance may vary.
            </p>
          </Card>
        </>
      )}
    </div>
  )
}

function PRRow({ label, unit, pr }: { label: string; unit: string; pr: ExercisePR | null }) {
  return (
    <div className="row" style={{ padding: '0.45rem 0', alignItems: 'flex-start' }}>
      <span className="grow muted">{label}</span>
      {pr ? (
        <div style={{ textAlign: 'right' }}>
          <strong className="num">
            {pr.value} {unit}
          </strong>
          <div className="faint">
            {pr.detail} · {formatDay(pr.date)}
          </div>
        </div>
      ) : (
        <span className="muted">–</span>
      )}
    </div>
  )
}

function StatRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="row" style={{ padding: '0.4rem 0' }}>
      <span className="grow muted">{label}</span>
      <strong className="num">{value}</strong>
    </div>
  )
}