import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useLiveQuery } from 'dexie-react-hooks'
import { listFoods, deleteFood, hasPieces } from '../../data/foods'
import { Button, Card, Empty, ScreenHeader } from '../../components/ui'
import type { Food } from '../../data/types'
import { fuzzySearch } from '../../data/search'

export function FoodListScreen() {
  const foods = useLiveQuery(() => listFoods(), [])
  const [search, setSearch] = useState('')
  const navigate = useNavigate()

  const filtered = fuzzySearch(foods ?? [], search, (f) => `${f.name} ${f.brand ?? ''}`)

  async function handleDelete(food: Food) {
    if (!food.id) return
    if (confirm(`Delete ${food.name}?`)) {
      await deleteFood(food.id)
    }
  }

  return (
    <div>
      <ScreenHeader title="Foods" />

      <div className="row" style={{ marginBottom: '0.75rem' }}>
        <Link to="/meals/foods/search" className="btn grow" style={{ textDecoration: 'none' }}>
          Search
        </Link>
        <Link to="/meals/foods/scan" className="btn grow" style={{ textDecoration: 'none' }}>
          Scan
        </Link>
        <Link
          to="/meals/foods/new"
          className="btn btn-primary grow"
          style={{ textDecoration: 'none' }}
        >
          Manual
        </Link>
      </div>

      <input
        type="text"
        value={search}
        placeholder="Filter your foods…"
        onChange={(e) => setSearch(e.target.value)}
        style={{ marginBottom: '0.75rem' }}
      />

      {foods === undefined && <Empty>Loading…</Empty>}

      {foods && filtered.length === 0 && (
        <Empty>
          {search
            ? 'No matches.'
            : 'No foods yet. Search the database, scan a barcode, or add one manually.'}
        </Empty>
      )}

      {filtered.map((food) => (
        <Card key={food.id} style={{ marginBottom: '0.5rem' }}>
          <div className="row">
            <strong className="grow">{food.name}</strong>
            <span className="muted">
              {food.kcal} kcal / 100{food.unit}
            </span>
          </div>

          <div className="muted" style={{ marginTop: '0.25rem' }}>
            P {food.protein}g · C {food.carbs}g · F {food.fat}g
            {food.brand && ` · ${food.brand}`}
          </div>

          {hasPieces(food) && (
            <div className="muted">
              1 {food.pieceLabel || 'piece'} = {food.pieceGrams}
              {food.unit}
            </div>
          )}

          <div className="row" style={{ marginTop: '0.5rem' }}>
            <Button size="sm" onClick={() => navigate(`/meals/foods/${food.id}/edit`)}>
              Edit
            </Button>
            <Button size="sm" variant="ghost" onClick={() => handleDelete(food)}>
              Delete
            </Button>
          </div>
        </Card>
      ))}
    </div>
  )
}