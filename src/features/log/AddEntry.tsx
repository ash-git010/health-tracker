import { useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { Link } from 'react-router-dom'
import { Search, ScanLine, Plus } from 'lucide-react'
import { listFoods, macrosForAmount, amountInBaseUnit, hasPieces } from '../../data/foods'
import { fuzzySearch } from '../../data/search'
import { logFood, MEALS, type Meal } from '../../data/log'
import { Button, Card, ScreenHeader } from '../../components/ui'
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

  const filtered = fuzzySearch(foods ?? [], search, (f) => `${f.name} ${f.brand ?? ''}`)

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
    const linkState = { returnTo: '/meals/today/add', meal, date }

    return (
      <div style={{ paddingBottom: '2rem' }}>
        <ScreenHeader
          title="Pick a food"
          action={
            <Button size="sm" variant="ghost" onClick={onCancel}>
              Cancel
            </Button>
          }
        />

        <input
          type="text"
          value={search}
          placeholder="Search your foods…"
          onChange={(e) => setSearch(e.target.value)}
          autoFocus
          style={{ marginBottom: '1rem' }}
        />

        <div className="row" style={{ gap: '0.5rem', marginBottom: '1.75rem' }}>
          <Link
            to="/meals/foods/search"
            state={{ ...linkState, query: search }}
            className="btn grow"
            style={{ textDecoration: 'none' }}
          >
            <Search size={16} /> Search
          </Link>
          <Link
            to="/meals/foods/scan"
            state={linkState}
            className="btn grow"
            style={{ textDecoration: 'none' }}
          >
            <ScanLine size={16} /> Scan
          </Link>
          <Link
            to="/meals/foods/new"
            state={linkState}
            className="btn grow"
            style={{ textDecoration: 'none' }}
          >
            <Plus size={16} /> New
          </Link>
        </div>

        {filtered.length > 0 && <h3>Your foods</h3>}

        {filtered.length === 0 && (
          <p className="muted" style={{ textAlign: 'center', padding: '1.5rem 0' }}>
            {search ? `No match for "${search}"` : 'No foods saved yet'}
          </p>
        )}

        <div>
          {filtered.map((food) => (
            <button
              key={food.id}
              className="btn-plain food-option"
              onClick={() => pickFood(food)}
            >
              <span style={{ display: 'block', fontWeight: 600 }}>{food.name}</span>
              <span className="faint" style={{ display: 'block' }}>
                {food.kcal} kcal per 100{food.unit}
                {hasPieces(food) &&
                  ` · 1 ${food.pieceLabel || 'piece'} = ${food.pieceGrams}${food.unit}`}
              </span>
            </button>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div>
      <ScreenHeader
        title={selected.name}
        onBack={() => setSelected(null)}
      />

      {hasPieces(selected) && (
        <div className="row" style={{ marginBottom: '1rem' }}>
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
          <div className="row" style={{ alignItems: 'baseline', gap: '0.35rem' }}>
            <span className="stat-sm">{preview.kcal}</span>
            <span className="stat-unit">kcal</span>
          </div>
          <div className="muted" style={{ marginTop: '0.35rem' }}>
            P {preview.protein}g · C {preview.carbs}g · F {preview.fat}g
          </div>
          {mode === 'piece' && (
            <div className="faint" style={{ marginTop: '0.25rem' }}>
              = {Math.round(grams)}
              {selected.unit}
            </div>
          )}
        </Card>
      )}

      <div style={{ marginTop: '1.5rem' }}>
        <Button variant="primary" block onClick={handleAdd} disabled={!preview}>
          Add to log
        </Button>
      </div>
    </div>
  )
}