import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useLiveQuery } from 'dexie-react-hooks'
import { LineChart, Line, XAxis, YAxis, ResponsiveContainer, Tooltip } from 'recharts'
import {
  listMeasurements,
  deleteMeasurement,
  bmi,
  weightChange,
  toChartPoints,
} from '../../data/measurements'
import { formatDay } from '../../data/dates'
import { Button, Card, Empty, ScreenHeader } from '../../components/ui'

export function BodyScreen() {
  const entries = useLiveQuery(() => listMeasurements(), [])
  const [range, setRange] = useState(30)

  const latest = entries?.[0]
  const change7 = entries ? weightChange(entries, 7) : null
  const change30 = entries ? weightChange(entries, 30) : null

  return (
    <div>
      <ScreenHeader
        title="Body"
        action={
          <Link
            to="/body/weight/log"
            className="btn btn-sm btn-primary"
            style={{ textDecoration: 'none' }}
          >
            Log weight
          </Link>
        }
      />

      {entries === undefined && <Empty>Loading…</Empty>}

      {entries && entries.length === 0 && (
        <Empty>No measurements yet. Tap Log weight to start.</Empty>
      )}

      {latest && (
        <Card style={{ marginBottom: '1.25rem' }}>
          <div className="row" style={{ alignItems: 'baseline' }}>
            <strong style={{ fontSize: '1.6rem' }}>{latest.weightKg}</strong>
            <span className="muted">kg</span>
            <span className="muted grow" style={{ textAlign: 'right' }}>
              {formatDay(latest.date)}
            </span>
          </div>

          {latest.heightCm && (
            <div className="muted" style={{ marginTop: '0.25rem' }}>
              BMI {bmi(latest.weightKg, latest.heightCm)} · {latest.heightCm}cm
            </div>
          )}

          {(change7 !== null || change30 !== null) && (
            <div className="muted" style={{ marginTop: '0.5rem' }}>
              {change7 !== null && <>7 days: {formatChange(change7)}</>}
              {change7 !== null && change30 !== null && ' · '}
              {change30 !== null && <>30 days: {formatChange(change30)}</>}
            </div>
          )}
        </Card>
      )}

      {entries && entries.length >= 2 && (
        <>
          <div className="row" style={{ marginBottom: '0.5rem' }}>
            <h3 className="grow" style={{ margin: 0 }}>
              Trend
            </h3>
            {[30, 90, 365].map((n) => (
              <button
                key={n}
                onClick={() => setRange(n)}
                className={`btn btn-sm${range === n ? ' btn-primary' : ''}`}
              >
                {n === 365 ? '1y' : `${n}d`}
              </button>
            ))}
          </div>

          <Card style={{ marginBottom: '1.25rem' }}>
            <div style={{ height: 200 }}>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart
                  data={toChartPoints(entries, range)}
                  margin={{ top: 8, right: 8, left: -20, bottom: 0 }}
                >
                  <XAxis
                    dataKey="date"
                    tickFormatter={(d) => shortDate(d)}
                    tick={{ fontSize: 11, fill: 'var(--text-muted)' }}
                    axisLine={false}
                    tickLine={false}
                    minTickGap={30}
                  />
                  <YAxis
                    domain={['dataMin - 1', 'dataMax + 1']}
                    tick={{ fontSize: 11, fill: 'var(--text-muted)' }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <Tooltip
                    formatter={(v, name) => [`${v} kg`, name === 'trend' ? 'Trend' : 'Weight']}
                    contentStyle={{
                      background: 'var(--surface)',
                      border: '1px solid var(--border)',
                      borderRadius: '8px',
                    }}
                  />
                  <Line
                    type="monotone"
                    dataKey="weightKg"
                    stroke="var(--text-muted)"
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
            <p className="muted" style={{ margin: '0.5rem 0 0', textAlign: 'center' }}>
              Thin line: each weigh-in · Thick line: 7-entry average
            </p>
          </Card>
        </>
      )}

      {entries && entries.length > 0 && <h3>History</h3>}

      {(entries ?? []).map((e) => (
        <div key={e.id} className="list-item">
          <div className="grow">
            <strong>{e.weightKg} kg</strong>
            {e.heightCm && <span className="muted"> · {e.heightCm}cm</span>}
          </div>
          <span className="muted">{formatDay(e.date)}</span>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => {
              if (e.id && confirm(`Delete the entry from ${formatDay(e.date)}?`)) {
                deleteMeasurement(e.id)
              }
            }}
          >
            ×
          </Button>
        </div>
      ))}
    </div>
  )
}

function formatChange(kg: number): string {
  if (kg === 0) return 'no change'
  return kg > 0 ? `+${kg} kg` : `${kg} kg`
}

function shortDate(iso: string): string {
  return new Date(iso + 'T12:00:00').toLocaleDateString(undefined, {
    day: 'numeric',
    month: 'short',
  })
}