import { useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { listFoods, macrosForAmount } from '../../data/foods'
import { logFood, MEALS, type Meal } from '../../data/log'
import { Button, Card, Empty, ScreenHeader } from '../../components/ui'
import type { Food } from '../../data/types'

interface Props {
  date: string
  defaultMeal: Meal
  onDone: () => void
  onCancel: () => void
}

export function AddEntry({ date, defaultMeal, onDone, onCancel }: Props) {
  const foods = useLiveQuery(() => listFoods(), [])
  const [search, setSearch] = useState('')
  const [selected, setSelected] = useState<Food | null>(null)
  const [amount, setAmount] = useState<number | ''>('')
  const [meal, setMeal] = useState<Meal>(defaultMeal)

  const filtered = (foods ?? []).filter((f) =>
    f.name.toLowerCase().includes(search.toLowerCase())
  )

  const preview =
    selected && typeof amount === 'number' && amount > 0
      ? macrosForAmount(selected, amount)
      : null

  async function handleAdd() {
    if (!selected || typeof amount !== 'number' || amount <= 0) return
    await logFood(selected, amount, meal, date)
    onDone()
  }

  if (!selected) {
    return (
      <div>
        <ScreenHeader
          title="Pick a food"
          action={
            <Button size="sm" onClick={onCancel}>
              Cancel
            </Button>
          }
        />

        <input
          type="text"
          value={search}
          placeholder="Search…"
          onChange={(e) => setSearch(e.target.value)}
          autoFocus
          style={{ marginBottom: '0.75rem' }}
        />

        {filtered.length === 0 && <Empty>No foods found. Add some in the Foods tab.</Empty>}

        {filtered.map((food) => (
          <button
            key={food.id}
            className="btn btn-block"
            onClick={() => setSelected(food)}
            style={{
              justifyContent: 'flex-start',
              textAlign: 'left',
              marginBottom: '0.5rem',
              padding: '0.75rem',
              display: 'block',
            }}
          >
            <strong>{food.name}</strong>
            <span className="muted" style={{ display: 'block', fontWeight: 400 }}>
              {food.kcal} kcal per 100{food.unit}
            </span>
          </button>
        ))}
      </div>
    )
  }

  return (
    <div>
      <ScreenHeader
        title={selected.name}
        action={
          <Button size="sm" onClick={() => setSelected(null)}>
            Back
          </Button>
        }
      />

      <label className="field">
        <span className="field-label">Amount</span>
        <span className="row">
          <input
            type="number"
            inputMode="decimal"
            value={amount}
            autoFocus
            onChange={(e) => setAmount(e.target.value === '' ? '' : Number(e.target.value))}
          />
          <span className="muted" style={{ minWidth: '2rem' }}>
            {selected.unit}
          </span>
        </span>
      </label>

      <label className="field">
        <span className="field-label">Meal</span>
        <select
          value={meal}
          onChange={(e) => setMeal(e.target.value as Meal)}
          style={{ textTransform: 'capitalize' }}
        >
          {MEALS.map((m) => (
            <option key={m} value={m}>
              {m}
            </option>
          ))}
        </select>
      </label>

      {preview && (
        <Card style={{ marginTop: '1.25rem' }}>
          <strong style={{ fontSize: '1.1rem' }}>{preview.kcal} kcal</strong>
          <div className="muted" style={{ marginTop: '0.25rem' }}>
            P {preview.protein}g · C {preview.carbs}g · F {preview.fat}g
          </div>
        </Card>
      )}

      <div style={{ marginTop: '1.25rem' }}>
        <Button variant="primary" block onClick={handleAdd} disabled={!preview}>
          Add to log
        </Button>
      </div>
    </div>
  )
}