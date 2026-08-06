import { supabase } from './supabase'
import { db } from './db'
import { getCurrentUser } from './auth'
import { getLastSyncedAt, setLastSyncedAt } from './syncState'
import type {
  Goals, Profile, Food, LogEntry, BodyMeasurement, Exercise, Workout, WorkoutSet,
  Routine, RoutineExercise, CareRoutine, CareStep, CareDone, CareStepDone,
} from './types'

/**
 * Push/pull sync between Dexie and Supabase.
 *
 * Two conversions happen here and nowhere else:
 *   - camelCase (JavaScript) <-> snake_case (SQL convention)
 *   - undefined (JavaScript "absent") <-> null (SQL "absent")
 *
 * Dexie stores `undefined` for optional fields. Postgres has no undefined, and
 * omitting a key on an update means "leave it alone" rather than "clear it".
 * Explicit null is what actually clears a value.
 *
 * Renamed fields, because the local names collide with SQL keywords or types:
 *   date      -> logged_on / measured_on / performed_on / done_on
 *   order     -> sort_order
 *   sortOrder -> sort_order
 */

type Row = Record<string, unknown>

/** Postgres `numeric` may arrive as a string to preserve precision. */
function n(v: unknown): number {
  return typeof v === 'number' ? v : Number(v)
}

function on(v: unknown): number | undefined {
  return v === null || v === undefined ? undefined : n(v)
}

function s(v: unknown): string {
  return v === null || v === undefined ? '' : String(v)
}

function os(v: unknown): string | undefined {
  return v === null || v === undefined ? undefined : String(v)
}

function arr(v: unknown): string[] {
  return Array.isArray(v) ? v.map(String) : []
}

// ---------------------------------------------------------------------------
// Per-table mapping
//
// `order` matters on push: a workout_set whose parent workout is not yet on
// the server violates the foreign key and the insert is rejected. Parents are
// listed before children.
// ---------------------------------------------------------------------------

interface TableSync<L> {
  /** Server table name. */
  name: string
  all: () => Promise<L[]>
  put: (rows: L[]) => Promise<unknown>
  updatedAt: (row: L) => string
  toRow: (row: L, userId: string) => Row
  fromRow: (row: Row) => L
}

const foods: TableSync<Food> = {
  name: 'foods',
  all: () => db.foods.toArray(),
  put: (rows) => db.foods.bulkPut(rows),
  updatedAt: (f) => f.updatedAt,
  toRow: (f, userId) => ({
    id: f.id,
    user_id: userId,
    name: f.name,
    brand: f.brand ?? null,
    unit: f.unit,
    kcal: f.kcal,
    protein: f.protein,
    carbs: f.carbs,
    fat: f.fat,
    fiber: f.fiber ?? null,
    sugar: f.sugar ?? null,
    piece_grams: f.pieceGrams ?? null,
    piece_label: f.pieceLabel ?? null,
    created_at: f.createdAt,
    updated_at: f.updatedAt,
    deleted_at: f.deletedAt ?? null,
  }),
  fromRow: (r) => ({
    id: s(r.id),
    name: s(r.name),
    brand: os(r.brand),
    unit: r.unit === 'ml' ? 'ml' : 'g',
    kcal: n(r.kcal),
    protein: n(r.protein),
    carbs: n(r.carbs),
    fat: n(r.fat),
    fiber: on(r.fiber),
    sugar: on(r.sugar),
    pieceGrams: on(r.piece_grams),
    pieceLabel: os(r.piece_label),
    createdAt: s(r.created_at),
    updatedAt: s(r.updated_at),
    deletedAt: os(r.deleted_at),
  }),
}

const logEntries: TableSync<LogEntry> = {
  name: 'log_entries',
  all: () => db.logEntries.toArray(),
  put: (rows) => db.logEntries.bulkPut(rows),
  updatedAt: (e) => e.updatedAt,
  toRow: (e, userId) => ({
    id: e.id,
    user_id: userId,
    logged_on: e.date,
    meal: e.meal,
    food_id: e.foodId || null,
    food_name: e.foodName,
    amount: e.amount,
    unit: e.unit,
    kcal: e.kcal,
    protein: e.protein,
    carbs: e.carbs,
    fat: e.fat,
    created_at: e.createdAt,
    updated_at: e.updatedAt,
    deleted_at: e.deletedAt ?? null,
  }),
  fromRow: (r) => ({
    id: s(r.id),
    date: s(r.logged_on),
    meal: r.meal as LogEntry['meal'],
    foodId: s(r.food_id),
    foodName: s(r.food_name),
    amount: n(r.amount),
    unit: r.unit === 'ml' ? 'ml' : 'g',
    kcal: n(r.kcal),
    protein: n(r.protein),
    carbs: n(r.carbs),
    fat: n(r.fat),
    createdAt: s(r.created_at),
    updatedAt: s(r.updated_at),
    deletedAt: os(r.deleted_at),
  }),
}

