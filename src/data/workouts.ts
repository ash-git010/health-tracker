import { db } from './db'
import { todayISO } from './dates'
import type { Workout, WorkoutSet, SetType } from './types'

export async function startWorkout(routineId?: number): Promise<number> {
  return db.workouts.add({
    date: todayISO(),
    name: '',
    startedAt: new Date().toISOString(),
    ...(routineId ? { routineId } : {}),
  })
}

export async function setWorkoutRoutineId(id: number, routineId: number): Promise<void> {
  await db.workouts.update(id, { routineId })
}

export async function finishWorkout(
  id: number,
  changes: { name: string; notes?: string }
): Promise<void> {
  await db.workouts.update(id, {
    name: changes.name,
    notes: changes.notes,
    finishedAt: new Date().toISOString(),
  })
}

export function defaultWorkoutName(): string {
  const h = new Date().getHours()
  if (h < 11) return 'Morning workout'
  if (h < 17) return 'Afternoon workout'
  return 'Evening workout'
}

export async function getWorkout(id: number): Promise<Workout | null> {
  const workout = await db.workouts.get(id)
  return workout ?? null
}

export async function listWorkouts(limit = 50): Promise<Workout[]> {
  const all = await db.workouts.orderBy('date').reverse().limit(limit).toArray()
  return all
}

export async function getWorkoutsByIds(ids: number[]): Promise<Workout[]> {
  const found = await db.workouts.bulkGet([...new Set(ids)])
  return found.filter((w): w is Workout => w !== undefined)
}

export async function activeWorkout(): Promise<Workout | null> {
  const all = await db.workouts.toArray()
  return (
    all
      .filter((w) => !w.finishedAt)
      .sort((a, b) => b.startedAt.localeCompare(a.startedAt))[0] ?? null
  )
}

export async function deleteWorkout(id: number): Promise<void> {
  await db.transaction('rw', [db.workouts, db.workoutSets], async () => {
    await db.workoutSets.where('workoutId').equals(id).delete()
    await db.workouts.delete(id)
  })
}

export async function renameWorkout(id: number, name: string): Promise<void> {
  await db.workouts.update(id, { name })
}

export async function removeExerciseFromWorkout(
  workoutId: number,
  exerciseKey: string
): Promise<void> {
  await db.workoutSets
    .where('workoutId')
    .equals(workoutId)
    .filter((s) => s.exerciseKey === exerciseKey)
    .delete()
}

export async function getSets(workoutId: number): Promise<WorkoutSet[]> {
  const sets = await db.workoutSets.where('workoutId').equals(workoutId).toArray()
  return sets.sort((a, b) => a.order - b.order || a.setNumber - b.setNumber)
}

export async function getAllSets(): Promise<WorkoutSet[]> {
  return db.workoutSets.toArray()
}

export async function addSet(input: {
  workoutId: number
  exerciseKey: string
  exerciseName: string
  order: number
  setNumber: number
  weightKg: number
  reps: number
  type: SetType
  restSeconds?: number
  completed?: boolean
}): Promise<number> {
  return db.workoutSets.add({
    ...input,
    restSeconds: input.restSeconds ?? 90,
    completed: input.completed ?? false,
    createdAt: new Date().toISOString(),
  })
}

export async function updateSet(
  id: number,
  changes: Partial<Pick<WorkoutSet, 'weightKg' | 'reps' | 'type' | 'completed'>>
): Promise<void> {
  await db.workoutSets.update(id, changes)
}

export async function deleteSet(id: number): Promise<void> {
  await db.workoutSets.delete(id)
}

export async function setRestSecondsForExercise(
  workoutId: number,
  exerciseKey: string,
  restSeconds: number
): Promise<void> {
  await db.workoutSets
    .where('workoutId')
    .equals(workoutId)
    .filter((s) => s.exerciseKey === exerciseKey)
    .modify({ restSeconds })
}

// Sets logged before the completed field existed have no stored value for it;
// treat that legacy `undefined` as complete so historical stats don't zero out.
export function isSetCompleted(set: WorkoutSet): boolean {
  return set.completed !== false
}

export function completedSets(sets: WorkoutSet[]): WorkoutSet[] {
  return sets.filter((s) => s.type !== 'warmup' && isSetCompleted(s))
}

export async function lastSetsFor(
  exerciseKey: string,
  excludeWorkoutId?: number
): Promise<WorkoutSet[]> {
  const all = await db.workoutSets.where('exerciseKey').equals(exerciseKey).toArray()

  const previous = all
    .filter((s) => s.workoutId !== excludeWorkoutId && isSetCompleted(s))
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))

  if (previous.length === 0) return []

  const lastWorkoutId = previous[0].workoutId
  return previous
    .filter((s) => s.workoutId === lastWorkoutId)
    .sort((a, b) => a.setNumber - b.setNumber)
}

export function workoutVolume(sets: WorkoutSet[]): number {
  return completedSets(sets).reduce((total, s) => total + s.weightKg * s.reps, 0)
}
