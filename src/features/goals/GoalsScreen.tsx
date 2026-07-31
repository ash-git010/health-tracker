import { useState, useEffect } from 'react'
import { NumberField } from '../../components/NumberField'
import { Button, Card, ScreenHeader } from '../../components/ui'
import { getGoals, saveGoals, macroGramsFromGoals } from '../../data/goals'

type NumOrEmpty = number | ''

export function GoalsScreen({ onSaved }: { onSaved?: () => void }) {
  const [calories, setCalories] = useState<NumOrEmpty>(2000)
  const [protein, setProtein] = useState<NumOrEmpty>(30)
  const [carbs, setCarbs] = useState<NumOrEmpty>(40)
  const [fat, setFat] = useState<NumOrEmpty>(30)
  const [minProtein, setMinProtein] = useState<NumOrEmpty>(120)
  const [loading, setLoading] = useState(true)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    getGoals().then((existing) => {
      if (existing) {
        setCalories(existing.dailyCalories)
        setProtein(existing.proteinPercent)
        setCarbs(existing.carbsPercent)
        setFat(existing.fatPercent)
        setMinProtein(existing.minProteinGrams)
      }
      setLoading(false)
    })
  }, [])

  const percentTotal = (protein || 0) + (carbs || 0) + (fat || 0)
  const percentsValid = percentTotal === 100
  const caloriesValid = typeof calories === 'number' && calories > 0
  const canSave = percentsValid && caloriesValid && typeof minProtein === 'number'

  const preview = canSave
    ? macroGramsFromGoals({
        id: 1,
        dailyCalories: calories as number,
        proteinPercent: protein as number,
        carbsPercent: carbs as number,
        fatPercent: fat as number,
        minProteinGrams: minProtein as number,
        updatedAt: '',
      })
    : null

  async function handleSave() {
    if (!canSave) return
    await saveGoals({
      dailyCalories: calories as number,
      proteinPercent: protein as number,
      carbsPercent: carbs as number,
      fatPercent: fat as number,
      minProteinGrams: minProtein as number,
    })
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
    onSaved?.()
  }

  if (loading) return <p className="muted">Loading…</p>

  return (
    <div className="stack">
      <ScreenHeader title="Daily goals" />

      <NumberField
        label="Daily calories"
        value={calories}
        onChange={setCalories}
        suffix="kcal"
        min={0}
      />

      <h3 style={{ marginTop: '1.25rem' }}>Macro split</h3>

      <NumberField label="Protein" value={protein} onChange={setProtein} suffix="%" min={0} max={100} />
      <NumberField label="Carbs" value={carbs} onChange={setCarbs} suffix="%" min={0} max={100} />
      <NumberField label="Fat" value={fat} onChange={setFat} suffix="%" min={0} max={100} />

      <p className={percentsValid ? 'muted' : 'warn'}>
        Total: {percentTotal}%
        {!percentsValid && ' — must add up to 100'}
      </p>

      <NumberField
        label="Minimum protein per day"
        value={minProtein}
        onChange={setMinProtein}
        suffix="g"
        min={0}
      />

      {preview && (
        <Card>
          <div className="field-label">That works out to</div>
          <div>
            {preview.protein}g protein · {preview.carbs}g carbs · {preview.fat}g fat
          </div>
        </Card>
      )}

      <Button variant="primary" block onClick={handleSave} disabled={!canSave}>
        {saved ? 'Saved' : 'Save goals'}
      </Button>
    </div>
  )
}