import { useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { listFoods, deleteFood } from '../../data/foods'
import { FoodForm } from './FoodForm'
import type { Food } from '../../data/types'

export function FoodListScreen() {
  const foods = useLiveQuery(() => listFoods(), [])
  const [mode, setMode] = useState<'list' | 'new' | 'edit'>('list')
  const [editing, setEditing] = useState<Food | undefined>()
  const [search, setSearch] = useState('')

  if (mode === 'new') {
    return <FoodForm onDone={() => setMode('list')} onCancel={() => setMode('list')} />
  }

  if (mode === 'edit' && editing) {
    return (
      <FoodForm
        existing={editing}
        onDone={() => setMode('list')}
        onCancel={() => setMode('list')}
      />
    )
  }

  const filtered = (foods ?? []).filter((f) =>
    f.name.toLowerCase().includes(search.toLowerCase())
  )

  async function handleDelete(food: Food) {
    if (!food.id) return
    if (confirm(`Delete ${food.name}?`)) {
      await deleteFood(food.id)
    }
  }

  return (
    <div>
      <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
        <h2 style={{ fontSize: '1.1rem', flex: 1 }}>Foods</h2>
        <button onClick={() => setMode('new')} style={{ padding: '0.5rem 0.9rem' }}>
          + Add
        </button>
      </div>

      <input
        type="text"
        value={search}
        placeholder="Search…"
        onChange={(e) => setSearch(e.target.value)}
        style={{
          width: '100%',
          padding: '0.6rem',
          fontSize: '1rem',
          margin: '0.5rem 0 1rem',
          boxSizing: 'border-box',
        }}
      />

      {foods === undefined && <p>Loading…</p>}

      {foods && filtered.length === 0 && (
        <p style={{ opacity: 0.7 }}>
          {search ? 'No matches.' : 'No foods yet. Tap Add to create your first one.'}
        </p>
      )}

      {filtered.map((food) => (
        <div
          key={food.id}
          style={{
            border: '1px solid var(--border)',
            borderRadius: '8px',
            padding: '0.75rem',
            marginBottom: '0.5rem',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.5rem' }}>
            <strong style={{ flex: 1 }}>{food.name}</strong>
            <span style={{ fontSize: '0.85rem', opacity: 0.7 }}>
              {food.kcal} kcal / 100{food.unit}
            </span>
          </div>
          <div style={{ fontSize: '0.85rem', opacity: 0.8, marginTop: '0.25rem' }}>
            P {food.protein}g · C {food.carbs}g · F {food.fat}g
            {food.brand && ` · ${food.brand}`}
          </div>
          <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem' }}>
            <button
              onClick={() => {
                setEditing(food)
                setMode('edit')
              }}
              style={{ padding: '0.35rem 0.7rem', fontSize: '0.85rem' }}
            >
              Edit
            </button>
            <button
              onClick={() => handleDelete(food)}
              style={{ padding: '0.35rem 0.7rem', fontSize: '0.85rem' }}
            >
              Delete
            </button>
          </div>
        </div>
      ))}
    </div>
  )
}