import { useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { listFoods, deleteFood, hasPieces, type FoodInput } from '../../data/foods'
import { lookupBarcode } from '../../data/openfoodfacts'
import { Button, Card, Empty, ScreenHeader } from '../../components/ui'
import { FoodForm } from './FoodForm'
import { BarcodeScanner } from './BarcodeScanner'
import { FoodSearch } from './FoodSearch'
import type { Food } from '../../data/types'

type Mode = 'list' | 'new' | 'edit' | 'scan' | 'search' | 'looking'

export function FoodListScreen() {
  const foods = useLiveQuery(() => listFoods(), [])
  const [mode, setMode] = useState<Mode>('list')
  const [editing, setEditing] = useState<Food | undefined>()
  const [prefill, setPrefill] = useState<Partial<FoodInput> | undefined>()
  const [scanError, setScanError] = useState('')
  const [search, setSearch] = useState('')

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
      setPrefill(result.food)
      setMode('new')
    } catch (err) {
      setScanError(err instanceof Error ? err.message : 'Lookup failed')
      setMode('list')
    }
  }

  function closeForm() {
    setPrefill(undefined)
    setEditing(undefined)
    setMode('list')
  }

  if (mode === 'scan') {
    return <BarcodeScanner onDetected={handleBarcode} onCancel={() => setMode('list')} />
  }

  if (mode === 'search') {
    return (
      <FoodSearch
        onPicked={(food) => {
          setPrefill(food)
          setMode('new')
        }}
        onCancel={() => setMode('list')}
      />
    )
  }

  if (mode === 'looking') {
    return <Empty>Looking up product…</Empty>
  }

  if (mode === 'new') {
    return <FoodForm initial={prefill} onDone={closeForm} onCancel={closeForm} />
  }

  if (mode === 'edit' && editing) {
    return <FoodForm existing={editing} onDone={closeForm} onCancel={closeForm} />
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
      <ScreenHeader title="Foods" />

      <div className="row" style={{ marginBottom: '0.75rem' }}>
        <span className="grow">
          <Button block onClick={() => setMode('search')}>
            Search
          </Button>
        </span>
        <span className="grow">
          <Button block onClick={() => setMode('scan')}>
            Scan
          </Button>
        </span>
        <span className="grow">
          <Button block variant="primary" onClick={() => setMode('new')}>
            Manual
          </Button>
        </span>
      </div>

      <input
        type="text"
        value={search}
        placeholder="Filter your foods…"
        onChange={(e) => setSearch(e.target.value)}
        style={{ marginBottom: '0.75rem' }}
      />

      {scanError && <p className="warn">{scanError}</p>}

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
            <Button
              size="sm"
              onClick={() => {
                setEditing(food)
                setMode('edit')
              }}
            >
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