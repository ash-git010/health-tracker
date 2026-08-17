import { db } from './db'
import { getSets, startWorkout, renameWorkout, addSet, setWorkoutRoutineId, lastSetsFor } from './workouts'
import { getFolderOrder, saveFolderOrder } from './profile'
import { newId, now, isLive } from './ids'
import type { Routine, RoutineExercise, RoutineSet, SetType, WorkoutSet } from './types'

export type RoutineExerciseInput = Pick <
  RoutineExercise,
  'exerciseKey' | 'exerciseName' | 'targetSets' | 'restSeconds' | 'sets' | 'notes'
>

export const UNGROUPED = 'Routines'

export async function listRoutines(): Promise<Routine[]> {
  const routines = await db.routines.toArray()
  return routines
    .filter(isLive)
    .sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0) || a.name.localeCompare(b.name))
}

export async function getRoutine(id: string): Promise<Routine | null> {
  const routine = await db.routines.get(id)
  return routine && isLive(routine) ? routine : null
}

export async function getRoutineExercises(routineId: string): Promise<RoutineExercise[]> {
  const exercises = await db.routineExercises.where('routineId').equals(routineId).toArray()
  return exercises.filter(isLive).sort((a, b) => a.order - b.order)
}

export async function createRoutine(name: string, folder?: string): Promise<string> {
  const all = await db.routines.toArray()
  const maxOrder = all.reduce((m, r) => Math.max(m, r.sortOrder ?? 0), 0)
  const timestamp = now()
  const id = newId()

  await db.routines.add({
    id,
    name,
    folder: folder || undefined,
    sortOrder: maxOrder + 1,
    createdAt: timestamp,
    updatedAt: timestamp,
  })
  return id
}

export async function updateRoutine(
  id: string,
  changes: Partial<Pick<Routine, 'name' | 'folder' | 'sortOrder' | 'notes'>>
): Promise<void> {
  await db.routines.update(id, { ...changes, updatedAt: now() })
}

export async function deleteRoutine(id: string): Promise<void> {
  const timestamp = now()
  await db.transaction('rw', [db.routines, db.routineExercises], async () => {
    await db.routineExercises
      .where('routineId')
      .equals(id)
      .modify({ deletedAt: timestamp, updatedAt: timestamp })
    await db.routines.update(id, { deletedAt: timestamp, updatedAt: timestamp })
  })
}

/** Swap sortOrder with the adjacent routine in the same folder. */
export async function moveRoutine(id: string, direction: -1 | 1): Promise<void> {
  const all = await listRoutines()
  const routine = all.find((r) => r.id === id)
  if (!routine) return

  const siblings = all.filter((r) => (r.folder || '') === (routine.folder || ''))
  const index = siblings.findIndex((r) => r.id === id)
  const target = siblings[index + direction]
  if (!target) return

  const a = routine.sortOrder ?? 0
  const b = target.sortOrder ?? 0
  const timestamp = now()

  await db.transaction('rw', db.routines, async () => {
    await db.routines.update(routine.id, { sortOrder: b, updatedAt: timestamp })
    await db.routines.update(target.id, { sortOrder: a, updatedAt: timestamp })
  })
}

export async function moveRoutineToFolder(
  id: string,
  folder: string | undefined
): Promise<void> {
  await db.routines.update(id, { folder: folder || undefined, updatedAt: now() })
}

/**
 * Reconciles by position rather than wiping and re-adding. Deleting every row
 * on each save would leave a tombstone per exercise per edit, all of which
 * would then sync.
 */
export async function setRoutineExercises(
  routineId: string,
  exercises: RoutineExerciseInput[]
): Promise<void> {
  const timestamp = now()

  await db.transaction('rw', db.routineExercises, async () => {
    const existing = (
      await db.routineExercises.where('routineId').equals(routineId).toArray()
    )
      .filter(isLive)
      .sort((a, b) => a.order - b.order)

    for (let i = 0; i < exercises.length; i++) {
      const input = exercises[i]
      const row = existing[i]

      if (row) {
        await db.routineExercises.update(row.id, {
          ...input,
          order: i,
          updatedAt: timestamp,
        })
      } else {
        await db.routineExercises.add({
          ...input,
          id: newId(),
          routineId,
          order: i,
          createdAt: timestamp,
          updatedAt: timestamp,
        })
      }
    }

    // Anything beyond the new length is gone.
    for (const row of existing.slice(exercises.length)) {
      await db.routineExercises.update(row.id, {
        deletedAt: timestamp,
        updatedAt: timestamp,
      })
    }
  })
}

export interface RoutineUpdate {
  changes: string[]
  exercises: RoutineExerciseInput[]
}

/**
 * Turns logged sets into routine targets. Warm-ups are carried into `sets` so
 * a routine can prescribe them, but excluded from targetSets — targetSets
 * means working sets, and that's what the update diff compares.
 */
function workoutExercises(sets: WorkoutSet[]): RoutineExerciseInput[] {
  const seen = new Map<string, RoutineExerciseInput>()
  const ordered: RoutineExerciseInput[] = []

  for (const set of sets) {
    const target: RoutineSet = {
      type: set.type,
      weightKg: set.weightKg || undefined,
      reps: set.reps || undefined,
      rpe: set.rpe,
    }

    const existing = seen.get(set.exerciseKey)
    if (existing) {
      existing.sets!.push(target)
      if (set.type !== 'warmup') existing.targetSets += 1
      continue
    }

    const entry: RoutineExerciseInput = {
      exerciseKey: set.exerciseKey,
      exerciseName: set.exerciseName,
      targetSets: set.type === 'warmup' ? 0 : 1,
      restSeconds: set.restSeconds ?? 90,
      sets: [target],
    }
    seen.set(set.exerciseKey, entry)
    ordered.push(entry)
  }

  return ordered
}

