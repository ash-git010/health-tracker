import { supabase } from './supabase'
import { db } from './db'
import { getCurrentUser } from './auth'
import { getCursors, setCursors, clearCursor, clearCursors } from './syncState'
import type {
  Goals, Profile, Food, LogEntry, BodyMeasurement, Exercise, Workout, WorkoutSet,
  Routine, RoutineExercise, RoutineSet, Program, ProgramDay,
  CareRoutine, CareStep, CareDone, CareStepDone,
} from './types'
import { asSyncWrite } from './syncWrites'

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


const ROUTINE_SET_TYPES = new Set(['normal', 'warmup', 'drop', 'failure'])

/** jsonb arrives untyped. Coerce every field rather than trusting the blob. */
function routineSets(v: unknown): RoutineSet[] {
  if (!Array.isArray(v)) return []
  return v.map((raw) => {
    const item = (raw ?? {}) as Record<string, unknown>
    const type = String(item.type ?? 'normal')
    return {
      type: (ROUTINE_SET_TYPES.has(type) ? type : 'normal') as RoutineSet['type'],
      weightKg: on(item.weightKg),
      reps: on(item.reps),
      repsMin: on(item.repsMin),
      repsMax: on(item.repsMax),
      rpe: on(item.rpe),
    }
  })
}

/**
 * jsonb arrives untyped. Keys are week numbers as strings, because JSON object
 * keys always are; values are free text. Anything that is not a plain object
 * becomes an empty one rather than throwing — a malformed blob should cost a
 * note, not a whole sync.
 */
function weekNotes(v: unknown): Record<string, string> {
  if (!v || typeof v !== 'object' || Array.isArray(v)) return {}
  const out: Record<string, string> = {}
  for (const [week, note] of Object.entries(v as Record<string, unknown>)) {
    if (note === null || note === undefined) continue
    out[week] = String(note)
  }
  return out
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
    program_day_id: w.programDayId || null,
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
    programDayId: os(r.program_day_id),
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
    rpe: w.rpe ?? null,
    notes: w.notes ?? null,
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
    rpe: on(r.rpe),
    notes: os(r.notes),
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
    notes: r.notes ?? null,
    created_at: r.createdAt,
    updated_at: r.updatedAt,
    deleted_at: r.deletedAt ?? null,
  }),
  fromRow: (r) => ({
    id: s(r.id),
    name: s(r.name),
    folder: os(r.folder),
    sortOrder: on(r.sort_order),
    notes: os(r.notes),
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
    notes: r.notes ?? null,
    sets: r.sets ?? [],
    substitutes: r.substitutes ?? [],
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
    notes: os(r.notes),
    sets: routineSets(r.sets),
    substitutes: arr(r.substitutes),
    createdAt: s(r.created_at),
    updatedAt: s(r.updated_at),
    deletedAt: os(r.deleted_at),
  }),
}

// program_id carries a real composite foreign key with cascade — a day without
// its program is meaningless. routine_id does not, matching workouts.routine_id:
// deleting a routine must not punch a hole in a schedule that referenced it.
const programs: TableSync<Program> = {
  name: 'programs',
  all: () => db.programs.toArray(),
  put: (rows) => db.programs.bulkPut(rows),
  updatedAt: (p) => p.updatedAt,
  toRow: (p, userId) => ({
    id: p.id,
    user_id: userId,
    name: p.name,
    notes: p.notes ?? null,
    repeats: p.repeats ?? false,
    is_active: p.isActive ?? false,
    started_on: p.startedOn ?? null,
    week_notes: p.weekNotes ?? {},
    sort_order: p.sortOrder ?? null,
    created_at: p.createdAt,
    updated_at: p.updatedAt,
    deleted_at: p.deletedAt ?? null,
  }),
  fromRow: (r) => ({
    id: s(r.id),
    name: s(r.name),
    notes: os(r.notes),
    repeats: Boolean(r.repeats),
    isActive: Boolean(r.is_active),
    startedOn: os(r.started_on),
    weekNotes: weekNotes(r.week_notes),
    sortOrder: on(r.sort_order),
    createdAt: s(r.created_at),
    updatedAt: s(r.updated_at),
    deletedAt: os(r.deleted_at),
  }),
}

