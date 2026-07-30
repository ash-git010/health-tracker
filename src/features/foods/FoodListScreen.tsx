import { useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { listFoods, deleteFood } from '../../data/foods'
import { FoodForm } from './FoodForm'
import type { Food } from '../../data/types'
import { BarcodeScanner } from './BarcodeScanner'
import { lookupBarcode } from '../../data/openfoodfacts'
import type { FoodInput } from '../../data/foods'

export function FoodListScreen() {
  const foods = useLiveQuery(() => listFoods(), [])
  const [mode, setMode] = useState<'list' | 'new' | 'edit' | 'scan' | 'looking'>('list')
  const [editing, setEditing] = useState<Food | undefined>()
  const [search, setSearch] = useState('')
  const [scanned, setScanned] = useState<Partial<FoodInput> | undefined>()
  const [scanError, setScanError] = useState('')

  if (mode === 'scan') {
    return <BarcodeScanner onDetected={handleBarcode} onCancel={() => setMode('list')} />
  }

  if (mode === 'looking') {
    return <p style={{ padding: '2rem 0', textAlign: 'center' }}>Looking up product…</p>
  }

  if (mode === 'new') {
    return (
        <FoodForm
        initial={scanned}
        onDone={() => {
            setScanned(undefined)
            setMode('list')
        }}
        onCancel={() => {
            setScanned(undefined)
            setMode('list')
        }}
        />
    )
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

  async function handleBarcode(barcode: string) {
    setMode('looking')
    setScanError('')
    try {
        const result = await lookupBarcode(barcode)
        if (!result.found) {
        setScanError(`Barcode ${barcode} isn't in the database. Add it manually instead.`)
        setMode('list')
        return
        }
        setScanned(result.food)
        setMode('new')
    } catch (err) {
        setScanError(err instanceof Error ? err.message : 'Lookup failed')
        setMode('list')
    }
}

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
        <button onClick={() => setMode('scan')} style={{ padding: '0.5rem 0.9rem' }}>
           Scan
        </button>
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

      {scanError && (
        <p style={{ fontSize: '0.9rem', color: 'var(--warn)' }}>{scanError}</p>
      )}

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