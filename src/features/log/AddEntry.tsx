import { useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { listFoods, macrosForAmount, amountInBaseUnit, hasPieces } from '../../data/foods'
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
  const [mode, setMode] = useState<'base' | 'piece'>('base')

  const filtered = (foods ?? []).filter((f) =>
    f.name.toLowerCase().includes(search.toLowerCase())
  )

  const grams =
    selected && typeof amount === 'number' ? amountInBaseUnit(selected, amount, mode) : 0

  const preview = selected && grams > 0 ? macrosForAmount(selected, grams) : null

  async function handleAdd() {
    if (!selected || grams <= 0) return
    await logFood(selected, grams, meal, date)
    onDone()
  }

  function pickFood(food: Food) {
    setSelected(food)
    setMode(hasPieces(food) ? 'piece' : 'base')
    setAmount('')
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
            onClick={() => pickFood(food)}
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
              {hasPieces(food) &&
                ` · 1 ${food.pieceLabel || 'piece'} = ${food.pieceGrams}${food.unit}`}
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

      {hasPieces(selected) && (
        <div className="row" style={{ marginBottom: '0.875rem' }}>
          <Button
            variant={mode === 'piece' ? 'primary' : 'default'}
            onClick={() => {
              setMode('piece')
              setAmount('')
            }}
          >
            {selected.pieceLabel ? `${selected.pieceLabel}s` : 'Pieces'}
          </Button>
          <Button
            variant={mode === 'base' ? 'primary' : 'default'}
            onClick={() => {
              setMode('base')
              setAmount('')
            }}
          >
            {selected.unit === 'ml' ? 'Millilitres' : 'Grams'}
          </Button>
        </div>
      )}

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
          <span className="muted" style={{ minWidth: '3.5rem' }}>
            {mode === 'piece' ? selected.pieceLabel || 'pcs' : selected.unit}
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
          {mode === 'piece' && (
            <div className="muted" style={{ marginTop: '0.25rem' }}>
              = {Math.round(grams)}
              {selected.unit}
            </div>
          )}
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