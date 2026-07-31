import { useEffect, useState } from 'react'
import { searchProducts, lookupBarcode, type SearchHit } from '../../data/openfoodfacts'
import { useDebounced } from '../../components/useDebounced'
import { Button, Empty, ScreenHeader } from '../../components/ui'
import type { FoodInput } from '../../data/foods'

interface Props {
  onPicked: (food: Partial<FoodInput>) => void
  onCancel: () => void
}

export function FoodSearch({ onPicked, onCancel }: Props) {
  const [query, setQuery] = useState('')
  const [hits, setHits] = useState<SearchHit[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [fetching, setFetching] = useState(false)

  const debounced = useDebounced(query)

  useEffect(() => {
    if (debounced.trim().length < 3) {
      setHits([])
      setError('')
      return
    }

    const controller = new AbortController()
    setLoading(true)
    setError('')

    searchProducts(debounced, controller.signal)
      .then((results) => {
        setHits(results)
        setLoading(false)
      })
      .catch((err) => {
        if (err.name === 'AbortError') return
        console.error('Search failed:', err)
        setError('Search is unavailable right now. Try a barcode or add it manually.')
        setLoading(false)
      })

    return () => controller.abort()
  }, [debounced])

  async function handlePick(hit: SearchHit) {
    setFetching(true)
    try {
      const full = await lookupBarcode(hit.code)
      onPicked(full.found && full.food ? full.food : hitToFood(hit))
    } catch (err) {
      console.error('Product lookup failed, using search data:', err)
      onPicked(hitToFood(hit))
    }
  }

  if (fetching) return <Empty>Loading product…</Empty>

  return (
    <div>
      <ScreenHeader
        title="Search foods"
        action={
          <Button size="sm" onClick={onCancel}>
            Cancel
          </Button>
        }
      />

      <input
        type="text"
        value={query}
        placeholder="Chicken breast, oat milk…"
        onChange={(e) => setQuery(e.target.value)}
        autoFocus
        style={{ marginBottom: '0.75rem' }}
      />

      {query.trim().length > 0 && query.trim().length < 3 && (
        <p className="muted">Keep typing…</p>
      )}

      {loading && <p className="muted">Searching…</p>}
      {error && <p className="warn">{error}</p>}

      {!loading && !error && debounced.trim().length >= 3 && hits.length === 0 && (
        <Empty>Nothing found. Restaurant meals often aren't in the database — add it manually.</Empty>
      )}

      {hits.map((hit) => (
        <button
          key={hit.code}
          className="btn btn-block"
          onClick={() => handlePick(hit)}
          style={{
            display: 'block',
            textAlign: 'left',
            marginBottom: '0.4rem',
            padding: '0.6rem 0.75rem',
          }}
        >
          <strong style={{ display: 'block' }}>{hit.name}</strong>
          <span className="muted" style={{ fontWeight: 400 }}>
            {hit.brand && `${hit.brand} · `}
            {hit.kcal} kcal
            {hit.protein != null && ` · P ${hit.protein}`}
            {hit.carbs != null && ` · C ${hit.carbs}`}
            {hit.fat != null && ` · F ${hit.fat}`}
            {' /100g'}
          </span>
        </button>
      ))}
    </div>
  )
}

function hitToFood(hit: SearchHit): Partial<FoodInput> {
  return {
    name: hit.name,
    brand: hit.brand,
    unit: 'g',
    kcal: hit.kcal,
    protein: hit.protein,
    carbs: hit.carbs,
    fat: hit.fat,
  }
}