const measurements: TableSync<BodyMeasurement> = {
  name: 'measurements',
  all: () => db.measurements.toArray(),
  put: (rows) => db.measurements.bulkPut(rows),
  updatedAt: (m) => m.updatedAt,
  toRow: (m, userId) => ({
    id: m.id,
    user_id: userId,
    measured_on: m.date,
    weight_kg: m.weightKg,
    height_cm: m.heightCm ?? null,
    created_at: m.createdAt,
    updated_at: m.updatedAt,
    deleted_at: m.deletedAt ?? null,
  }),
  fromRow: (r) => ({
    id: s(r.id),
    date: s(r.measured_on),
    weightKg: n(r.weight_kg),
    heightCm: on(r.height_cm),
    createdAt: s(r.created_at),
    updatedAt: s(r.updated_at),
    deletedAt: os(r.deleted_at),
  }),
}

// Only user-created exercises. The 1,324 bundled ones live in the JSON seed and
// are never written to Dexie, so they cannot leak into this push. There is no
// `custom` column server-side: every row here is custom by definition, so it is
// added back on the way in.
const customExercises: TableSync<Exercise> = {
  name: 'custom_exercises',
  all: () => db.exercises.toArray(),
  put: (rows) => db.exercises.bulkPut(rows),
  updatedAt: (e) => e.updatedAt,
  toRow: (e, userId) => ({
    id: e.id,
    user_id: userId,
    seed_id: e.seedId ?? null,
    name: e.name,
    body_part: e.bodyPart,
    equipment: e.equipment,
    target: e.target,
    secondary: e.secondary ?? [],
    steps: e.steps ?? [],
    created_at: e.createdAt,
    updated_at: e.updatedAt,
    deleted_at: e.deletedAt ?? null,
  }),
  fromRow: (r) => ({
    id: s(r.id),
    seedId: os(r.seed_id),
    name: s(r.name),
    bodyPart: s(r.body_part),
    equipment: s(r.equipment),
    target: s(r.target),
    secondary: arr(r.secondary),
    steps: arr(r.steps),
    custom: true,
    createdAt: s(r.created_at),
    updatedAt: s(r.updated_at),
    deletedAt: os(r.deleted_at),
  }),
}

// routine_id has no foreign key on purpose: deleting a routine must not delete
// the workouts already performed from it.
const workouts: TableSync<Workout> = {
  name: 'workouts',
  all: () => db.workouts.toArray(),
  put: (rows) => db.workouts.bulkPut(rows),
  updatedAt: (w) => w.updatedAt,
  toRow: (w, userId) => ({
    id: w.id,
    user_id: userId,
    performed_on: w.date,
    name: w.name,
    started_at: w.startedAt,
    finished_at: w.finishedAt ?? null,
    notes: w.notes ?? null,
    routine_id: w.routineId || null,
    created_at: w.createdAt,
    updated_at: w.updatedAt,
    deleted_at: w.deletedAt ?? null,
  }),
  fromRow: (r) => ({
    id: s(r.id),
    date: s(r.performed_on),
    name: s(r.name),
    startedAt: s(r.started_at),
    finishedAt: os(r.finished_at),
    notes: os(r.notes),
    routineId: os(r.routine_id),
    createdAt: s(r.created_at),
    updatedAt: s(r.updated_at),
    deletedAt: os(r.deleted_at),
  }),
}

const workoutSets: TableSync<WorkoutSet> = {
  name: 'workout_sets',
  all: () => db.workoutSets.toArray(),
  put: (rows) => db.workoutSets.bulkPut(rows),
  updatedAt: (w) => w.updatedAt,
  toRow: (w, userId) => ({
    id: w.id,
    user_id: userId,
    workout_id: w.workoutId,
    exercise_key: w.exerciseKey,
    exercise_name: w.exerciseName,
    sort_order: w.order,
    set_number: w.setNumber,
    weight_kg: w.weightKg,
    reps: w.reps,
    type: w.type,
    rest_seconds: w.restSeconds ?? 0,
    completed: w.completed ?? false,
    created_at: w.createdAt,
    updated_at: w.updatedAt,
    deleted_at: w.deletedAt ?? null,
  }),
  fromRow: (r) => ({
    id: s(r.id),
    workoutId: s(r.workout_id),
    exerciseKey: s(r.exercise_key),
    exerciseName: s(r.exercise_name),
    order: n(r.sort_order),
    setNumber: n(r.set_number),
    weightKg: n(r.weight_kg),
    reps: n(r.reps),
    type: r.type as WorkoutSet['type'],
    restSeconds: n(r.rest_seconds),
    completed: Boolean(r.completed),
    createdAt: s(r.created_at),
    updatedAt: s(r.updated_at),
    deletedAt: os(r.deleted_at),
  }),
}

