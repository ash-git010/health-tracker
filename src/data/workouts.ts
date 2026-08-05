import { db } from './db'
import { todayISO } from './dates'
import { newId, now, isLive } from './ids'
import type { Workout, WorkoutSet, SetType } from './types'

export async function startWorkout(routineId?: string): Promise<string> {
  const timestamp = now()
  const id = newId()
  await db.workouts.add({
    id,
    date: todayISO(),
    name: '',
    startedAt: timestamp,
    createdAt: timestamp,
    updatedAt: timestamp,
    ...(routineId ? { routineId } : {}),
  })
  return id
}

export async function setWorkoutRoutineId(id: string, routineId: string): Promise<void> {
  await db.workouts.update(id, { routineId, updatedAt: now() })
}

export async function finishWorkout(
  id: string,
  changes: { name: string; notes?: string }
): Promise<void> {
  const timestamp = now()
  await db.workouts.update(id, {
    name: changes.name,
    notes: changes.notes,
    finishedAt: timestamp,
    updatedAt: timestamp,
  })
}

export function defaultWorkoutName(): string {
  const h = new Date().getHours()
  if (h < 11) return 'Morning workout'
  if (h < 17) return 'Afternoon workout'
  return 'Evening workout'
}

export async function getWorkout(id: string): Promise<Workout | null> {
  const workout = await db.workouts.get(id)
  return workout && isLive(workout) ? workout : null
}

export async function listWorkouts(limit = 50): Promise<Workout[]> {
  // Filter before limiting — otherwise tombstones eat into the count.
  const all = await db.workouts.orderBy('date').reverse().filter(isLive).limit(limit).toArray()
  return all
}

export async function getWorkoutsByIds(ids: string[]): Promise<Workout[]> {
  const found = await db.workouts.bulkGet([...new Set(ids)])
  return found.filter((w): w is Workout => w !== undefined && isLive(w))
}

export async function activeWorkout(): Promise<Workout | null> {
  const all = await db.workouts.toArray()
  return (
    all
      .filter((w) => isLive(w) && !w.finishedAt)
      .sort((a, b) => b.startedAt.localeCompare(a.startedAt))[0] ?? null
  )
}

export async function deleteWorkout(id: string): Promise<void> {
  const timestamp = now()
  await db.transaction('rw', [db.workouts, db.workoutSets], async () => {
    // Cascade by hand: soft deletes can't rely on foreign keys.
    await db.workoutSets
      .where('workoutId')
      .equals(id)
      .modify({ deletedAt: timestamp, updatedAt: timestamp })
    await db.workouts.update(id, { deletedAt: timestamp, updatedAt: timestamp })
  })
}

export async function renameWorkout(id: string, name: string): Promise<void> {
  await db.workouts.update(id, { name, updatedAt: now() })
}

export async function removeExerciseFromWorkout(
  workoutId: string,
  exerciseKey: string
): Promise<void> {
  const timestamp = now()
  await db.workoutSets
    .where('workoutId')
    .equals(workoutId)
    .filter((s) => s.exerciseKey === exerciseKey)
    .modify({ deletedAt: timestamp, updatedAt: timestamp })
}

export async function getSets(workoutId: string): Promise<WorkoutSet[]> {
  const sets = await db.workoutSets.where('workoutId').equals(workoutId).toArray()
  return sets
    .filter(isLive)
    .sort((a, b) => a.order - b.order || a.setNumber - b.setNumber)
}

export async function getAllSets(): Promise<WorkoutSet[]> {
  const all = await db.workoutSets.toArray()
  return all.filter(isLive)
}

export async function addSet(input: {
  workoutId: string
  exerciseKey: string
  exerciseName: string
  order: number
  setNumber: number
  weightKg: number
  reps: number
  type: SetType
  restSeconds?: number
  completed?: boolean
}): Promise<string> {
  const timestamp = now()
  const id = newId()
  await db.workoutSets.add({
    ...input,
    id,
    restSeconds: input.restSeconds ?? 90,
    completed: input.completed ?? false,
    createdAt: timestamp,
    updatedAt: timestamp,
  })
  return id
}

export async function updateSet(
  id: string,
  changes: Partial<Pick<WorkoutSet, 'weightKg' | 'reps' | 'type' | 'completed'>>
): Promise<void> {
  await db.workoutSets.update(id, { ...changes, updatedAt: now() })
}

export async function deleteSet(id: string): Promise<void> {
  const timestamp = now()
  await db.workoutSets.update(id, { deletedAt: timestamp, updatedAt: timestamp })
}

export async function setRestSecondsForExercise(
  workoutId: string,
  exerciseKey: string,
  restSeconds: number
): Promise<void> {
  await db.workoutSets
    .where('workoutId')
    .equals(workoutId)
    .filter((s) => s.exerciseKey === exerciseKey && isLive(s))
    .modify({ restSeconds, updatedAt: now() })
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
  excludeWorkoutId?: string
): Promise<WorkoutSet[]> {
  const all = await db.workoutSets.where('exerciseKey').equals(exerciseKey).toArray()

  const previous = all
    .filter((s) => isLive(s) && s.workoutId !== excludeWorkoutId && isSetCompleted(s))
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