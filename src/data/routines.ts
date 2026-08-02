import { db } from './db'
import { getSets, startWorkout, renameWorkout, addSet, setWorkoutRoutineId } from './workouts'
import type { Routine, RoutineExercise } from './types'

export type RoutineExerciseInput = Pick<
  RoutineExercise,
  'exerciseKey' | 'exerciseName' | 'targetSets' | 'restSeconds'
>

export async function listRoutines(): Promise<Routine[]> {
  return db.routines.orderBy('name').toArray()
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
  return db.routines.add({
    name,
    folder: folder || undefined,
    createdAt: new Date().toISOString(),
  })
}

export async function updateRoutine(
  id: number,
  changes: Partial<Pick<Routine, 'name' | 'folder'>>
): Promise<void> {
  await db.routines.update(id, changes)
}

export async function deleteRoutine(id: number): Promise<void> {
  await db.transaction('rw', [db.routines, db.routineExercises], async () => {
    await db.routineExercises.where('routineId').equals(id).delete()
    await db.routines.delete(id)
  })
}

export async function setRoutineExercises(
  routineId: number,
  exercises: RoutineExerciseInput[]
): Promise<void> {
  await db.transaction('rw', db.routineExercises, async () => {
    await db.routineExercises.where('routineId').equals(routineId).delete()
    await db.routineExercises.bulkAdd(
      exercises.map((ex, order) => ({ ...ex, routineId, order }))
    )
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
  return [...new Set(routines.map((r) => r.folder).filter((f): f is string => !!f))].sort()
}
