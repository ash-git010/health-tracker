import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useLiveQuery } from 'dexie-react-hooks'
import { Search, ScanLine, Plus, Pencil, Trash2 } from 'lucide-react'
import { listFoods, deleteFood, hasPieces } from '../../data/foods'
import { fuzzySearch } from '../../data/search'
import { Card, Empty, ScreenHeader } from '../../components/ui'
import { useConfirm } from '../../components/DialogProvider'
import type { Food } from '../../data/types'

export function FoodListScreen() {
  const foods = useLiveQuery(() => listFoods(), [])
  const [search, setSearch] = useState('')
  const navigate = useNavigate()
  const confirm = useConfirm()

  const filtered = fuzzySearch(foods ?? [], search, (f) => `${f.name} ${f.brand ?? ''}`)

  async function handleDelete(food: Food) {
    if (!food.id) return
    const ok = await confirm({
      title: `Delete ${food.name}?`,
      message: 'This removes it from your food list. Past log entries are unaffected.',
      confirmLabel: 'Delete',
      destructive: true,
    })
    if (ok) await deleteFood(food.id)
  }

  return (
    <div style={{ paddingBottom: '2rem' }}>
      <ScreenHeader title="Foods" />

      <div className="row" style={{ marginBottom: '1rem' }}>
        <Link to="/meals/foods/search" className="btn grow" style={{ textDecoration: 'none' }}>
          <Search size={16} /> Search
        </Link>
        <Link to="/meals/foods/scan" className="btn grow" style={{ textDecoration: 'none' }}>
          <ScanLine size={16} /> Scan
        </Link>
        <Link
          to="/meals/foods/new"
          className="btn btn-primary grow"
          style={{ textDecoration: 'none' }}
        >
          <Plus size={16} /> New
        </Link>
      </div>

      <input
        type="text"
        value={search}
        placeholder="Filter your foods…"
        onChange={(e) => setSearch(e.target.value)}
        style={{ marginBottom: '1rem' }}
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
        <Card key={food.id} style={{ marginBottom: '0.5rem', padding: '0.875rem' }}>
          <div className="row" style={{ alignItems: 'flex-start' }}>
            <div className="grow" style={{ minWidth: 0 }}>
              <div className="row">
                <strong className="grow" style={{ minWidth: 0 }}>
                  {food.name}
                </strong>
                <span className="muted num">
                  {food.kcal} kcal
                  <span className="faint">/100{food.unit}</span>
                </span>
              </div>

              <div className="faint" style={{ marginTop: '0.2rem' }}>
                P {food.protein} · C {food.carbs} · F {food.fat}
                {food.brand && ` · ${food.brand}`}
              </div>

              {hasPieces(food) && (
                <div className="faint">
                  1 {food.pieceLabel || 'piece'} = {food.pieceGrams}
                  {food.unit}
                </div>
              )}
            </div>

            <button
              className="icon-btn"
              aria-label={`Edit ${food.name}`}
              onClick={() => navigate(`/meals/foods/${food.id}/edit`)}
            >
              <Pencil size={15} />
            </button>
            <button
              className="icon-btn"
              aria-label={`Delete ${food.name}`}
              onClick={() => handleDelete(food)}
            >
              <Trash2 size={15} />
            </button>
          </div>
        </Card>
      ))}
    </div>
  )
}