/**
 * What this workout would change about the routine it came from.
 * Returns null when nothing meaningful differs, which is the common case —
 * a prompt that fires every time is a prompt people stop reading.
 */
export async function diffWorkoutAgainstRoutine(
  workoutId: string,
  routineId: string
): Promise<RoutineUpdate | null> {
  const [sets, routineExercises] = await Promise.all([
    getSets(workoutId),
    getRoutineExercises(routineId),
  ])

  const current = workoutExercises(sets)
  if (current.length === 0) return null

  const before = new Map(routineExercises.map((e) => [e.exerciseKey, e]))
  const after = new Map(current.map((e) => [e.exerciseKey, e]))
  const changes: string[] = []

  for (const ex of current) {
    if (!before.has(ex.exerciseKey)) changes.push(`Added ${ex.exerciseName}`)
  }

  for (const ex of routineExercises) {
    if (!after.has(ex.exerciseKey)) changes.push(`Removed ${ex.exerciseName}`)
  }

  for (const ex of current) {
    const was = before.get(ex.exerciseKey)
    if (!was) continue
    if (was.targetSets !== ex.targetSets) {
      changes.push(`${ex.exerciseName}: ${was.targetSets} → ${ex.targetSets} sets`)
    }
    if (was.restSeconds !== ex.restSeconds) {
      changes.push(`${ex.exerciseName}: rest ${was.restSeconds}s → ${ex.restSeconds}s`)
    }
  }

  const sameOrder =
    current.length === routineExercises.length &&
    current.every((ex, i) => routineExercises[i]?.exerciseKey === ex.exerciseKey)

  if (!sameOrder && changes.length === 0) changes.push('Reordered exercises')

  return changes.length > 0 ? { changes, exercises: current } : null
}

export async function saveWorkoutAsRoutine(
  workoutId: string,
  name: string,
  folder?: string
): Promise<string> {
  const exercises = workoutExercises(await getSets(workoutId))

  const routineId = await createRoutine(name, folder)
  await setRoutineExercises(routineId, exercises)
  await setWorkoutRoutineId(workoutId, routineId)
  return routineId
}

export async function startWorkoutFromRoutine(routineId: string): Promise<string> {
  const routine = await getRoutine(routineId)
  const exercises = await getRoutineExercises(routineId)

  const workoutId = await startWorkout(routineId)
  if (routine?.name) await renameWorkout(workoutId, routine.name)

      for (const ex of exercises) {
    const targets: RoutineSet[] =
      ex.sets && ex.sets.length > 0
        ? ex.sets
        : Array.from({ length: Math.max(1, ex.targetSets) }, () => ({
            type: 'normal' as SetType,
          }))

    // Routine targets are a starting point, not a permanent prescription.
    // Once there's history for an exercise, the numbers come from what you
    // actually lifted — shown as grey hints — and the routine only decides
    // how many sets there are and which are warm-ups.
    const history = await lastSetsFor(ex.exerciseKey)
    const useTargets = history.length === 0

    for (let i = 0; i < targets.length; i++) {
      await addSet({
        workoutId,
        exerciseKey: ex.exerciseKey,
        exerciseName: ex.exerciseName,
        order: ex.order,
        setNumber: i + 1,
        weightKg: useTargets ? (targets[i].weightKg ?? 0) : 0,
        reps: useTargets ? (targets[i].reps ?? 0) : 0,
        type: targets[i].type ?? 'normal',
        restSeconds: ex.restSeconds,
      })
    }
  }

  return workoutId
}

export async function routineFolders(): Promise<string[]> {
  const routines = await db.routines.toArray()
  const present = [
    ...new Set(routines.filter(isLive).map((r) => r.folder).filter((f): f is string => !!f)),
  ]
  const saved = await getFolderOrder()

  const ordered = saved.filter((f) => present.includes(f))
  const missing = present.filter((f) => !ordered.includes(f)).sort()

  return [...ordered, ...missing]
}

export async function moveFolder(folder: string, direction: -1 | 1): Promise<void> {
  const order = await routineFolders()
  const index = order.indexOf(folder)
  const target = index + direction
  if (index === -1 || target < 0 || target >= order.length) return

  const next = [...order]
  ;[next[index], next[target]] = [next[target], next[index]]
  await saveFolderOrder(next)
}

let backfilled = false

export async function ensureSortOrders(): Promise<void> {
  if (backfilled) return
  backfilled = true

  try {
    const all = await db.routines.toArray()
    const missing = all.filter((r) => isLive(r) && typeof r.sortOrder !== 'number')
    if (missing.length === 0) return

    const maxOrder = all.reduce((m, r) => Math.max(m, r.sortOrder ?? 0), 0)
    const sorted = missing.sort((a, b) => a.name.localeCompare(b.name))

    for (let i = 0; i < sorted.length; i++) {
      await db.routines.update(sorted[i].id, {
        sortOrder: maxOrder + i + 1,
        updatedAt: now(),
      })
    }
  } catch (err) {
    console.error('sortOrder backfill failed:', err)
  }
}