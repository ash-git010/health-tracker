import { db } from './db'
import { todayISO } from './dates'
import type { Workout, WorkoutSet, SetType } from './types'

export async function startWorkout(name: string): Promise<number> {
  return db.workouts.add({
    date: todayISO(),
    name,
    startedAt: new Date().toISOString(),
  })
}

export async function finishWorkout(id: number): Promise<void> {
  await db.workouts.update(id, { finishedAt: new Date().toISOString() })
}

export async function getWorkout(id: number): Promise<Workout | undefined> {
  return db.workouts.get(id)
}

export async function listWorkouts(limit = 50): Promise<Workout[]> {
  const all = await db.workouts.orderBy('date').reverse().limit(limit).toArray()
  return all
}

export async function activeWorkout(): Promise<Workout | undefined> {
  const all = await db.workouts.orderBy('startedAt').reverse().limit(5).toArray()
  return all.find((w) => !w.finishedAt)
}

export async function deleteWorkout(id: number): Promise<void> {
  await db.transaction('rw', [db.workouts, db.workoutSets], async () => {
    await db.workoutSets.where('workoutId').equals(id).delete()
    await db.workouts.delete(id)
  })
}

export async function getSets(workoutId: number): Promise<WorkoutSet[]> {
  const sets = await db.workoutSets.where('workoutId').equals(workoutId).toArray()
  return sets.sort((a, b) => a.order - b.order || a.setNumber - b.setNumber)
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
}): Promise<number> {
  return db.workoutSets.add({ ...input, createdAt: new Date().toISOString() })
}

export async function updateSet(
  id: number,
  changes: Partial<Pick<WorkoutSet, 'weightKg' | 'reps' | 'type'>>
): Promise<void> {
  await db.workoutSets.update(id, changes)
}

export async function deleteSet(id: number): Promise<void> {
  await db.workoutSets.delete(id)
}

export async function lastSetsFor(
  exerciseKey: string,
  excludeWorkoutId?: number
): Promise<WorkoutSet[]> {
  const all = await db.workoutSets.where('exerciseKey').equals(exerciseKey).toArray()

  const previous = all
    .filter((s) => s.workoutId !== excludeWorkoutId)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))

  if (previous.length === 0) return []

  const lastWorkoutId = previous[0].workoutId
  return previous
    .filter((s) => s.workoutId === lastWorkoutId)
    .sort((a, b) => a.setNumber - b.setNumber)
}

export function workoutVolume(sets: WorkoutSet[]): number {
  return sets
    .filter((s) => s.type !== 'warmup')
    .reduce((total, s) => total + s.weightKg * s.reps, 0)
}