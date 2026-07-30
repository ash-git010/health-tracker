import { useState } from 'react'
import { TextField } from '../../components/TextField'
import { NumberField } from '../../components/NumberField'
import { addFood, updateFood, type FoodInput } from '../../data/foods'
import type { Food, Unit } from '../../data/types'

type NumOrEmpty = number | ''

interface Props {
  existing?: Food
  initial?: Partial<FoodInput>
  onDone: () => void
  onCancel: () => void
}

export function FoodForm({ existing, initial, onDone, onCancel }: Props) {
  const seed = existing ?? initial ?? {}

  const [name, setName] = useState(seed.name ?? '')
  const [brand, setBrand] = useState(seed.brand ?? '')
  const [unit, setUnit] = useState<Unit>(seed.unit ?? 'g')
  const [kcal, setKcal] = useState<NumOrEmpty>(seed.kcal ?? '')
  const [protein, setProtein] = useState<NumOrEmpty>(seed.protein ?? '')
  const [carbs, setCarbs] = useState<NumOrEmpty>(seed.carbs ?? '')
  const [fat, setFat] = useState<NumOrEmpty>(seed.fat ?? '')
  const [fiber, setFiber] = useState<NumOrEmpty>(seed.fiber ?? '')
  const [sugar, setSugar] = useState<NumOrEmpty>(seed.sugar ?? '')
  const [saving, setSaving] = useState(false)

  const num = (v: NumOrEmpty) => (typeof v === 'number' ? v : 0)

  const canSave =
    name.trim().length > 0 &&
    typeof kcal === 'number' &&
    typeof protein === 'number' &&
    typeof carbs === 'number' &&
    typeof fat === 'number'

  const derivedKcal = num(protein) * 4 + num(carbs) * 4 + num(fat) * 9
  const kcalGap =
    typeof kcal === 'number' && kcal > 0
      ? Math.abs(derivedKcal - kcal) / kcal
      : 0
  const showKcalWarning = kcalGap > 0.15

  async function handleSave() {
    if (!canSave || saving) return
    setSaving(true)

    const payload: FoodInput = {
      name: name.trim(),
      brand: brand.trim() || undefined,
      unit,
      kcal: num(kcal),
      protein: num(protein),
      carbs: num(carbs),
      fat: num(fat),
      fiber: typeof fiber === 'number' ? fiber : undefined,
      sugar: typeof sugar === 'number' ? sugar : undefined,
    }

    if (existing?.id) {
      await updateFood(existing.id, payload)
    } else {
      await addFood(payload)
    }

    setSaving(false)
    onDone()
  }

  return (
    <div>
      <h2 style={{ fontSize: '1.1rem' }}>
        {existing ? 'Edit food' : 'New food'}
      </h2>

      <TextField label="Name" value={name} onChange={setName} placeholder="Oats" />
      <TextField label="Brand (optional)" value={brand} onChange={setBrand} />

      <label style={{ display: 'block', marginBottom: '1rem' }}>
        <span style={{ display: 'block', marginBottom: '0.25rem', fontSize: '0.9rem' }}>
          Measured in
        </span>
        <select
          value={unit}
          onChange={(e) => setUnit(e.target.value as Unit)}
          style={{ width: '100%', padding: '0.6rem', fontSize: '1rem' }}
        >
          <option value="g">Grams (solids)</option>
          <option value="ml">Millilitres (liquids)</option>
        </select>
      </label>

      <p style={{ fontSize: '0.85rem', opacity: 0.7, marginTop: '1.5rem' }}>
        Values per 100{unit}
      </p>

      <NumberField label="Calories" value={kcal} onChange={setKcal} suffix="kcal" min={0} />
      <NumberField label="Protein" value={protein} onChange={setProtein} suffix="g" min={0} />
      <NumberField label="Carbs" value={carbs} onChange={setCarbs} suffix="g" min={0} />
      <NumberField label="Fat" value={fat} onChange={setFat} suffix="g" min={0} />
      <NumberField label="Fibre (optional)" value={fiber} onChange={setFiber} suffix="g" min={0} />
      <NumberField label="Sugar (optional)" value={sugar} onChange={setSugar} suffix="g" min={0} />

      {showKcalWarning && (
        <p style={{ fontSize: '0.85rem', color: 'var(--warn)' }}>
          Heads up: the macros work out to about {Math.round(derivedKcal)} kcal, but you
          entered {kcal}. Worth double-checking — though high-fibre foods do differ legitimately.
        </p>
      )}

      <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1.5rem' }}>
        <button onClick={onCancel} style={{ flex: 1, padding: '0.9rem' }}>
          Cancel
        </button>
        <button
          onClick={handleSave}
          disabled={!canSave || saving}
          style={{
            flex: 2,
            padding: '0.9rem',
            opacity: canSave && !saving ? 1 : 0.5,
          }}
        >
          {existing ? 'Save changes' : 'Add food'}
        </button>
      </div>
    </div>
  )
}