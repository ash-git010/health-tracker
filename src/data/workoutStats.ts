import type { Workout, WorkoutSet } from './types'
import { completedSets } from './workouts'
import { epley1RM } from './exerciseStats'
import { todayISO, addDays, toISODate } from './dates'
import { MUSCLE_GROUPS, groupFor, type MuscleGroup } from './muscleGroups'

function round1(n: number): number {
  return Math.round(n * 10) / 10
}

export interface ExerciseMuscleInfo {
  target: string
  secondary: string[]
}

export function setsPerMuscleGroup(
  sets: WorkoutSet[],
  exerciseLookup: Map<string, ExerciseMuscleInfo>,
  sinceDate: string
): Record<MuscleGroup, number> {
  const totals = Object.fromEntries(MUSCLE_GROUPS.map((g) => [g, 0])) as Record<MuscleGroup, number>

  for (const s of completedSets(sets)) {
    if (s.createdAt < sinceDate) continue
    const exercise = exerciseLookup.get(s.exerciseKey)
    if (!exercise) continue

    totals[groupFor(exercise.target)] += 1
    for (const secondary of exercise.secondary) {
      totals[groupFor(secondary)] += 0.5
    }
  }

  for (const group of MUSCLE_GROUPS) {
    totals[group] = round1(totals[group])
  }

  return totals
}

export interface CalendarDay {
  date: string
  inMonth: boolean
  hasWorkout: boolean
  count: number
}

// month is 0-indexed, matching Date.getMonth()
export function workoutCalendar(workouts: Workout[], year: number, month: number): CalendarDay[] {
  const counts = new Map<string, number>()
  for (const w of workouts) {
    counts.set(w.date, (counts.get(w.date) ?? 0) + 1)
  }

  const firstOfMonth = new Date(year, month, 1)
  const leadingDays = (firstOfMonth.getDay() + 6) % 7 // Monday-start offset

  const lastOfMonth = new Date(year, month + 1, 0)
  const trailingDays = (7 - ((lastOfMonth.getDay() + 6) % 7) - 1 + 7) % 7

  const start = new Date(year, month, 1 - leadingDays)
  const totalDays = leadingDays + lastOfMonth.getDate() + trailingDays

  const days: CalendarDay[] = []
  for (let i = 0; i < totalDays; i++) {
    const d = new Date(start)
    d.setDate(start.getDate() + i)
    const iso = toISODate(d)
    const count = counts.get(iso) ?? 0
    days.push({ date: iso, inMonth: d.getMonth() === month, hasWorkout: count > 0, count })
  }

  return days
}

function mondayOf(iso: string): string {
  const d = new Date(iso + 'T12:00:00')
  const offset = (d.getDay() + 6) % 7
  d.setDate(d.getDate() - offset)
  return toISODate(d)
}

export function weekStreak(workouts: Workout[]): number {
  const weeksWithWorkout = new Set(workouts.map((w) => mondayOf(w.date)))
  if (weeksWithWorkout.size === 0) return 0

  let cursor = mondayOf(todayISO())
  if (!weeksWithWorkout.has(cursor)) {
    cursor = addDays(cursor, -7)
  }

  let streak = 0
  while (weeksWithWorkout.has(cursor)) {
    streak++
    cursor = addDays(cursor, -7)
  }

  return streak
}

export interface VolumePoint {
  date: string
  volume: number
  duration: number
  sets: number
}

export function volumeSeries(workouts: Workout[], sets: WorkoutSet[], days: number): VolumePoint[] {
  const cutoff = addDays(todayISO(), -days)
  const relevantWorkouts = workouts.filter((w) => w.date >= cutoff)

  const setsByWorkout = new Map<string, WorkoutSet[]>()
  for (const s of sets) {
    const list = setsByWorkout.get(s.workoutId) ?? []
    list.push(s)
    setsByWorkout.set(s.workoutId, list)
  }

  const byDate = new Map<string, VolumePoint>()
  for (const w of relevantWorkouts) {
    const workoutSets = completedSets(setsByWorkout.get(w.id) ?? [])
    const volume = workoutSets.reduce((sum, s) => sum + s.weightKg * s.reps, 0)
    const duration = w.finishedAt
      ? (new Date(w.finishedAt).getTime() - new Date(w.startedAt).getTime()) / 60000
      : 0

    const point = byDate.get(w.date) ?? { date: w.date, volume: 0, duration: 0, sets: 0 }
    point.volume += volume
    point.duration += duration
    point.sets += workoutSets.length
    byDate.set(w.date, point)
  }

  return [...byDate.values()]
    .map((p) => ({ ...p, volume: round1(p.volume), duration: Math.round(p.duration) }))
    .sort((a, b) => a.date.localeCompare(b.date))
}

export interface PRResult {
  exerciseKey: string
  exerciseName: string
  date: string
  weightKg: number
  reps: number
  oneRM: number
}

export function recentPRs(sets: WorkoutSet[], workouts: Workout[], limit: number): PRResult[] {
  const workoutById = new Map(workouts.map((w) => [w.id, w]))
  const relevant = completedSets(sets).filter((s) => workoutById.has(s.workoutId))

  const ordered = [...relevant].sort((a, b) => {
    const dateCompare = workoutById
      .get(a.workoutId)!
      .date.localeCompare(workoutById.get(b.workoutId)!.date)
    return dateCompare || a.createdAt.localeCompare(b.createdAt)
  })

  const bestByExercise = new Map<string, number>()
  const prs: PRResult[] = []

  for (const s of ordered) {
    const oneRM = epley1RM(s.weightKg, s.reps)
    const best = bestByExercise.get(s.exerciseKey) ?? 0
    if (oneRM <= best) continue

    bestByExercise.set(s.exerciseKey, oneRM)
    prs.push({
      exerciseKey: s.exerciseKey,
      exerciseName: s.exerciseName,
      date: workoutById.get(s.workoutId)!.date,
      weightKg: s.weightKg,
      reps: s.reps,
      oneRM,
    })
  }

  return prs.slice(-limit).reverse()
}