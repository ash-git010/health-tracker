import type { FoodInput } from './foods'

const BASE = 'https://world.openfoodfacts.org/api/v2/product'

const FIELDS = [
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

export async function lookupBarcode(barcode: string): Promise<LookupResult> {
  const url = `${BASE}/${encodeURIComponent(barcode)}.json?fields=${FIELDS}`

  const res = await fetch(url, {
    headers: {
      'User-Agent': 'HealthTracker/0.1 (personal project)',
    },
  })

  if (!res.ok) throw new Error(`Lookup failed (${res.status})`)

  const data = await res.json()
  if (data.status === 0 || !data.product) return { found: false }

  const p = data.product
  const n = p.nutriments ?? {}

  const isLiquid = /\b(ml|l|litre|liter)\b/i.test(p.quantity ?? '')

  const kcal =
    num(n['energy-kcal_100g']) ??
    (num(n['energy_100g']) != null ? Math.round(num(n['energy_100g'])! / 4.184) : undefined)

  return {
    found: true,
    raw: p,
    food: {
      name: (p.product_name ?? '').trim() || undefined,
      brand: (p.brands ?? '').split(',')[0]?.trim() || undefined,
      unit: isLiquid ? 'ml' : 'g',
      kcal,
      protein: num(n.proteins_100g),
      carbs: num(n.carbohydrates_100g),
      fat: num(n.fat_100g),
      fiber: num(n.fiber_100g),
      sugar: num(n.sugars_100g),
    },
  }
}

function num(v: unknown): number | undefined {
  const parsed = typeof v === 'number' ? v : Number(v)
  return Number.isFinite(parsed) ? Math.round(parsed * 10) / 10 : undefined
}