import { db } from './db'
import { completedSets } from './workouts'
import { isLive } from './ids'
import type { Workout, WorkoutSet } from './types'

function round1(n: number): number {
  return Math.round(n * 10) / 10
}

export function epley1RM(weightKg: number, reps: number): number {
  if (reps < 1) return 0
  return round1(weightKg * (1 + reps / 30))
}

export function weightForReps(oneRM: number, reps: number): number {
  return round1(oneRM / (1 + reps / 30))
}

export async function getSetsForExercise(exerciseKey: string): Promise<WorkoutSet[]> {
  const all = await db.workoutSets.where('exerciseKey').equals(exerciseKey).toArray()
  return completedSets(all.filter(isLive))
}

export interface ExercisePR {
  value: number
  date: string
  workoutId: string
  detail: string
}

export interface ExercisePRs {
  oneRM: ExercisePR | null
  maxWeight: ExercisePR | null
  maxReps: ExercisePR | null
  maxWorkoutVolume: ExercisePR | null
  maxSetVolume: ExercisePR | null
}

function setDetail(set: WorkoutSet): string {
  return `${set.weightKg}kg × ${set.reps} reps`
}

export function exercisePRs(sets: WorkoutSet[], workouts: Workout[]): ExercisePRs {
  const workoutById = new Map(workouts.map((w) => [w.id, w]))

  let oneRM: ExercisePR | null = null
  let maxWeight: ExercisePR | null = null
  let maxReps: ExercisePR | null = null
  let maxSetVolume: ExercisePR | null = null

  const volumeByWorkout = new Map<string, number>()
  const setCountByWorkout = new Map<string, number>()

  for (const s of sets) {
    const workout = workoutById.get(s.workoutId)
    if (!workout) continue

    const est = epley1RM(s.weightKg, s.reps)
    if (!oneRM || est > oneRM.value) {
      oneRM = { value: est, date: workout.date, workoutId: s.workoutId, detail: setDetail(s) }
    }

    if (!maxWeight || s.weightKg > maxWeight.value) {
      maxWeight = { value: s.weightKg, date: workout.date, workoutId: s.workoutId, detail: setDetail(s) }
    }

    if (!maxReps || s.reps > maxReps.value) {
      maxReps = { value: s.reps, date: workout.date, workoutId: s.workoutId, detail: setDetail(s) }
    }

    const setVolume = s.weightKg * s.reps
    if (!maxSetVolume || setVolume > maxSetVolume.value) {
      maxSetVolume = { value: setVolume, date: workout.date, workoutId: s.workoutId, detail: setDetail(s) }
    }

    volumeByWorkout.set(s.workoutId, (volumeByWorkout.get(s.workoutId) ?? 0) + setVolume)
    setCountByWorkout.set(s.workoutId, (setCountByWorkout.get(s.workoutId) ?? 0) + 1)
  }

  let maxWorkoutVolume: ExercisePR | null = null
  for (const [workoutId, volume] of volumeByWorkout) {
    const workout = workoutById.get(workoutId)
    if (!workout) continue
    if (!maxWorkoutVolume || volume > maxWorkoutVolume.value) {
      const count = setCountByWorkout.get(workoutId) ?? 0
      maxWorkoutVolume = {
        value: volume,
        date: workout.date,
        workoutId,
        detail: `${count} set${count === 1 ? '' : 's'}`,
      }
    }
  }

  return { oneRM, maxWeight, maxReps, maxWorkoutVolume, maxSetVolume }
}

export interface LifetimeStats {
  workouts: number
  totalSets: number
  totalReps: number
  totalVolume: number
}

export function lifetimeStats(sets: WorkoutSet[], workouts: Workout[]): LifetimeStats {
  const validWorkoutIds = new Set(workouts.map((w) => w.id))
  const relevantWorkoutIds = new Set(
    sets.map((s) => s.workoutId).filter((id) => validWorkoutIds.has(id))
  )

  return {
    workouts: relevantWorkoutIds.size,
    totalSets: sets.length,
    totalReps: sets.reduce((sum, s) => sum + s.reps, 0),
    totalVolume: sets.reduce((sum, s) => sum + s.weightKg * s.reps, 0),
  }
}

export interface PerformanceRow {
  reps: number
  weight: number
  percent: number
}

export function performanceTable(oneRM: number): PerformanceRow[] {
  const rows: PerformanceRow[] = []
  for (let reps = 1; reps <= 12; reps++) {
    const weight = weightForReps(oneRM, reps)
    const percent = oneRM > 0 ? Math.round((weight / oneRM) * 100) : 0
    rows.push({ reps, weight, percent })
  }
  return rows
}

export interface ProgressPoint {
  date: string
  oneRM: number
  maxWeight: number
  volume: number
}

export function progressSeries(sets: WorkoutSet[], workouts: Workout[]): ProgressPoint[] {
  const workoutById = new Map(workouts.map((w) => [w.id, w]))
  const byWorkout = new Map<string, WorkoutSet[]>()

  for (const s of sets) {
    if (!workoutById.has(s.workoutId)) continue
    const list = byWorkout.get(s.workoutId) ?? []
    list.push(s)
    byWorkout.set(s.workoutId, list)
  }

  const points: ProgressPoint[] = []
  for (const [workoutId, workoutSets] of byWorkout) {
    const workout = workoutById.get(workoutId)!
    points.push({
      date: workout.date,
      oneRM: Math.max(...workoutSets.map((s) => epley1RM(s.weightKg, s.reps))),
      maxWeight: Math.max(...workoutSets.map((s) => s.weightKg)),
      volume: workoutSets.reduce((sum, s) => sum + s.weightKg * s.reps, 0),
    })
  }

  return points.sort((a, b) => a.date.localeCompare(b.date))
}