const routines: TableSync<Routine> = {
  name: 'routines',
  all: () => db.routines.toArray(),
  put: (rows) => db.routines.bulkPut(rows),
  updatedAt: (r) => r.updatedAt,
  toRow: (r, userId) => ({
    id: r.id,
    user_id: userId,
    name: r.name,
    folder: r.folder ?? null,
    sort_order: r.sortOrder ?? null,
    created_at: r.createdAt,
    updated_at: r.updatedAt,
    deleted_at: r.deletedAt ?? null,
  }),
  fromRow: (r) => ({
    id: s(r.id),
    name: s(r.name),
    folder: os(r.folder),
    sortOrder: on(r.sort_order),
    createdAt: s(r.created_at),
    updatedAt: s(r.updated_at),
    deletedAt: os(r.deleted_at),
  }),
}

const routineExercises: TableSync<RoutineExercise> = {
  name: 'routine_exercises',
  all: () => db.routineExercises.toArray(),
  put: (rows) => db.routineExercises.bulkPut(rows),
  updatedAt: (r) => r.updatedAt,
  toRow: (r, userId) => ({
    id: r.id,
    user_id: userId,
    routine_id: r.routineId,
    exercise_key: r.exerciseKey,
    exercise_name: r.exerciseName,
    sort_order: r.order,
    target_sets: r.targetSets,
    rest_seconds: r.restSeconds ?? 0,
    created_at: r.createdAt,
    updated_at: r.updatedAt,
    deleted_at: r.deletedAt ?? null,
  }),
  fromRow: (r) => ({
    id: s(r.id),
    routineId: s(r.routine_id),
    exerciseKey: s(r.exercise_key),
    exerciseName: s(r.exercise_name),
    order: n(r.sort_order),
    targetSets: n(r.target_sets),
    restSeconds: n(r.rest_seconds),
    createdAt: s(r.created_at),
    updatedAt: s(r.updated_at),
    deletedAt: os(r.deleted_at),
  }),
}

const careRoutines: TableSync<CareRoutine> = {
  name: 'care_routines',
  all: () => db.careRoutines.toArray(),
  put: (rows) => db.careRoutines.bulkPut(rows),
  updatedAt: (c) => c.updatedAt,
  toRow: (c, userId) => ({
    id: c.id,
    user_id: userId,
    name: c.name,
    kind: c.kind,
    time_of_day: c.timeOfDay,
    sort_order: c.sortOrder ?? 0,
    created_at: c.createdAt,
    updated_at: c.updatedAt,
    deleted_at: c.deletedAt ?? null,
  }),
  fromRow: (r) => ({
    id: s(r.id),
    name: s(r.name),
    kind: s(r.kind),
    timeOfDay: r.time_of_day as CareRoutine['timeOfDay'],
    sortOrder: n(r.sort_order),
    createdAt: s(r.created_at),
    updatedAt: s(r.updated_at),
    deletedAt: os(r.deleted_at),
  }),
}

const careSteps: TableSync<CareStep> = {
  name: 'care_steps',
  all: () => db.careSteps.toArray(),
  put: (rows) => db.careSteps.bulkPut(rows),
  updatedAt: (c) => c.updatedAt,
  toRow: (c, userId) => ({
    id: c.id,
    user_id: userId,
    care_routine_id: c.careRoutineId,
    name: c.name,
    product: c.product ?? null,
    notes: c.notes ?? null,
    sort_order: c.order,
    created_at: c.createdAt,
    updated_at: c.updatedAt,
    deleted_at: c.deletedAt ?? null,
  }),
  fromRow: (r) => ({
    id: s(r.id),
    careRoutineId: s(r.care_routine_id),
    name: s(r.name),
    product: os(r.product),
    notes: os(r.notes),
    order: n(r.sort_order),
    createdAt: s(r.created_at),
    updatedAt: s(r.updated_at),
    deletedAt: os(r.deleted_at),
  }),
}

