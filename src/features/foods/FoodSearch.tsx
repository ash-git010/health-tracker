import { useEffect, useState } from 'react'
import { searchProducts, lookupBarcode, type SearchHit } from '../../data/openfoodfacts'
import { searchCommonFoods, type CommonFood } from '../../data/commonFoods'
import { useDebounced } from '../../components/useDebounced'
import { t } from '../../data/i18n'
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
        // The thrown message carries an HTTP status and stays English in the
        // console; the screen owns the user-facing wording.
        console.error('Search failed:', err)
        setError(t('search.unavailable'))
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

  if (fetching) return <Empty>{t('search.loadingProduct')}</Empty>

  const typing = query.trim().length > 0

  return (
    <div>
      <ScreenHeader
        title={t('search.title')}
        action={
          <Button size="sm" onClick={onCancel}>
            {t('common.cancel')}
          </Button>
        }
      />

      <input
        type="text"
        value={query}
        placeholder={t('search.placeholder')}
        onChange={(e) => setQuery(e.target.value)}
        autoFocus
        style={{ marginBottom: '0.75rem' }}
      />

      {!typing && <Empty>{t('search.startTyping')}</Empty>}

      {common.length > 0 && (
        <>
          <h3>{t('search.commonFoods')}</h3>
          {common.map((food) => (
            <ResultButton
              key={food.name}
              title={food.name}
              subtitle={commonSubtitle(food)}
              onClick={() => onPicked(stripKeywords(food))}
            />
          ))}
        </>
      )}

      {typing && <h3 style={{ marginTop: '1.25rem' }}>{t('search.branded')}</h3>}

      {typing && query.trim().length < 3 && <p className="muted">{t('search.keepTyping')}</p>}
      {loading && <p className="muted">{t('search.searching')}</p>}
      {error && <p className="warn">{error}</p>}

      {!loading && !error && debounced.trim().length >= 3 && hits.length === 0 && (
        <p className="muted">{t('search.nothingFound')}</p>
      )}

      {hits.map((hit) => (
        <ResultButton
          key={hit.code}
          title={hit.name}
          subtitle={brandedSubtitle(hit)}
          onClick={() => handlePickBranded(hit)}
        />
      ))}
    </div>
  )
}

/**
 * Built by joining parts rather than from one template string, because the
 * brand and each macro are independently optional. `/100{unit}` trails the
 * lot in both languages.
 */
function commonSubtitle(food: CommonFood): string {
  const head = [
    `${food.kcal} kcal`,
    t('macro.pShort', { n: food.protein }),
    t('macro.cShort', { n: food.carbs }),
    t('macro.fShort', { n: food.fat }),
  ].join(' · ')

  const piece = food.pieceGrams
    ? ` · ${t('add.perPiece', {
        label: food.pieceLabel || t('add.piece'),
        grams: food.pieceGrams,
        unit: food.unit,
      })}`
    : ''

  return `${head} ${t('foods.per100', { unit: food.unit })}${piece}`
}

function brandedSubtitle(hit: SearchHit): string {
  const parts = [
    hit.brand,
    `${hit.kcal} kcal`,
    hit.protein != null ? t('macro.pShort', { n: hit.protein }) : null,
    hit.carbs != null ? t('macro.cShort', { n: hit.carbs }) : null,
    hit.fat != null ? t('macro.fShort', { n: hit.fat }) : null,
  ].filter(Boolean)

  // Branded hits are always read per 100g — searchProducts maps every one to
  // `unit: 'g'` regardless of what the package says.
  return `${parts.join(' · ')} ${t('foods.per100', { unit: 'g' })}`
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