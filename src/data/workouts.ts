import { db } from './db'
import { todayISO } from './dates'
import { newId, now, isLive } from './ids'
import type { Workout, WorkoutSet, SetType } from './types'

export async function startWorkout(
  routineId?: string,
  programDayId?: string
): Promise<string> {
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
    // Stamped only when the workout came from a program schedule. An empty
    // workout that happens to resemble Pull day does not claim to be it, which
    // is what keeps "was this day done" answerable rather than guessed.
    ...(programDayId ? { programDayId } : {}),
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

/** Which scheduled days already have a finished workout on or after `sinceISO`
 *  — the current schedule week's start. A repeating program reuses the same
 *  ProgramDay id every cycle, so this must be scoped to the current week
 *  rather than "was this day ever done". */
export async function completedProgramDaysSince(sinceISO: string): Promise<Set<string>> {
  const all = await db.workouts.toArray()
  const ids = new Set<string>()
  for (const w of all) {
    if (isLive(w) && w.finishedAt && w.programDayId && w.date >= sinceISO) {
      ids.add(w.programDayId)
    }
  }
  return ids
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
  rpe?: number
  notes?: string
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
  changes: Partial<Pick<WorkoutSet, 'weightKg' | 'reps' | 'type' | 'rpe' | 'notes' | 'completed'>>
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

// RPE is a per-exercise guideline, but there is no per-exercise row to hang it
// on — an exercise in a workout is just a group of sets. Same approach as
// restSeconds: write it to every set, read it from the first.
export async function setRpeForExercise(
  workoutId: string,
  exerciseKey: string,
  rpe: number | undefined
): Promise<void> {
  await db.workoutSets
    .where('workoutId')
    .equals(workoutId)
    .filter((s) => s.exerciseKey === exerciseKey && isLive(s))
    .modify({ rpe, updatedAt: now() })
}

// Same shape as setRpeForExercise, and for the same reason: a note belongs to
// the exercise, not to one set, but there is no per-exercise row to put it on.
// Write to every set, read from the first.
export async function setNotesForExercise(
  workoutId: string,
  exerciseKey: string,
  notes: string | undefined
): Promise<void> {
  await db.workoutSets
    .where('workoutId')
    .equals(workoutId)
    .filter((s) => s.exerciseKey === exerciseKey && isLive(s))
    .modify({ notes, updatedAt: now() })
}

/**
 * Renames every set of `oldKey` to the new exercise and zeroes weight —
 * a different movement has no valid "previous" load, so carrying the old
 * number forward would read as a real lift on the wrong exercise. `reps`
 * is left alone: it's the exercise-agnostic set/rep target from the routine
 * (e.g. "3x10"), not a performance number, so it stays useful after a swap.
 * Needs no special case in diffWorkoutAgainstRoutine: it already reads an
 * exerciseKey change as "removed X, added Y" by comparing the two exercise
 * maps.
 */
export async function swapExerciseInWorkout(
  workoutId: string,
  oldExerciseKey: string,
  newExercise: { key: string; name: string }
): Promise<void> {
  await db.workoutSets
    .where('workoutId')
    .equals(workoutId)
    .filter((s) => s.exerciseKey === oldExerciseKey && isLive(s))
    .modify({
      exerciseKey: newExercise.key,
      exerciseName: newExercise.name,
      weightKg: 0,
      completed: false,
      updatedAt: now(),
    })
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