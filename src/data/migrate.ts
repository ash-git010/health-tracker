import Dexie from 'dexie'
import { db as oldDb } from './db-old'
import { db } from './db'
import type * as New from './types'

const OLD_DB_NAME = 'HealthTrackerDB'
const MIGRATION_KEY = 'main'

const uuid = () => crypto.randomUUID()

// Old rows have no updatedAt. Seed it from createdAt where one exists, so the
// first sync push doesn't treat every historical row as freshly edited.
const stamp = (createdAt?: string) => createdAt ?? new Date().toISOString()

/**
 * One-time move from HealthTrackerDB (auto-increment integer keys) to
 * UpkeepDB (device-minted UUIDs, sync fields, split care-step rows).
 *
 * Safe to call on every app start: it no-ops if already run or if there is
 * no old database. The old database is left in place as a safety net.
 */
export async function migrateIfNeeded(): Promise<void> {
  const state = await db.syncState.get(MIGRATION_KEY)
  if (state?.migratedAt) return

  // Fresh install — nothing to migrate, just mark it done.
  if (!(await Dexie.exists(OLD_DB_NAME))) {
    await db.syncState.put({ key: MIGRATION_KEY, migratedAt: new Date().toISOString() })
    return
  }

  await oldDb.open()

  // --- Read everything out of the old database ---------------------------

  const [
    oldGoals, oldProfile, oldFoods, oldEntries, oldMeasurements,
    oldExercises, oldWorkouts, oldSets, oldRoutines, oldRoutineExercises,
    oldCareRoutines, oldCareSteps, oldCareDone,
  ] = await Promise.all([
    oldDb.goals.toArray(),
    oldDb.profile.toArray(),
    oldDb.foods.toArray(),
    oldDb.logEntries.toArray(),
    oldDb.measurements.toArray(),
    oldDb.exercises.toArray(),
    oldDb.workouts.toArray(),
    oldDb.workoutSets.toArray(),
    oldDb.routines.toArray(),
    oldDb.routineExercises.toArray(),
    oldDb.careRoutines.toArray(),
    oldDb.careSteps.toArray(),
    oldDb.careDoneLog.toArray(),
  ])

  // Nothing to bring across — mark done and leave.
  const isEmpty =
    oldFoods.length === 0 && oldEntries.length === 0 && oldMeasurements.length === 0 &&
    oldWorkouts.length === 0 && oldCareRoutines.length === 0 && oldRoutines.length === 0
  if (isEmpty) {
    await db.syncState.put({ key: MIGRATION_KEY, migratedAt: new Date().toISOString() })
    return
  }

  // --- Build old-id -> new-uuid maps, one per table ----------------------
  //
  // Every map must be built before any row is transformed, because rows
  // reference each other and a reference may point forwards.

  const map = <T extends { id?: number }>(rows: T[]) => {
    const m = new Map<number, string>()
    for (const r of rows) if (r.id != null) m.set(r.id, uuid())
    return m
  }

  const foodIds = map(oldFoods)
  const entryIds = map(oldEntries)
  const measurementIds = map(oldMeasurements)
  const exerciseIds = map(oldExercises)
  const workoutIds = map(oldWorkouts)
  const setIds = map(oldSets)
  const routineIds = map(oldRoutines)
  const routineExerciseIds = map(oldRoutineExercises)
  const careRoutineIds = map(oldCareRoutines)
  const careStepIds = map(oldCareSteps)
  const careDoneIds = map(oldCareDone)

  // Custom exercises are referenced by the string key `custom:<numeric id>`,
  // baked into every WorkoutSet and RoutineExercise. Those strings have to be
  // rewritten to point at the new UUIDs. Seed keys come from the bundled JSON
  // and are left exactly as they are.
  const rewriteKey = (key: string): string => {
    if (!key.startsWith('custom:')) return key
    const oldId = Number(key.slice(7))
    const newId = exerciseIds.get(oldId)
    return newId ? `custom:${newId}` : key
  }

  // --- Transform ---------------------------------------------------------

  const foods: New.Food[] = oldFoods.map((f) => ({
    ...f,
    id: foodIds.get(f.id!)!,
    updatedAt: stamp(f.createdAt),
  }))

  const logEntries: New.LogEntry[] = oldEntries.map((e) => ({
    ...e,
    id: entryIds.get(e.id!)!,
    // '' means the food it referenced no longer exists. Harmless: macros are
    // snapshotted on the entry itself.
    foodId: foodIds.get(e.foodId) ?? '',
    updatedAt: stamp(e.createdAt),
  }))

  const measurements: New.BodyMeasurement[] = oldMeasurements.map((m) => ({
    ...m,
    id: measurementIds.get(m.id!)!,
    updatedAt: stamp(m.createdAt),
  }))

  const exercises: New.Exercise[] = oldExercises.map((e) => ({
    ...e,
    id: exerciseIds.get(e.id!)!,
    updatedAt: stamp(e.createdAt),
  }))

  const workouts: New.Workout[] = oldWorkouts.map((w) => ({
    ...w,
    id: workoutIds.get(w.id!)!,
    routineId: w.routineId != null ? routineIds.get(w.routineId) : undefined,
    createdAt: w.startedAt,
    updatedAt: stamp(w.finishedAt ?? w.startedAt),
  }))

  const workoutSets: New.WorkoutSet[] = oldSets.map((s) => ({
    ...s,
    id: setIds.get(s.id!)!,
    workoutId: workoutIds.get(s.workoutId)!,
    exerciseKey: rewriteKey(s.exerciseKey),
    updatedAt: stamp(s.createdAt),
  }))

  const routines: New.Routine[] = oldRoutines.map((r) => ({
    ...r,
    id: routineIds.get(r.id!)!,
    updatedAt: stamp(r.createdAt),
  }))

  const routineExercises: New.RoutineExercise[] = oldRoutineExercises.map((re) => ({
    ...re,
    id: routineExerciseIds.get(re.id!)!,
    routineId: routineIds.get(re.routineId)!,
    exerciseKey: rewriteKey(re.exerciseKey),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }))

  const careRoutines: New.CareRoutine[] = oldCareRoutines.map((cr) => ({
    ...cr,
    id: careRoutineIds.get(cr.id!)!,
    updatedAt: stamp(cr.createdAt),
  }))

  const careSteps: New.CareStep[] = oldCareSteps.map((cs) => ({
    ...cs,
    id: careStepIds.get(cs.id!)!,
    careRoutineId: careRoutineIds.get(cs.careRoutineId)!,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }))

  // The split: one CareDone row keeps the per-day skip state, and every entry
  // in its old stepIds array becomes its own CareStepDone row.
  const careDoneLog: New.CareDone[] = oldCareDone.map((cd) => ({
    id: careDoneIds.get(cd.id!)!,
    date: cd.date,
    careRoutineId: careRoutineIds.get(cd.careRoutineId)!,
    skipped: cd.skipped,
    createdAt: cd.createdAt,
    updatedAt: stamp(cd.createdAt),
  }))

  const careStepDone: New.CareStepDone[] = []
  for (const cd of oldCareDone) {
    const routineId = careRoutineIds.get(cd.careRoutineId)
    if (!routineId) continue
    for (const oldStepId of cd.stepIds ?? []) {
      const stepId = careStepIds.get(oldStepId)
      // Step was deleted from the routine after being ticked — drop the tick.
      if (!stepId) continue
      careStepDone.push({
        id: uuid(),
        date: cd.date,
        careRoutineId: routineId,
        stepId,
        createdAt: cd.createdAt,
        updatedAt: stamp(cd.createdAt),
      })
    }
  }

  // Singletons keep their fixed numeric ids.
  const goals: New.Goals[] = oldGoals.map((g) => ({ ...g }))
  const profile: New.Profile[] = oldProfile.map((p) => ({
    ...p,
    updatedAt: stamp(p.createdAt),
  }))

  // --- Write, all or nothing ---------------------------------------------

  await db.transaction('rw', db.tables, async () => {
    await Promise.all([
      db.goals.bulkPut(goals),
      db.profile.bulkPut(profile),
      db.foods.bulkPut(foods),
      db.logEntries.bulkPut(logEntries),
      db.measurements.bulkPut(measurements),
      db.exercises.bulkPut(exercises),
      db.workouts.bulkPut(workouts),
      db.workoutSets.bulkPut(workoutSets),
      db.routines.bulkPut(routines),
      db.routineExercises.bulkPut(routineExercises),
      db.careRoutines.bulkPut(careRoutines),
      db.careSteps.bulkPut(careSteps),
      db.careDoneLog.bulkPut(careDoneLog),
      db.careStepDone.bulkPut(careStepDone),
    ])
    await db.syncState.put({ key: MIGRATION_KEY, migratedAt: new Date().toISOString() })
  })

  // HealthTrackerDB is deliberately left on disk. Remove it in a later
  // release once this has run cleanly on every device.
}