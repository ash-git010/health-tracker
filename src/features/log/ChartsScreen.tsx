import { useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
} from 'recharts'
import { getDailyTotals, getEntriesForDate, sumEntries } from '../../data/log'
import { getGoals, macroGramsFromGoals } from '../../data/goals'
import { lastNDays, shortDay, todayISO } from '../../data/dates'
import { Card, Empty, ScreenHeader } from '../../components/ui'

const MACRO_COLOURS = ['#6fae95', '#c9a227', '#c97b4a']

export function ChartsScreen() {
  const [range, setRange] = useState(7)

  const goals = useLiveQuery(() => getGoals(), [])
  const days = lastNDays(range)
  const totals = useLiveQuery(() => getDailyTotals(days), [range])
  const todayEntries = useLiveQuery(() => getEntriesForDate(todayISO()), [])

  if (!totals || !goals) return <Empty>Loading…</Empty>

  const loggedDays = totals.filter((d) => d.logged)
  const targets = macroGramsFromGoals(goals)

  const todaySums = sumEntries(todayEntries ?? [])
  const macroData = [
    { name: 'Protein', value: Math.round(todaySums.protein * 4) },
    { name: 'Carbs', value: Math.round(todaySums.carbs * 4) },
    { name: 'Fat', value: Math.round(todaySums.fat * 9) },
  ].filter((d) => d.value > 0)

  const avgKcal =
    loggedDays.length > 0
      ? Math.round(loggedDays.reduce((a, d) => a + d.kcal, 0) / loggedDays.length)
      : 0

  const avgProtein =
    loggedDays.length > 0
      ? Math.round(loggedDays.reduce((a, d) => a + d.protein, 0) / loggedDays.length)
      : 0

  const proteinDaysMet = loggedDays.filter((d) => d.protein >= goals.minProteinGrams).length

  return (
    <div>
      <ScreenHeader title="Charts" />

      <div className="row" style={{ marginBottom: '1rem' }}>
        {[7, 14, 30].map((n) => (
          <button
            key={n}
            onClick={() => setRange(n)}
            className={`btn btn-sm${range === n ? ' btn-primary' : ''}`}
          >
            {n} days
          </button>
        ))}
      </div>

      <h3>Today's macros</h3>
      {macroData.length === 0 ? (
        <Card style={{ marginBottom: '1.25rem' }}>
          <p className="muted" style={{ margin: 0 }}>
            Nothing logged today yet.
          </p>
        </Card>
      ) : (
        <Card style={{ marginBottom: '1.25rem' }}>
          <div style={{ height: 200 }}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={macroData}
                  dataKey="value"
                  nameKey="name"
                  innerRadius={50}
                  outerRadius={80}
                  paddingAngle={2}
                >
                  {macroData.map((_, i) => (
                    <Cell key={i} fill={MACRO_COLOURS[i]} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(v) => `${v} kcal`}
                  contentStyle={{
                    background: 'var(--surface)',
                    border: '1px solid var(--border)',
                    borderRadius: '8px',
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="row" style={{ justifyContent: 'center', gap: '1rem' }}>
            {macroData.map((d, i) => (
              <span key={d.name} className="muted">
                <span
                  style={{
                    display: 'inline-block',
                    width: 10,
                    height: 10,
                    borderRadius: 2,
                    background: MACRO_COLOURS[i],
                    marginRight: 4,
                  }}
                />
                {d.name}
              </span>
            ))}
          </div>
        </Card>
      )}

      <h3>Calories</h3>
      <Card style={{ marginBottom: '1.25rem' }}>
        <div style={{ height: 200 }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={totals} margin={{ top: 8, right: 4, left: -20, bottom: 0 }}>
              <XAxis
                dataKey="date"
                tickFormatter={shortDay}
                tick={{ fontSize: 11, fill: 'var(--text-muted)' }}
                axisLine={false}
                tickLine={false}
                interval={range > 14 ? 4 : 0}
              />
              <YAxis
                tick={{ fontSize: 11, fill: 'var(--text-muted)' }}
                axisLine={false}
                tickLine={false}
              />
              <ReferenceLine
                y={goals.dailyCalories}
                stroke="var(--text-muted)"
                strokeDasharray="4 4"
              />
              <Tooltip
                formatter={(v) => `${v} kcal`}
                labelFormatter={(d) => `${d}`}
                contentStyle={{
                  background: 'var(--surface)',
                  border: '1px solid var(--border)',
                  borderRadius: '8px',
                }}
              />
              <Bar dataKey="kcal" fill="var(--accent)" radius={[3, 3, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <p className="muted" style={{ margin: '0.5rem 0 0', textAlign: 'center' }}>
          Dashed line: your {goals.dailyCalories} kcal target
        </p>
      </Card>

      <h3>Protein</h3>
      <Card style={{ marginBottom: '1.25rem' }}>
        <div style={{ height: 180 }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={totals} margin={{ top: 8, right: 4, left: -20, bottom: 0 }}>
              <XAxis
                dataKey="date"
                tickFormatter={shortDay}
                tick={{ fontSize: 11, fill: 'var(--text-muted)' }}
                axisLine={false}
                tickLine={false}
                interval={range > 14 ? 4 : 0}
              />
              <YAxis
                tick={{ fontSize: 11, fill: 'var(--text-muted)' }}
                axisLine={false}
                tickLine={false}
              />
              <ReferenceLine
                y={goals.minProteinGrams}
                stroke="var(--warn)"
                strokeDasharray="4 4"
              />
              <Tooltip
                formatter={(v) => `${v} g`}
                contentStyle={{
                  background: 'var(--surface)',
                  border: '1px solid var(--border)',
                  borderRadius: '8px',
                }}
              />
              <Bar dataKey="protein" fill="var(--accent)" radius={[3, 3, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <p className="muted" style={{ margin: '0.5rem 0 0', textAlign: 'center' }}>
          Dashed line: your {goals.minProteinGrams}g minimum
        </p>
      </Card>

      <h3>Summary</h3>
      <Card>
        {loggedDays.length === 0 ? (
          <p className="muted" style={{ margin: 0 }}>
            Nothing logged in this period.
          </p>
        ) : (
          <>
            <SummaryRow
              label="Days logged"
              value={`${loggedDays.length} of ${range}`}
            />
            <SummaryRow
              label="Average calories"
              value={`${avgKcal} kcal`}
              note={`target ${goals.dailyCalories}`}
            />
            <SummaryRow
              label="Average protein"
              value={`${avgProtein} g`}
              note={`target ${targets.protein}`}
            />
            <SummaryRow
              label="Protein minimum hit"
              value={`${proteinDaysMet} of ${loggedDays.length} days`}
            />
          </>
        )}
      </Card>
    </div>
  )
}

function SummaryRow({
  label,
  value,
  note,
}: {
  label: string
  value: string
  note?: string
}) {
  return (
    <div className="row" style={{ padding: '0.35rem 0' }}>
      <span className="grow">{label}</span>
      <strong>{value}</strong>
      {note && <span className="muted">({note})</span>}
    </div>
  )
}