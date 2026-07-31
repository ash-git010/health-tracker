import { useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import {
  listMeasurements,
  saveMeasurement,
  deleteMeasurement,
  bmi,
  weightChange,
} from '../../data/measurements'
import { todayISO, formatDay } from '../../data/dates'
import { NumberField } from '../../components/NumberField'
import { Button, Card, Empty, ScreenHeader } from '../../components/ui'

type NumOrEmpty = number | ''

export function BodyScreen() {
  const entries = useLiveQuery(() => listMeasurements(), [])
  const [adding, setAdding] = useState(false)

  const latest = entries?.[0]
  const change7 = entries ? weightChange(entries, 7) : null
  const change30 = entries ? weightChange(entries, 30) : null

  if (adding) {
    return <MeasurementForm onDone={() => setAdding(false)} onCancel={() => setAdding(false)} />
  }

  return (
    <div>
      <ScreenHeader
        title="Body"
        action={
          <Button size="sm" variant="primary" onClick={() => setAdding(true)}>
            Log weight
          </Button>
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

function MeasurementForm({ onDone, onCancel }: { onDone: () => void; onCancel: () => void }) {
  const [date, setDate] = useState(todayISO())
  const [weight, setWeight] = useState<NumOrEmpty>('')
  const [height, setHeight] = useState<NumOrEmpty>('')
  const [saving, setSaving] = useState(false)

  const existing = useLiveQuery(async () => {
    const all = await listMeasurements()
    return all.find((e) => e.date === date)
  }, [date])

  const canSave = typeof weight === 'number' && weight > 0 && !saving

  async function handleSave() {
    if (!canSave) return
    setSaving(true)
    await saveMeasurement({
      date,
      weightKg: weight as number,
      heightCm: typeof height === 'number' && height > 0 ? height : undefined,
    })
    setSaving(false)
    onDone()
  }

  return (
    <div className="stack">
      <ScreenHeader
        title="Log weight"
        action={
          <Button size="sm" onClick={onCancel}>
            Cancel
          </Button>
        }
      />

      <label className="field">
        <span className="field-label">Date</span>
        <input
          type="date"
          value={date}
          max={todayISO()}
          onChange={(e) => setDate(e.target.value)}
        />
      </label>

      {existing && (
        <p className="muted">
          There's already an entry for this date ({existing.weightKg} kg). Saving will
          replace it.
        </p>
      )}

      <NumberField label="Weight" value={weight} onChange={setWeight} suffix="kg" min={0} />
      <NumberField
        label="Height (optional)"
        value={height}
        onChange={setHeight}
        suffix="cm"
        min={0}
      />

      <Button variant="primary" block onClick={handleSave} disabled={!canSave}>
        Save
      </Button>
    </div>
  )
}