const careDoneLog: TableSync<CareDone> = {
  name: 'care_done_log',
  all: () => db.careDoneLog.toArray(),
  put: (rows) => db.careDoneLog.bulkPut(rows),
  updatedAt: (c) => c.updatedAt,
  toRow: (c, userId) => ({
    id: c.id,
    user_id: userId,
    care_routine_id: c.careRoutineId,
    done_on: c.date,
    skipped: c.skipped ?? false,
    created_at: c.createdAt,
    updated_at: c.updatedAt,
    deleted_at: c.deletedAt ?? null,
  }),
  fromRow: (r) => ({
    id: s(r.id),
    careRoutineId: s(r.care_routine_id),
    date: s(r.done_on),
    skipped: Boolean(r.skipped),
    createdAt: s(r.created_at),
    updatedAt: s(r.updated_at),
    deletedAt: os(r.deleted_at),
  }),
}

const careStepDone: TableSync<CareStepDone> = {
  name: 'care_step_done',
  all: () => db.careStepDone.toArray(),
  put: (rows) => db.careStepDone.bulkPut(rows),
  updatedAt: (c) => c.updatedAt,
  toRow: (c, userId) => ({
    id: c.id,
    user_id: userId,
    care_routine_id: c.careRoutineId,
    step_id: c.stepId,
    done_on: c.date,
    created_at: c.createdAt,
    updated_at: c.updatedAt,
    deleted_at: c.deletedAt ?? null,
  }),
  fromRow: (r) => ({
    id: s(r.id),
    careRoutineId: s(r.care_routine_id),
    stepId: s(r.step_id),
    date: s(r.done_on),
    createdAt: s(r.created_at),
    updatedAt: s(r.updated_at),
    deletedAt: os(r.deleted_at),
  }),
}

// Parents before children. workout_sets, routine_exercises, care_steps,
// care_done_log and care_step_done all carry real foreign keys.
const TABLES: TableSync<never>[] = [
  foods,
  logEntries,
  measurements,
  customExercises,
  routines,
  routineExercises,
  workouts,
  workoutSets,
  careRoutines,
  careSteps,
  careDoneLog,
  careStepDone,
] as unknown as TableSync<never>[]

// ---------------------------------------------------------------------------
// Singletons
//
// One row per user, so user_id is the primary key server-side. Locally they
// keep the fixed numeric id 1. Neither has a deleted_at: you never delete your
// own goals or profile.
// ---------------------------------------------------------------------------

async function pushGoals(userId: string, since: string | undefined): Promise<number> {
  const g = await db.goals.get(1)
  if (!g) return 0
  if (since && g.updatedAt <= since) return 0

  const { error } = await supabase.from('goals').upsert(
    {
      user_id: userId,
      daily_calories: g.dailyCalories,
      protein_percent: g.proteinPercent,
      carbs_percent: g.carbsPercent,
      fat_percent: g.fatPercent,
      min_protein_grams: g.minProteinGrams,
      updated_at: g.updatedAt,
    },
    { onConflict: 'user_id' }
  )
  if (error) throw new Error(`goals push: ${error.message}`)
  return 1
}

async function pullGoals(since: string | undefined): Promise<number> {
  let q = supabase.from('goals').select('*')
  if (since) q = q.gt('updated_at', since)

  const { data, error } = await q.maybeSingle()
  if (error) throw new Error(`goals pull: ${error.message}`)
  if (!data) return 0

  const r = data as Row
  const incoming: Goals = {
    id: 1,
    dailyCalories: n(r.daily_calories),
    proteinPercent: n(r.protein_percent),
    carbsPercent: n(r.carbs_percent),
    fatPercent: n(r.fat_percent),
    minProteinGrams: n(r.min_protein_grams),
    updatedAt: s(r.updated_at),
  }

  // Singletons cannot merge, so the most recently edited wins.
  const local = await db.goals.get(1)
  if (local && local.updatedAt > incoming.updatedAt) return 0

  await db.goals.put(incoming)
  return 1
}

async function pushProfile(userId: string, since: string | undefined): Promise<number> {
  const p = await db.profile.get(1)
  if (!p) return 0
  if (since && p.updatedAt <= since) return 0

  const { error } = await supabase.from('profile').upsert(
    {
      user_id: userId,
      name: p.name,
      folder_order: p.folderOrder ?? null,
      created_at: p.createdAt,
      updated_at: p.updatedAt,
    },
    { onConflict: 'user_id' }
  )
  if (error) throw new Error(`profile push: ${error.message}`)
  return 1
}

