import { supabase } from './supabase'
import { db } from './db'
import { getCurrentUser } from './auth'
import { getLastSyncedAt, setLastSyncedAt } from './syncState'
import type { Food } from './types'

/**
 * Foods only, for now. Once this table proves out end to end, the same shape
 * gets repeated for the other thirteen.
 *
 * Two conversions happen here and nowhere else:
 *   - camelCase (JavaScript) <-> snake_case (SQL convention)
 *   - undefined (JavaScript "absent") <-> null (SQL "absent")
 *
 * Dexie stores `undefined` for optional fields. Postgres has no undefined —
 * sending it drops the key entirely, which on an update means "leave this
 * alone" rather than "clear it". Explicit null is what actually clears a value.
 */

interface FoodRow {
  id: string
  user_id: string
  name: string
  brand: string | null
  unit: 'g' | 'ml'
  kcal: number
  protein: number
  carbs: number
  fat: number
  fiber: number | null
  sugar: number | null
  piece_grams: number | null
  piece_label: string | null
  created_at: string
  updated_at: string
  deleted_at: string | null
}

function toRow(food: Food, userId: string): FoodRow {
  return {
    id: food.id,
    user_id: userId,
    name: food.name,
    brand: food.brand ?? null,
    unit: food.unit,
    kcal: food.kcal,
    protein: food.protein,
    carbs: food.carbs,
    fat: food.fat,
    fiber: food.fiber ?? null,
    sugar: food.sugar ?? null,
    piece_grams: food.pieceGrams ?? null,
    piece_label: food.pieceLabel ?? null,
    created_at: food.createdAt,
    // Sent explicitly, never left for Postgres to default. The pull cursor
    // compares against this value, and a server-stamped clock drifting from
    // the device clock would silently drop rows from future pulls.
    updated_at: food.updatedAt,
    deleted_at: food.deletedAt ?? null,
  }
}

/**
 * Postgres `numeric` preserves exact decimals, and PostgREST may return it as
 * a string rather than a JSON number to avoid precision loss. Coerce rather
 * than trusting the type, or "52" ends up in a field the charts expect to add.
 */
function num(v: unknown): number {
  return typeof v === 'number' ? v : Number(v)
}

function optionalNum(v: unknown): number | undefined {
  return v === null || v === undefined ? undefined : num(v)
}

function fromRow(row: FoodRow): Food {
  return {
    id: row.id,
    name: row.name,
    brand: row.brand ?? undefined,
    unit: row.unit,
    kcal: num(row.kcal),
    protein: num(row.protein),
    carbs: num(row.carbs),
    fat: num(row.fat),
    fiber: optionalNum(row.fiber),
    sugar: optionalNum(row.sugar),
    pieceGrams: optionalNum(row.piece_grams),
    pieceLabel: row.piece_label ?? undefined,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    deletedAt: row.deleted_at ?? undefined,
  }
}

export interface SyncReport {
  pushed: number
  pulled: number
  error?: string
}

/**
 * Send local rows the server has not seen. Soft-deleted rows go too — the
 * tombstone is how other devices learn the row went away.
 *
 * `upsert` inserts or updates on primary key collision, so re-running this is
 * harmless. That matters when a sync is interrupted halfway.
 */
async function pushFoods(userId: string, since: string | undefined): Promise<number> {
  const all = await db.foods.toArray()
  const changed = since ? all.filter((f) => f.updatedAt > since) : all
  if (changed.length === 0) return 0

  const { error } = await supabase.from('foods').upsert(changed.map((f) => toRow(f, userId)))
  if (error) throw new Error(`Push failed: ${error.message}`)

  return changed.length
}

async function pullFoods(since: string | undefined): Promise<number> {
  let query = supabase.from('foods').select('*')
  if (since) query = query.gt('updated_at', since)

  const { data, error } = await query
  if (error) throw new Error(`Pull failed: ${error.message}`)
  if (!data || data.length === 0) return 0

  // bulkPut overwrites by primary key. Last write wins, which is fine for one
  // person across their own devices.
  await db.foods.bulkPut(data.map((row) => fromRow(row as FoodRow)))

  return data.length
}

/**
 * Push then pull. Push first so a brand-new account gets this device's data
 * onto the server before anything comes back down.
 */
export async function syncFoods(): Promise<SyncReport> {
  const user = await getCurrentUser()
  if (!user) return { pushed: 0, pulled: 0, error: 'Not signed in' }

  const since = await getLastSyncedAt()

  // Captured before the work, not after: anything written while syncing must
  // still look newer than the cursor, or it never syncs.
  const startedAt = new Date().toISOString()

  try {
    const pushed = await pushFoods(user.id, since)
    const pulled = await pullFoods(since)
    await setLastSyncedAt(startedAt)
    return { pushed, pulled }
  } catch (err) {
    return {
      pushed: 0,
      pulled: 0,
      error: err instanceof Error ? err.message : 'Unknown sync error',
    }
  }
}

if (import.meta.env.DEV) {
  ;(window as unknown as Record<string, unknown>).upkeepSyncTest = {
    syncFoods,
    countLocal: () => db.foods.count(),
    peekServer: async () => (await supabase.from('foods').select('*')).data,
  }
}