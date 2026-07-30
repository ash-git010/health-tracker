import { useState, useEffect } from 'react'
import { NumberField } from '../../components/NumberField'
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

  if (loading) return <p>Loading…</p>

  return (
    <div style={{ maxWidth: '480px', margin: '0 auto', padding: '1rem' }}>
      <h2>Daily goals</h2>

      <NumberField
        label="Daily calories"
        value={calories}
        onChange={setCalories}
        suffix="kcal"
        min={0}
      />

      <h3 style={{ fontSize: '1rem', marginTop: '1.5rem' }}>Macro split</h3>

      <NumberField label="Protein" value={protein} onChange={setProtein} suffix="%" min={0} max={100} />
      <NumberField label="Carbs" value={carbs} onChange={setCarbs} suffix="%" min={0} max={100} />
      <NumberField label="Fat" value={fat} onChange={setFat} suffix="%" min={0} max={100} />

      <p style={{ color: percentsValid ? 'inherit' : '#c0392b', fontSize: '0.9rem' }}>
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
        <div style={{ marginTop: '1.5rem', padding: '0.75rem', border: '1px solid var(--border)', borderRadius: '8px' }}>
          <strong style={{ fontSize: '0.9rem' }}>That works out to</strong>
          <p style={{ margin: '0.5rem 0 0', fontSize: '0.9rem' }}>
            {preview.protein}g protein · {preview.carbs}g carbs · {preview.fat}g fat
          </p>
        </div>
      )}

      <button
        onClick={handleSave}
        disabled={!canSave}
        style={{
          marginTop: '1.5rem',
          width: '100%',
          padding: '0.9rem',
          fontSize: '1rem',
          cursor: canSave ? 'pointer' : 'not-allowed',
          opacity: canSave ? 1 : 0.5,
        }}
      >
        {saved ? 'Saved' : 'Save goals'}
      </button>
    </div>
  )
}