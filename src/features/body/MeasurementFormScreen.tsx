import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useLiveQuery } from 'dexie-react-hooks'
import { listMeasurements, saveMeasurement } from '../../data/measurements'
import { todayISO } from '../../data/dates'
import { NumberField } from '../../components/NumberField'
import { Button, ScreenHeader } from '../../components/ui'

type NumOrEmpty = number | ''

export function MeasurementFormScreen() {
  const navigate = useNavigate()
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
    navigate('/body/weight')
  }

  return (
    <div className="stack">
      <ScreenHeader
        title="Log weight"
        action={
          <Button size="sm" onClick={() => navigate('/body/weight')}>
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