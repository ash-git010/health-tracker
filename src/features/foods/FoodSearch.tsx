import { useEffect, useState } from 'react'
import { searchProducts, lookupBarcode, type SearchHit } from '../../data/openfoodfacts'
import { searchCommonFoods, type CommonFood } from '../../data/commonFoods'
import { useDebounced } from '../../components/useDebounced'
import { Button, Empty, ScreenHeader } from '../../components/ui'
import type { FoodInput } from '../../data/foods'

interface Props {
  initialQuery?: string
  onPicked: (food: Partial<FoodInput>) => void
  onCancel: () => void
}

export function FoodSearch({ initialQuery = '', onPicked, onCancel }: Props) {
  const [query, setQuery] = useState(initialQuery)
  const [hits, setHits] = useState<SearchHit[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [fetching, setFetching] = useState(false)

  const debounced = useDebounced(query)
  const common = searchCommonFoods(query)

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
        setError('Branded search is unavailable right now.')
        setLoading(false)
      })

    return () => controller.abort()
  }, [debounced])

  async function handlePickBranded(hit: SearchHit) {
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

  const typing = query.trim().length > 0

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
        placeholder="Apple, chicken breast, oats…"
        onChange={(e) => setQuery(e.target.value)}
        autoFocus
        style={{ marginBottom: '0.75rem' }}
      />

      {!typing && <Empty>Start typing to search.</Empty>}

      {common.length > 0 && (
        <>
          <h3>Common foods</h3>
          {common.map((food) => (
            <ResultButton
              key={food.name}
              title={food.name}
              subtitle={`${food.kcal} kcal · P ${food.protein} · C ${food.carbs} · F ${food.fat} /100${food.unit}${
                food.pieceGrams ? ` · 1 ${food.pieceLabel} = ${food.pieceGrams}g` : ''
              }`}
              onClick={() => onPicked(stripKeywords(food))}
            />
          ))}
        </>
      )}

      {typing && <h3 style={{ marginTop: '1.25rem' }}>Branded products</h3>}

      {typing && query.trim().length < 3 && <p className="muted">Keep typing…</p>}
      {loading && <p className="muted">Searching…</p>}
      {error && <p className="warn">{error}</p>}

      {!loading && !error && debounced.trim().length >= 3 && hits.length === 0 && (
        <p className="muted">
          Nothing found. Restaurant meals often aren't in the database — add it manually.
        </p>
      )}

      {hits.map((hit) => (
        <ResultButton
          key={hit.code}
          title={hit.name}
          subtitle={`${hit.brand ? `${hit.brand} · ` : ''}${hit.kcal} kcal${
            hit.protein != null ? ` · P ${hit.protein}` : ''
          }${hit.carbs != null ? ` · C ${hit.carbs}` : ''}${
            hit.fat != null ? ` · F ${hit.fat}` : ''
          } /100g`}
          onClick={() => handlePickBranded(hit)}
        />
      ))}
    </div>
  )
}

function ResultButton({
  title,
  subtitle,
  onClick,
}: {
  title: string
  subtitle: string
  onClick: () => void
}) {
  return (
    <button
      className="btn btn-block"
      onClick={onClick}
      style={{
        display: 'block',
        textAlign: 'left',
        marginBottom: '0.4rem',
        padding: '0.6rem 0.75rem',
      }}
    >
      <strong style={{ display: 'block' }}>{title}</strong>
      <span className="muted" style={{ fontWeight: 400 }}>
        {subtitle}
      </span>
    </button>
  )
}

function stripKeywords(food: CommonFood): Partial<FoodInput> {
  const { keywords, ...rest } = food
  void keywords
  return rest
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