const programDays: TableSync<ProgramDay> = {
  name: 'program_days',
  all: () => db.programDays.toArray(),
  put: (rows) => db.programDays.bulkPut(rows),
  updatedAt: (d) => d.updatedAt,
  toRow: (d, userId) => ({
    id: d.id,
    user_id: userId,
    program_id: d.programId,
    week: d.week,
    // day_index rather than sort_order: this is a semantic position 1–7 inside
    // a week, not the generic ordering that rename rule was written for.
    day_index: d.dayIndex,
    routine_id: d.routineId || null,
    created_at: d.createdAt,
    updated_at: d.updatedAt,
    deleted_at: d.deletedAt ?? null,
  }),
  fromRow: (r) => ({
    id: s(r.id),
    programId: s(r.program_id),
    week: n(r.week),
    dayIndex: n(r.day_index),
    routineId: os(r.routine_id),
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

// Parents before children. workout_sets, routine_exercises, program_days,
// care_steps, care_done_log and care_step_done all carry real foreign keys.
const TABLES: TableSync<never>[] = [
  foods,
  logEntries,
  measurements,
  customExercises,
  routines,
  routineExercises,
  programs,
  programDays,
  workouts,
  workoutSets,
  careRoutines,
  careSteps,
  careDoneLog,
  careStepDone,
] as unknown as TableSync<never>[]

/**
 * Server table names in push order. Exported so adopt.ts can iterate the same
 * set without keeping a second copy that could drift out of step.
 */
export const SYNC_TABLE_NAMES: string[] = TABLES.map((t) => t.name)

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

export async function pullGoals(since: string | undefined): Promise<number> {
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

    // Singletons cannot merge, so the most recently edited wins. Compare
  // instants, not strings: Postgres returns '+00:00' where toISOString() gives
  // 'Z', and 'Z' sorts after '+' as text, so two identical moments compare
  // unequal. NaN from an unparseable value falls through to the write, which is
  // the safe direction — the server copy wins.
  const local = await db.goals.get(1)
  if (local && Date.parse(local.updatedAt) > Date.parse(incoming.updatedAt)) return 0

  await asSyncWrite(() => db.goals.put(incoming))
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

export async function pullProfile(since: string | undefined): Promise<number> {
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

  // See pullGoals — compare instants, not strings.
  const local = await db.profile.get(1)
  if (local && Date.parse(local.updatedAt) > Date.parse(incoming.updatedAt)) return 0

  await asSyncWrite(() => db.profile.put(incoming))
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
    // The conflict target must name both primary key columns. Server PKs are
    // (user_id, id): a device that synced with one account carries those UUIDs
    // into the next, and matching on id alone turned the insert into an update
    // of another user's row, which RLS refused with a 403. Left implicit this
    // happens to work, because PostgREST infers the primary key — but the
    // inference is invisible and the failure it would cause is not obvious.
    const { error } = await supabase
      .from(t.name)
      .upsert(batch, { onConflict: 'user_id,id' })
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

  await asSyncWrite(() => t.put(data.map((row) => t.fromRow(row as Row)) as never[]))
  return data.length
}

/**
 * Push everything changed since the last sync, then pull everything changed
 * since the last sync, then move each table's cursor.
 *
 * Cursors are per table. A single global timestamp could not express "foods
 * are current, care routines have never synced": on a partially-synced account
 * the parents were filtered out as already-sent while the children were not,
 * and the children were rejected for violating their foreign keys.
 *
 * The invariant that prevents that here: a table's cursor advances only after
 * that table's pull has completed, and pushes all run before any pull. So a
 * cursor can never have moved past rows that failed to reach the server.
 *
 * Known inefficiency: on a table's very first sync the cursor is undefined for
 * both halves, so rows just pushed come straight back down. Harmless — bulkPut
 * over identical rows is a no-op — but it doubles the transfer once.
 */
export async function syncAll(): Promise<SyncReport> {
  const user = await getCurrentUser()
  if (!user) return { pushed: 0, pulled: 0, error: 'Not signed in' }

  const cursors = await getCursors()

  // Captured before the work, not after. Anything written while syncing must
  // still look newer than the cursor, or it would never sync at all.
  const startedAt = new Date().toISOString()

  // Accumulated in memory and written once in `finally`, so a failure halfway
  // through still keeps the progress of the tables that finished. Tables that
  // never got there keep their old cursor and retry the same range next time.
  const next: Record<string, string> = {}

  const detail: Record<string, { pushed: number; pulled: number }> = {}
  let pushed = 0
  let pulled = 0

  try {
    const gPush = await pushGoals(user.id, cursors.goals)
    const pPush = await pushProfile(user.id, cursors.profile)

    // Parents before children — see the TABLES comment.
    for (const t of TABLES) {
      const count = await pushTable(t, user.id, cursors[t.name])
      detail[t.name] = { pushed: count, pulled: 0 }
      pushed += count
    }

    const gPull = await pullGoals(cursors.goals)
    next.goals = startedAt
    const pPull = await pullProfile(cursors.profile)
    next.profile = startedAt

    for (const t of TABLES) {
      const count = await pullTable(t, cursors[t.name])
      detail[t.name].pulled = count
      pulled += count
      next[t.name] = startedAt
    }

    detail.goals = { pushed: gPush, pulled: gPull }
    detail.profile = { pushed: pPush, pulled: pPull }
    pushed += gPush + pPush
    pulled += gPull + pPull

    return { pushed, pulled, detail }
  } catch (err) {
    return {
      pushed,
      pulled,
      detail,
      error: err instanceof Error ? err.message : 'Unknown sync error',
    }
  } finally {
    if (Object.keys(next).length > 0) await setCursors(next)
  }
}

if (import.meta.env.DEV) {
  ;(window as unknown as Record<string, unknown>).upkeepSyncTest = {
    syncAll,
    peek: async (table: string) => (await supabase.from(table).select('*')).data,
    // Inspect what each table thinks it has synced.
    cursors: getCursors,
    // Force one table to resync from scratch — the targeted version of the old
    // resetCursor, useful when a single table's foreign keys are misbehaving.
    resetCursor: clearCursor,
    // Force everything to resync from scratch.
    resetCursors: clearCursors,
  }
}