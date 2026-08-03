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

const MACRO_COLOURS = ['#7c5cff', '#5b9bd5', '#c9a227']

const RANGES = [7, 14, 30]

const TOOLTIP_STYLE = {
  background: 'var(--bg-elevated)',
  border: '1px solid var(--border-strong)',
  borderRadius: '10px',
}

const AXIS_TICK = { fontSize: 11, fill: 'var(--text-faint)' }

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
    {
      name: 'Protein',
      value: Math.round(todaySums.protein * 4),
      grams: Math.round(todaySums.protein),
    },
    {
      name: 'Carbs',
      value: Math.round(todaySums.carbs * 4),
      grams: Math.round(todaySums.carbs),
    },
    {
      name: 'Fat',
      value: Math.round(todaySums.fat * 9),
      grams: Math.round(todaySums.fat),
    },
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
    <div style={{ paddingBottom: '2rem' }}>
      <ScreenHeader title="Charts" />

      <div className="chip-row">
        {RANGES.map((n) => (
          <button
            key={n}
            onClick={() => setRange(n)}
            className={`chip${range === n ? ' active' : ''}`}
          >
            {n} days
          </button>
        ))}
      </div>

      <h3>Today's macros</h3>
      <Card style={{ marginBottom: '1.75rem' }}>
        {macroData.length === 0 ? (
          <p className="muted" style={{ margin: 0 }}>
            Nothing logged today yet.
          </p>
        ) : (
          <>
            <div style={{ height: 190 }}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={macroData}
                    dataKey="value"
                    nameKey="name"
                    innerRadius={52}
                    outerRadius={82}
                    paddingAngle={3}
                    stroke="none"
                  >
                    {macroData.map((_, i) => (
                      <Cell key={i} fill={MACRO_COLOURS[i]} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(v, _name, item) => `${item.payload.grams}g · ${v} kcal`}
                    contentStyle={TOOLTIP_STYLE}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>

            <div
              className="row"
              style={{ justifyContent: 'center', gap: '1.25rem', marginTop: '0.5rem' }}
            >
              {macroData.map((d, i) => (
                <div key={d.name} style={{ textAlign: 'center' }}>
                  <div className="row" style={{ gap: '0.35rem', justifyContent: 'center' }}>
                    <span
                      style={{
                        display: 'inline-block',
                        width: 8,
                        height: 8,
                        borderRadius: 2,
                        background: MACRO_COLOURS[i],
                      }}
                    />
                    <span className="faint">{d.name}</span>
                  </div>
                  <div className="num" style={{ fontWeight: 600, marginTop: '0.15rem' }}>
                    {d.grams}g
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </Card>

      <h3>Calories</h3>
      <Card style={{ marginBottom: '1.75rem' }}>
        <div className="faint">Average</div>
        <div className="row" style={{ alignItems: 'baseline', gap: '0.3rem', marginBottom: '0.75rem' }}>
          <span className="stat-sm">{avgKcal}</span>
          <span className="stat-unit">/ {goals.dailyCalories} kcal</span>
        </div>

        <div style={{ height: 190 }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={totals} margin={{ top: 8, right: 4, left: -20, bottom: 0 }}>
              <XAxis
                dataKey="date"
                tickFormatter={shortDay}
                tick={AXIS_TICK}
                axisLine={false}
                tickLine={false}
                interval={range > 14 ? 4 : 0}
              />
              <YAxis tick={AXIS_TICK} axisLine={false} tickLine={false} />
              <ReferenceLine
                y={goals.dailyCalories}
                stroke="var(--text-faint)"
                strokeDasharray="4 4"
              />
              <Tooltip
                formatter={(v) => `${v} kcal`}
                labelFormatter={(d) => `${d}`}
                contentStyle={TOOLTIP_STYLE}
                cursor={{ fill: 'var(--surface-2)' }}
              />
              <Bar dataKey="kcal" fill="var(--accent)" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <p className="faint" style={{ margin: '0.5rem 0 0', textAlign: 'center' }}>
          Dashed line: your {goals.dailyCalories} kcal target
        </p>
      </Card>

      <h3>Protein</h3>
      <Card style={{ marginBottom: '1.75rem' }}>
        <div className="faint">Average</div>
        <div className="row" style={{ alignItems: 'baseline', gap: '0.3rem', marginBottom: '0.75rem' }}>
          <span className="stat-sm">{avgProtein}</span>
          <span className="stat-unit">/ {targets.protein} g</span>
        </div>

        <div style={{ height: 170 }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={totals} margin={{ top: 8, right: 4, left: -20, bottom: 0 }}>
              <XAxis
                dataKey="date"
                tickFormatter={shortDay}
                tick={AXIS_TICK}
                axisLine={false}
                tickLine={false}
                interval={range > 14 ? 4 : 0}
              />
              <YAxis tick={AXIS_TICK} axisLine={false} tickLine={false} />
              <ReferenceLine
                y={goals.minProteinGrams}
                stroke="var(--warn)"
                strokeDasharray="4 4"
              />
              <Tooltip
                formatter={(v) => `${v} g`}
                contentStyle={TOOLTIP_STYLE}
                cursor={{ fill: 'var(--surface-2)' }}
              />
              <Bar dataKey="protein" fill="var(--accent)" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <p className="faint" style={{ margin: '0.5rem 0 0', textAlign: 'center' }}>
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
            <SummaryRow label="Days logged" value={`${loggedDays.length} of ${range}`} />
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
    <div className="row" style={{ padding: '0.45rem 0' }}>
      <span className="grow muted">{label}</span>
      <div style={{ textAlign: 'right' }}>
        <strong className="num">{value}</strong>
        {note && <div className="faint">{note}</div>}
      </div>
    </div>
  )
}