import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useLiveQuery } from 'dexie-react-hooks'
import { LineChart, Line, XAxis, YAxis, ResponsiveContainer, Tooltip } from 'recharts'
import { Plus, X, TrendingDown, TrendingUp, Minus } from 'lucide-react'
import {
  listMeasurements,
  deleteMeasurement,
  bmi,
  weightChange,
  toChartPoints,
} from '../../data/measurements'
import { formatDay } from '../../data/dates'
import { Card, Empty, ScreenHeader } from '../../components/ui'

const RANGES = [
  { days: 30, label: '30d' },
  { days: 90, label: '90d' },
  { days: 365, label: '1y' },
]

export function BodyScreen() {
  const entries = useLiveQuery(() => listMeasurements(), [])
  const [range, setRange] = useState(30)

  const latest = entries?.[0]
  const change7 = entries ? weightChange(entries, 7) : null
  const change30 = entries ? weightChange(entries, 30) : null

  return (
    <div style={{ paddingBottom: '2rem' }}>
      <ScreenHeader
        title="Weight"
        action={
          <Link
            to="/body/weight/log"
            className="btn btn-sm btn-primary"
            style={{ textDecoration: 'none' }}
          >
            <Plus size={16} /> Log
          </Link>
        }
      />

      {entries === undefined && <Empty>Loading…</Empty>}

      {entries && entries.length === 0 && (
        <Empty>No measurements yet. Tap Log to record your first weigh-in.</Empty>
      )}

      {latest && (
        <Card style={{ marginBottom: '1.5rem' }}>
          <div className="faint">Current weight</div>
          <div className="row" style={{ alignItems: 'baseline', gap: '0.35rem' }}>
            <span className="stat">{latest.weightKg}</span>
            <span className="stat-unit">kg</span>
            <span className="faint grow" style={{ textAlign: 'right' }}>
              {formatDay(latest.date)}
            </span>
          </div>

          {(change7 !== null || change30 !== null) && (
            <div className="row" style={{ gap: '1.25rem', marginTop: '1rem' }}>
              {change7 !== null && <ChangeStat label="7 days" kg={change7} />}
              {change30 !== null && <ChangeStat label="30 days" kg={change30} />}
            </div>
          )}

          {latest.heightCm && (
            <div className="faint" style={{ marginTop: '0.875rem' }}>
              BMI {bmi(latest.weightKg, latest.heightCm)} · {latest.heightCm}cm
            </div>
          )}
        </Card>
      )}

      {entries && entries.length >= 2 && (
        <>
          <h3>Trend</h3>

          <div className="chip-row">
            {RANGES.map((r) => (
              <button
                key={r.days}
                onClick={() => setRange(r.days)}
                className={`chip${range === r.days ? ' active' : ''}`}
              >
                {r.label}
              </button>
            ))}
          </div>

          <Card style={{ marginBottom: '1.75rem' }}>
            <div style={{ height: 200 }}>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart
                  data={toChartPoints(entries, range)}
                  margin={{ top: 8, right: 8, left: -20, bottom: 0 }}
                >
                  <XAxis
                    dataKey="date"
                    tickFormatter={(d) => shortDate(d)}
                    tick={{ fontSize: 11, fill: 'var(--text-faint)' }}
                    axisLine={false}
                    tickLine={false}
                    minTickGap={30}
                  />
                  <YAxis
                    domain={['dataMin - 1', 'dataMax + 1']}
                    tick={{ fontSize: 11, fill: 'var(--text-faint)' }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <Tooltip
                    formatter={(v, name) => [`${v} kg`, name === 'trend' ? 'Trend' : 'Weight']}
                    contentStyle={{
                      background: 'var(--bg-elevated)',
                      border: '1px solid var(--border-strong)',
                      borderRadius: '10px',
                    }}
                  />
                  <Line
                    type="monotone"
                    dataKey="weightKg"
                    stroke="var(--text-faint)"
                    strokeWidth={1}
                    dot={{ r: 2 }}
                  />
                  <Line
                    type="monotone"
                    dataKey="trend"
                    stroke="var(--accent)"
                    strokeWidth={2.5}
                    dot={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
            <p className="faint" style={{ margin: '0.75rem 0 0', textAlign: 'center' }}>
              Thin line: each weigh-in · Thick line: 7-entry average
            </p>
          </Card>
        </>
      )}

      {entries && entries.length > 0 && <h3>History</h3>}

      {(entries ?? []).map((e) => (
        <div key={e.id} className="list-item">
          <div className="grow">
            <span className="num" style={{ fontWeight: 600 }}>
              {e.weightKg} kg
            </span>
            {e.heightCm && <span className="faint"> · {e.heightCm}cm</span>}
          </div>
          <span className="faint">{formatDay(e.date)}</span>
          <button
            className="icon-btn"
            aria-label={`Delete entry from ${formatDay(e.date)}`}
            onClick={() => {
              if (e.id && confirm(`Delete the entry from ${formatDay(e.date)}?`)) {
                deleteMeasurement(e.id)
              }
            }}
          >
            <X size={16} />
          </button>
        </div>
      ))}
    </div>
  )
}

function ChangeStat({ label, kg }: { label: string; kg: number }) {
  const Icon = kg === 0 ? Minus : kg > 0 ? TrendingUp : TrendingDown
  const colour = kg === 0 ? 'var(--text-muted)' : 'var(--text)'

  return (
    <div>
      <div className="faint">{label}</div>
      <div className="row" style={{ gap: '0.3rem', color: colour }}>
        <Icon size={15} />
        <span className="num" style={{ fontWeight: 600 }}>
          {kg === 0 ? '—' : `${kg > 0 ? '+' : ''}${kg} kg`}
        </span>
      </div>
    </div>
  )
}

function shortDate(iso: string): string {
  return new Date(iso + 'T12:00:00').toLocaleDateString(undefined, {
    day: 'numeric',
    month: 'short',
  })
}