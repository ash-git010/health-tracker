import { useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { listFoods, macrosForAmount } from '../../data/foods'
import { logFood, MEALS, type Meal } from '../../data/log'
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
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <h2 style={{ fontSize: '1.1rem', flex: 1 }}>Pick a food</h2>
          <button onClick={onCancel} style={{ padding: '0.4rem 0.8rem' }}>
            Cancel
          </button>
        </div>

        <input
          type="text"
          value={search}
          placeholder="Search…"
          onChange={(e) => setSearch(e.target.value)}
          autoFocus
          style={{ width: '100%', padding: '0.6rem', margin: '0.75rem 0' }}
        />

        {filtered.length === 0 && (
          <p style={{ opacity: 0.7 }}>No foods found. Add some in the Foods tab.</p>
        )}

        {filtered.map((food) => (
          <button
            key={food.id}
            onClick={() => setSelected(food)}
            style={{
              display: 'block',
              width: '100%',
              textAlign: 'left',
              padding: '0.75rem',
              marginBottom: '0.5rem',
            }}
          >
            <strong>{food.name}</strong>
            <span style={{ fontSize: '0.85rem', opacity: 0.7, display: 'block' }}>
              {food.kcal} kcal per 100{food.unit}
            </span>
          </button>
        ))}
      </div>
    )
  }

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        <h2 style={{ fontSize: '1.1rem', flex: 1 }}>{selected.name}</h2>
        <button onClick={() => setSelected(null)} style={{ padding: '0.4rem 0.8rem' }}>
          Back
        </button>
      </div>

      <label style={{ display: 'block', margin: '1rem 0 0.25rem', fontSize: '0.9rem' }}>
        Amount
      </label>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        <input
          type="number"
          inputMode="decimal"
          value={amount}
          autoFocus
          onChange={(e) =>
            setAmount(e.target.value === '' ? '' : Number(e.target.value))
          }
          style={{ flex: 1, padding: '0.6rem' }}
        />
        <span>{selected.unit}</span>
      </div>

      <label style={{ display: 'block', margin: '1rem 0 0.25rem', fontSize: '0.9rem' }}>
        Meal
      </label>
      <select
        value={meal}
        onChange={(e) => setMeal(e.target.value as Meal)}
        style={{ width: '100%', padding: '0.6rem', textTransform: 'capitalize' }}
      >
        {MEALS.map((m) => (
          <option key={m} value={m} style={{ textTransform: 'capitalize' }}>
            {m}
          </option>
        ))}
      </select>

      {preview && (
        <div
          style={{
            marginTop: '1.25rem',
            padding: '0.75rem',
            border: '1px solid var(--border)',
            borderRadius: '8px',
          }}
        >
          <strong>{preview.kcal} kcal</strong>
          <div style={{ fontSize: '0.9rem', opacity: 0.85, marginTop: '0.25rem' }}>
            P {preview.protein}g · C {preview.carbs}g · F {preview.fat}g
          </div>
        </div>
      )}

      <button
        onClick={handleAdd}
        disabled={!preview}
        style={{
          width: '100%',
          padding: '0.9rem',
          marginTop: '1.25rem',
          opacity: preview ? 1 : 0.5,
        }}
      >
        Add to log
      </button>
    </div>
  )
}