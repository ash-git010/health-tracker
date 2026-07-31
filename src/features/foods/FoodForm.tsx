import { useState } from 'react'
import { TextField } from '../../components/TextField'
import { NumberField } from '../../components/NumberField'
import { Button, ScreenHeader } from '../../components/ui'
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
    typeof kcal === 'number' && kcal > 0 ? Math.abs(derivedKcal - kcal) / kcal : 0
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
    <div className="stack">
      <ScreenHeader title={existing ? 'Edit food' : 'New food'} />

      <TextField label="Name" value={name} onChange={setName} placeholder="Oats" />
      <TextField label="Brand (optional)" value={brand} onChange={setBrand} />

      <label className="field">
        <span className="field-label">Measured in</span>
        <select value={unit} onChange={(e) => setUnit(e.target.value as Unit)}>
          <option value="g">Grams (solids)</option>
          <option value="ml">Millilitres (liquids)</option>
        </select>
      </label>

      <h3 style={{ marginTop: '1.25rem' }}>Values per 100{unit}</h3>

      <NumberField label="Calories" value={kcal} onChange={setKcal} suffix="kcal" min={0} />
      <NumberField label="Protein" value={protein} onChange={setProtein} suffix="g" min={0} />
      <NumberField label="Carbs" value={carbs} onChange={setCarbs} suffix="g" min={0} />
      <NumberField label="Fat" value={fat} onChange={setFat} suffix="g" min={0} />
      <NumberField label="Fibre (optional)" value={fiber} onChange={setFiber} suffix="g" min={0} />
      <NumberField label="Sugar (optional)" value={sugar} onChange={setSugar} suffix="g" min={0} />

      {showKcalWarning && (
        <p className="warn">
          Heads up: the macros work out to about {Math.round(derivedKcal)} kcal, but you
          entered {kcal}. Worth double-checking — though high-fibre foods do differ
          legitimately.
        </p>
      )}

      <div className="row" style={{ marginTop: '1.25rem' }}>
        <Button onClick={onCancel}>Cancel</Button>
        <span className="grow">
          <Button variant="primary" block onClick={handleSave} disabled={!canSave || saving}>
            {existing ? 'Save changes' : 'Add food'}
          </Button>
        </span>
      </div>
    </div>
  )
}