async function pullProfile(since: string | undefined): Promise<number> {
  let q = supabase.from('profile').select('*')
  if (since) q = q.gt('updated_at', since)

  const { data, error } = await q.maybeSingle()
  if (error) throw new Error(`profile pull: ${error.message}`)
  if (!data) return 0

  const r = data as Row
  const incoming: Profile = {
    id: 1,
    name: s(r.name),
    folderOrder: Array.isArray(r.folder_order) ? arr(r.folder_order) : undefined,
    createdAt: s(r.created_at),
    updatedAt: s(r.updated_at),
  }

  const local = await db.profile.get(1)
  if (local && local.updatedAt > incoming.updatedAt) return 0

  await db.profile.put(incoming)
  return 1
}

// ---------------------------------------------------------------------------
// The loop
// ---------------------------------------------------------------------------

export interface SyncReport {
  pushed: number
  pulled: number
  error?: string
  /** Per-table detail, useful when something goes wrong. */
  detail?: Record<string, { pushed: number; pulled: number }>
}

async function pushTable(
  t: TableSync<never>,
  userId: string,
  since: string | undefined
): Promise<number> {
  const all = await t.all()
  const changed = since ? all.filter((row) => t.updatedAt(row) > since) : all
  if (changed.length === 0) return 0

  // Batched: Supabase rejects very large payloads, and a first sync from a
  // long-standing user can be thousands of rows.
  const SIZE = 500
  for (let i = 0; i < changed.length; i += SIZE) {
    const batch = changed.slice(i, i + SIZE).map((row) => t.toRow(row, userId))
    const { error } = await supabase.from(t.name).upsert(batch)
    if (error) throw new Error(`${t.name} push: ${error.message}`)
  }

  return changed.length
}

async function pullTable(t: TableSync<never>, since: string | undefined): Promise<number> {
  let q = supabase.from(t.name).select('*')
  if (since) q = q.gt('updated_at', since)

  const { data, error } = await q
  if (error) throw new Error(`${t.name} pull: ${error.message}`)
  if (!data || data.length === 0) return 0

  await t.put(data.map((row) => t.fromRow(row as Row)) as never[])
  return data.length
}

/**
 * Push everything changed since the last sync, then pull everything changed
 * since the last sync, then move the cursor.
 *
 * Known inefficiency: on the very first sync the cursor is undefined for both
 * halves, so rows just pushed come straight back down. Harmless — bulkPut over
 * identical rows is a no-op — but it doubles the transfer once. Worth fixing
 * if a user ever has enough history for it to matter.
 */
export async function syncAll(): Promise<SyncReport> {
  const user = await getCurrentUser()
  if (!user) return { pushed: 0, pulled: 0, error: 'Not signed in' }

  const since = await getLastSyncedAt()

  // Captured before the work, not after. Anything written while syncing must
  // still look newer than the cursor, or it would never sync at all.
  const startedAt = new Date().toISOString()

  const detail: Record<string, { pushed: number; pulled: number }> = {}
  let pushed = 0
  let pulled = 0

  try {
    const gPush = await pushGoals(user.id, since)
    const pPush = await pushProfile(user.id, since)

    for (const t of TABLES) {
      const count = await pushTable(t, user.id, since)
      detail[t.name] = { pushed: count, pulled: 0 }
      pushed += count
    }

    const gPull = await pullGoals(since)
    const pPull = await pullProfile(since)

    for (const t of TABLES) {
      const count = await pullTable(t, since)
      detail[t.name].pulled = count
      pulled += count
    }

    detail.goals = { pushed: gPush, pulled: gPull }
    detail.profile = { pushed: pPush, pulled: pPull }
    pushed += gPush + pPush
    pulled += gPull + pPull

    await setLastSyncedAt(startedAt)
    return { pushed, pulled, detail }
  } catch (err) {
    // The cursor is deliberately not advanced on failure, so the next attempt
    // retries the same range rather than skipping it.
    return {
      pushed,
      pulled,
      detail,
      error: err instanceof Error ? err.message : 'Unknown sync error',
    }
  }
}

if (import.meta.env.DEV) {
  ;(window as unknown as Record<string, unknown>).upkeepSyncTest = {
    syncAll,
    peek: async (table: string) => (await supabase.from(table).select('*')).data,
    // Clears the sync cursor so the next run pushes everything from scratch.
    resetCursor: () => setLastSyncedAt(''),
  }
}