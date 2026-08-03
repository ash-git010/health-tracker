import { db } from './db'
import { getSets, startWorkout, renameWorkout, addSet, setWorkoutRoutineId } from './workouts'
import { getFolderOrder, saveFolderOrder } from './profile'
import type { Routine, RoutineExercise } from './types'

export type RoutineExerciseInput = Pick<
  RoutineExercise,
  'exerciseKey' | 'exerciseName' | 'targetSets' | 'restSeconds'
>

export const UNGROUPED = 'Routines'

export async function listRoutines(): Promise<Routine[]> {
  const routines = await db.routines.toArray()
  return routines.sort(
    (a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0) || a.name.localeCompare(b.name)
  )
}

export async function getRoutine(id: number): Promise<Routine | null> {
  const routine = await db.routines.get(id)
  return routine ?? null
}

export async function getRoutineExercises(routineId: number): Promise<RoutineExercise[]> {
  const exercises = await db.routineExercises.where('routineId').equals(routineId).toArray()
  return exercises.sort((a, b) => a.order - b.order)
}

export async function createRoutine(name: string, folder?: string): Promise<number> {
  const all = await db.routines.toArray()
  const maxOrder = all.reduce((m, r) => Math.max(m, r.sortOrder ?? 0), 0)

  return db.routines.add({
    name,
    folder: folder || undefined,
    sortOrder: maxOrder + 1,
    createdAt: new Date().toISOString(),
  })
}

export async function updateRoutine(
  id: number,
  changes: Partial<Pick<Routine, 'name' | 'folder' | 'sortOrder'>>
): Promise<void> {
  await db.routines.update(id, changes)
}

export async function deleteRoutine(id: number): Promise<void> {
  await db.transaction('rw', [db.routines, db.routineExercises], async () => {
    await db.routineExercises.where('routineId').equals(id).delete()
    await db.routines.delete(id)
  })
}

/** Swap sortOrder with the adjacent routine in the same folder. */
export async function moveRoutine(id: number, direction: -1 | 1): Promise<void> {
  const all = await listRoutines()
  const routine = all.find((r) => r.id === id)
  if (!routine) return

  const siblings = all.filter((r) => (r.folder || '') === (routine.folder || ''))
  const index = siblings.findIndex((r) => r.id === id)
  const target = siblings[index + direction]
  if (!target) return

  const a = routine.sortOrder ?? 0
  const b = target.sortOrder ?? 0

  await db.transaction('rw', db.routines, async () => {
    await db.routines.update(routine.id!, { sortOrder: b })
    await db.routines.update(target.id!, { sortOrder: a })
  })
}

export async function moveRoutineToFolder(id: number, folder: string | undefined): Promise<void> {
  await db.routines.update(id, { folder: folder || undefined })
}

export async function setRoutineExercises(
  routineId: number,
  exercises: RoutineExerciseInput[]
): Promise<void> {
  await db.transaction('rw', db.routineExercises, async () => {
    await db.routineExercises.where('routineId').equals(routineId).delete()
    await db.routineExercises.bulkAdd(exercises.map((ex, order) => ({ ...ex, routineId, order })))
  })
}

export async function saveWorkoutAsRoutine(
  workoutId: number,
  name: string,
  folder?: string
): Promise<number> {
  const sets = await getSets(workoutId)

  const exercises: RoutineExerciseInput[] = []
  const seen = new Map<string, RoutineExerciseInput>()

  for (const set of sets) {
    const existing = seen.get(set.exerciseKey)
    if (existing) {
      existing.targetSets += 1
    } else {
      const entry: RoutineExerciseInput = {
        exerciseKey: set.exerciseKey,
        exerciseName: set.exerciseName,
        targetSets: 1,
        restSeconds: set.restSeconds ?? 90,
      }
      seen.set(set.exerciseKey, entry)
      exercises.push(entry)
    }
  }

  const routineId = await createRoutine(name, folder)
  await setRoutineExercises(routineId, exercises)
  await setWorkoutRoutineId(workoutId, routineId)
  return routineId
}

export async function startWorkoutFromRoutine(routineId: number): Promise<number> {
  const routine = await getRoutine(routineId)
  const exercises = await getRoutineExercises(routineId)

  const workoutId = await startWorkout(routineId)
  if (routine?.name) await renameWorkout(workoutId, routine.name)

  for (const ex of exercises) {
    await addSet({
      workoutId,
      exerciseKey: ex.exerciseKey,
      exerciseName: ex.exerciseName,
      order: ex.order,
      setNumber: 1,
      weightKg: 0,
      reps: 0,
      type: 'normal',
      restSeconds: ex.restSeconds,
    })
  }

  return workoutId
}

export async function routineFolders(): Promise<string[]> {
  const routines = await db.routines.toArray()
  const present = [...new Set(routines.map((r) => r.folder).filter((f): f is string => !!f))]
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
    const missing = all.filter((r) => typeof r.sortOrder !== 'number')
    if (missing.length === 0) return

    const maxOrder = all.reduce((m, r) => Math.max(m, r.sortOrder ?? 0), 0)
    const sorted = missing.sort((a, b) => a.name.localeCompare(b.name))

    for (let i = 0; i < sorted.length; i++) {
      await db.routines.update(sorted[i].id!, { sortOrder: maxOrder + i + 1 })
    }
  } catch (err) {
    console.error('sortOrder backfill failed:', err)
  }
}