import type { FoodInput } from './foods'

const BASE = 'https://world.openfoodfacts.org/api/v2/product'
const SEARCH_BASE = 'https://upkeep-search.aswin010pk.workers.dev'

const PRODUCT_FIELDS = [
  'product_name',
  'brands',
  'quantity',
  'nutriments',
  'serving_size',
].join(',')


export interface LookupResult {
  found: boolean
  food?: Partial<FoodInput>
  raw?: unknown
}

export interface SearchHit {
  code: string
  name: string
  brand?: string
  kcal?: number
  protein?: number
  carbs?: number
  fat?: number
}

export async function lookupBarcode(barcode: string): Promise<LookupResult> {
  const url = `${BASE}/${encodeURIComponent(barcode)}.json?fields=${PRODUCT_FIELDS}`

  const res = await fetch(url, {
    headers: {
      'User-Agent': 'Upkeep/0.1 (personal project)',
    },
  })

  if (!res.ok) throw new Error(`Lookup failed (${res.status})`)

  const data = await res.json()
  if (data.status === 0 || !data.product) return { found: false }

  const p = data.product
  const n = p.nutriments ?? {}

  const isLiquid = /\b(ml|l|litre|liter)\b/i.test(p.quantity ?? '')

  return {
    found: true,
    raw: p,
    food: {
      name: (p.product_name ?? '').trim() || undefined,
      brand: firstBrand(p.brands),
      unit: isLiquid ? 'ml' : 'g',
      kcal: kcalFrom(n),
      protein: num(n.proteins_100g),
      carbs: num(n.carbohydrates_100g),
      fat: num(n.fat_100g),
      fiber: num(n.fiber_100g),
      sugar: num(n.sugars_100g),
    },
  }
}

export async function searchProducts(
  query: string,
  signal?: AbortSignal
): Promise<SearchHit[]> {
  const trimmed = query.trim()
  if (trimmed.length < 3) return []

  const url = `${SEARCH_BASE}?q=${encodeURIComponent(trimmed)}&page_size=25`

  const res = await fetch(url, { signal })
  if (!res.ok) throw new Error(`Search unavailable (${res.status})`)

  const data = await res.json()
  const raw: any[] = data.hits ?? []

  return raw
    .map((p): SearchHit => {
      const n = p.nutriments ?? {}
      return {
        code: String(p.code ?? ''),
        name: (p.product_name ?? '').trim(),
        brand: firstBrand(p.brands),
        kcal: kcalFrom(n),
        protein: num(n.proteins_100g),
        carbs: num(n.carbohydrates_100g),
        fat: num(n.fat_100g),
      }
    })
    .filter((h) => h.code && h.name && h.kcal != null)
}

function firstBrand(brands: unknown): string | undefined {
  if (Array.isArray(brands)) return String(brands[0] ?? '').trim() || undefined
  if (typeof brands === 'string') return brands.split(',')[0]?.trim() || undefined
  return undefined
}

function kcalFrom(n: any): number | undefined {
  const direct = num(n['energy-kcal_100g'])
  if (direct != null) return direct

  const kj = num(n['energy-kj_100g']) ?? num(n['energy_100g'])
  return kj != null ? Math.round(kj / 4.184) : undefined
}

function num(v: unknown): number | undefined {
  if (v === null || v === undefined || v === '') return undefined
  const parsed = typeof v === 'number' ? v : Number(v)
  return Number.isFinite(parsed) ? Math.round(parsed * 10) / 10 : undefined
}