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
import { useConfirm } from '../../components/DialogProvider'
import { t, locale } from '../../data/i18n'

function ranges() {
  return [
    { days: 30, label: t('body.range30') },
    { days: 90, label: t('body.range90') },
    { days: 365, label: t('body.range365') },
  ]
}

export function BodyScreen() {
  const entries = useLiveQuery(() => listMeasurements(), [])
  const [range, setRange] = useState(30)
  const confirm = useConfirm()

  const latest = entries?.[0]
  const change7 = entries ? weightChange(entries, 7) : null
  const change30 = entries ? weightChange(entries, 30) : null

  return (
    <div style={{ paddingBottom: '2rem' }}>
      <ScreenHeader
        title={t('body.title')}
        action={
          <Link
            to="/body/weight/log"
            className="btn btn-sm btn-primary"
            style={{ textDecoration: 'none' }}
          >
            <Plus size={16} /> {t('body.log')}
          </Link>
        }
      />

      {entries === undefined && <Empty>{t('common.loading')}</Empty>}

      {entries && entries.length === 0 && <Empty>{t('body.empty')}</Empty>}

      {latest && (
        <Card style={{ marginBottom: '1.5rem' }}>
          <div className="faint">{t('body.currentWeight')}</div>
          <div className="row" style={{ alignItems: 'baseline', gap: '0.35rem' }}>
            <span className="stat">{latest.weightKg}</span>
            <span className="stat-unit">kg</span>
            <span className="faint grow" style={{ textAlign: 'right' }}>
              {formatDay(latest.date)}
            </span>
          </div>

          {(change7 !== null || change30 !== null) && (
            <div className="row" style={{ gap: '1.25rem', marginTop: '1rem' }}>
              {change7 !== null && <ChangeStat label={t('body.days7')} kg={change7} />}
              {change30 !== null && <ChangeStat label={t('body.days30')} kg={change30} />}
            </div>
          )}

          {latest.heightCm && (
            <div className="faint" style={{ marginTop: '0.875rem' }}>
              {t('body.bmiLine', {
                bmi: bmi(latest.weightKg, latest.heightCm),
                height: latest.heightCm,
              })}
            </div>
          )}
        </Card>
      )}

      {entries && entries.length >= 2 && (
        <>
          <h3>{t('body.trend')}</h3>

          <div className="chip-row">
            {ranges().map((r) => (
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
                    formatter={(v, name) => [
                      `${v} kg`,
                      name === 'trend' ? t('body.chartTrend') : t('body.chartWeight'),
                    ]}
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
              {t('body.chartNote')}
            </p>
          </Card>
        </>
      )}

      {entries && entries.length > 0 && <h3>{t('body.history')}</h3>}

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
            aria-label={t('body.deleteAriaLabel', { date: formatDay(e.date) })}
            onClick={async () => {
              if (!e.id) return
              const ok = await confirm({
                title: t('body.deleteTitle'),
                message: t('body.deleteMessage', { date: formatDay(e.date) }),
                confirmLabel: t('common.delete'),
                destructive: true,
              })
              if (ok) await deleteMeasurement(e.id)
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
  return new Date(iso + 'T12:00:00').toLocaleDateString(locale(), {
    day: 'numeric',
    month: 'short',
  })
}