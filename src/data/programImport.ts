// Turns a Min-Max-shaped program export (docs/examples/min_max_program_12_weeks.json
// is the reference file, gitignored) into a Program, its Routines and its
// ProgramDay schedule.
//
// Split deliberately into a pure half (parseImportJson, buildProgram — no
// Dexie, testable from the console with a stub resolver) and an async half
// (importProgram — the only part that touches the database, because
// resolving an unmatched exercise name means creating a custom exercise).
//
// See docs/HANDOVER.md §12.16 (field-gap table) and the workout-rebuild plan
// for the decisions this file encodes:
//   - one Routine per distinct workout CONTENT, not one per week — a program
//     that repeats the same "Upper 1" for six weeks gets one Routine, reused
//   - last_set_intensity_technique has no field of its own; folded into notes
//   - substitution_option_1/2 resolve through the exercise library, with the
//     same common-abbreviation expansion as the primary exercise; a name that
//     still doesn't match anything gets a custom exercise minted for it too,
//     same as an unmatched primary — a suggestion the swap UI can't select
//     isn't useful, so it's never silently dropped
//   - warm-up rep counts come from the standard table, weight left empty
//   - rest takes the maximum of a written range ("1-2 min" -> 2 min); rep
//     ranges keep both ends as repsMin/repsMax

import { createProgram, setProgramDays } from './programs'
import { createRoutine, setRoutineExercises, type RoutineExerciseInput } from './routines'
import { allExercises, addCustomExercise, type ExerciseOption } from './exercises'
import { fuzzyScore } from './search'
import { t } from './i18n'
import type { RoutineSet } from './types'

export interface ImportRow {
  exercise: string
  last_set_intensity_technique?: string | null
  warm_up_sets?: string | number | null
  working_sets?: string | number | null
  rep_range?: string | number | null
  set_1_rir?: number | null
  set_2_rir?: number | null
  rest?: string | null
  substitution_option_1?: string | null
  substitution_option_2?: string | null
  notes?: string | null
}

export interface ImportWorkout {
  name: string
  rows: ImportRow[]
}

export interface ImportWeek {
  week: number
  workouts: ImportWorkout[]
}

export interface ParsedProgramJson {
  program: string
  weeks: ImportWeek[]
}

/** Validates and shapes the raw upload. Throws with a message fit to show on screen. */
export function parseImportJson(raw: unknown): ParsedProgramJson {
  if (!raw || typeof raw !== 'object') throw new Error('Not a program file.')
  const obj = raw as Record<string, unknown>

  const program = obj.program
  if (typeof program !== 'string' || !program.trim()) {
    throw new Error(t('programs.import.errMissingName'))
  }

  const rawWeeks = obj.weeks
  if (!Array.isArray(rawWeeks) || rawWeeks.length === 0) {
    throw new Error(t('programs.import.errNoWeeks'))
  }

  const weeks: ImportWeek[] = rawWeeks.map((w, wi) => {
    const week = w as Record<string, unknown>
    const weekNumber = Number(week.week)
    if (!Number.isFinite(weekNumber) || weekNumber < 1) {
      throw new Error(t('programs.import.errWeekNumber', { index: wi + 1 }))
    }

    const rawWorkouts = week.workouts
    if (!Array.isArray(rawWorkouts)) throw new Error(t('programs.import.errNoWorkouts', { week: weekNumber }))

    const workouts: ImportWorkout[] = rawWorkouts.map((w2) => {
      const workout = w2 as Record<string, unknown>
      const name = workout.name
      if (typeof name !== 'string' || !name.trim()) {
        throw new Error(t('programs.import.errWorkoutName', { week: weekNumber }))
      }

      const rawRows = workout.rows
      if (!Array.isArray(rawRows)) {
        throw new Error(t('programs.import.errNoRows', { name, week: weekNumber }))
      }

      const rows: ImportRow[] = rawRows.map((r) => {
        const row = r as Record<string, unknown>
        if (typeof row.exercise !== 'string' || !row.exercise.trim()) {
          throw new Error(t('programs.import.errRowExercise', { name, week: weekNumber }))
        }
        return row as unknown as ImportRow
      })

      return { name: name.trim(), rows }
    })

    return { week: weekNumber, workouts }
  })

  return { program: program.trim(), weeks }
}

function numberRange(raw: string | number | null | undefined): number[] {
  if (raw === null || raw === undefined) return []
  return String(raw).match(/\d+(\.\d+)?/g)?.map(Number) ?? []
}

function parseRepRange(raw: string | number | null | undefined): { repsMin?: number; repsMax?: number } {
  const nums = numberRange(raw)
  if (nums.length === 0) return {}
  return { repsMin: Math.min(...nums), repsMax: Math.max(...nums) }
}

/** Takes the minimum of a written range — "2-4" becomes 2. */
function parseWarmupCount(raw: string | number | null | undefined): number {
  const nums = numberRange(raw)
  return nums.length === 0 ? 0 : Math.round(Math.min(...nums))
}

/** Takes the maximum — the program's intended working volume, not a floor. */
function parseWorkingSets(raw: string | number | null | undefined): number {
  const nums = numberRange(raw)
  return nums.length === 0 ? 1 : Math.round(Math.max(...nums))
}

/** "1-2 min" -> 120 (the maximum of the range, in seconds). Defaults to 90s. */
function parseRestSeconds(raw: string | null | undefined): number {
  if (!raw) return 90
  const nums = numberRange(raw)
  if (nums.length === 0) return 90
  const value = Math.max(...nums)
  return Math.round(raw.toLowerCase().includes('sec') ? value : value * 60)
}

function rirToRpe(rir: number): number {
  return Math.max(1, Math.min(10, 10 - rir))
}

/** The higher of whichever RIR fields the row has, converted to the
 *  exercise's target RPE via rirToRpe(). Owner's explicit call: take the max
 *  RIR across the row's sets, not the last one specifically. */
function maxRir(row: ImportRow): number | undefined {
  const values = [row.set_1_rir, row.set_2_rir].filter(
    (v): v is number => typeof v === 'number'
  )
  return values.length > 0 ? Math.max(...values) : undefined
}

/** 1 set -> 6; 2 -> 6,4; 3 -> 6,4,3; 4 -> 6,4,3,2; above 4, pad with 2s. */
function warmupReps(count: number): number[] {
  const base = [6, 4, 3, 2]
  if (count <= 0) return []
  if (count <= 4) return base.slice(0, count)
  return [...base, ...Array(count - 4).fill(2)]
}

function rowToExerciseInput(
  row: ImportRow,
  resolve: (name: string) => { key: string; name: string } | undefined
): RoutineExerciseInput {
  const resolved = resolve(row.exercise)
  const sets: RoutineSet[] = []

  for (const reps of warmupReps(parseWarmupCount(row.warm_up_sets))) {
    sets.push({ type: 'warmup', reps })
  }

  const { repsMin, repsMax } = parseRepRange(row.rep_range)
  const rir = maxRir(row)
  const rpe = typeof rir === 'number' ? rirToRpe(rir) : undefined
  const workingCount = parseWorkingSets(row.working_sets)

  for (let i = 0; i < workingCount; i++) {
    sets.push({ type: 'normal', repsMin, repsMax, rpe })
  }

  const noteParts: string[] = []
  if (row.notes) noteParts.push(row.notes.trim())
  if (row.last_set_intensity_technique && row.last_set_intensity_technique !== 'N/A') {
    noteParts.push(`Last set: ${row.last_set_intensity_technique}.`)
  }

  const substitutes = [row.substitution_option_1, row.substitution_option_2]
    .filter((n): n is string => !!n)
    .map((name) => resolve(name)?.key)
    .filter((key): key is string => !!key)

  return {
    exerciseKey: resolved?.key ?? '',
    exerciseName: resolved?.name ?? row.exercise,
    targetSets: workingCount,
    restSeconds: parseRestSeconds(row.rest),
    sets,
    notes: noteParts.join(' ') || undefined,
    substitutes: substitutes.length > 0 ? substitutes : undefined,
  }
}

function contentHash(rows: ImportRow[]): string {
  return JSON.stringify(rows)
}

export interface BuiltRoutine {
  key: string
  name: string
  exercises: RoutineExerciseInput[]
}

export interface BuiltDay {
  week: number
  dayIndex: number
  routineKey?: string
}

export interface BuiltProgram {
  programName: string
  routines: BuiltRoutine[]
  days: BuiltDay[]
  warnings: string[]
}

/**
 * Pure: no Dexie. `resolve` is a synchronous lookup the caller pre-computes —
 * in production that means resolving every distinct exercise name against
 * the library first (creating a custom exercise for anything unmatched), so
 * this function never needs to reach into the database itself.
 */
export function buildProgram(
  parsed: ParsedProgramJson,
  resolve: (name: string) => { key: string; name: string } | undefined
): BuiltProgram {
  const routines: BuiltRoutine[] = []
  const days: BuiltDay[] = []
  const warnings: string[] = []

  // Per workout name: the hash and key of the routine most recently minted
  // for it, so identical content across consecutive weeks reuses one Routine
  // instead of a duplicate per week.
  const lastByName = new Map<string, { hash: string; key: string; variant: number }>()

  for (const week of parsed.weeks) {
    if (week.workouts.length > 7) {
      warnings.push(
        t('programs.import.warnWeekOverflow', { week: week.week, count: week.workouts.length })
      )
    }

    week.workouts.slice(0, 7).forEach((workout, dayIndex0) => {
      const hash = contentHash(workout.rows)
      const last = lastByName.get(workout.name)

      let routineKey: string
      if (last && last.hash === hash) {
        routineKey = last.key
      } else {
        const variant = (last?.variant ?? 0) + 1
        routineKey = `${workout.name}#${variant}`
        const exercises = workout.rows.map((row) => rowToExerciseInput(row, resolve))
        for (const ex of exercises) {
          if (!ex.exerciseKey) {
            warnings.push(
              t('programs.import.warnNoMatch', {
                week: week.week,
                workout: workout.name,
                exercise: ex.exerciseName,
              })
            )
          }
        }
        routines.push({
          key: routineKey,
          name: variant === 1 ? workout.name : `${workout.name} (v${variant})`,
          exercises,
        })
        lastByName.set(workout.name, { hash, key: routineKey, variant })
      }

      days.push({ week: week.week, dayIndex: dayIndex0 + 1, routineKey })
    })

    // Explicit rest days for whatever's left of the week — a missing row is
    // ambiguous between "not part of the program" and "rest"; a row with no
    // routine is unambiguous, and matches ProgramDay's own convention.
    for (let d = week.workouts.length + 1; d <= 7; d++) {
      days.push({ week: week.week, dayIndex: d })
    }
  }

  return { programName: parsed.program, routines, days, warnings }
}

const MATCH_THRESHOLD = 300

// Common gym abbreviations and spelling variants that fuzzyScore's word-level
// matching can't bridge on its own — "DB" shares no letters with "Dumbbell",
// so no near-match heuristic gets it there. Expanded on both sides of the
// comparison before scoring, so "DB Flye" resolves against "Dumbbell Fly".
const NAME_EXPANSIONS: [RegExp, string][] = [
  [/\bdb\b/gi, 'dumbbell'],
  [/\bbb\b/gi, 'barbell'],
  [/\bbar\b/gi, 'barbell'],
  [/\bkb\b/gi, 'kettlebell'],
  [/\bsm\b/gi, 'smith machine'],
  [/\bohp\b/gi, 'overhead press'],
  [/\brdl\b/gi, 'romanian deadlift'],
  [/\bflyes?\b/gi, 'fly'],
  [/\bext\b/gi, 'extension'],
  [/\bbw\b/gi, 'bodyweight'],
]

function expandName(name: string): string {
  let s = name
  for (const [pattern, replacement] of NAME_EXPANSIONS) {
    s = s.replace(pattern, replacement)
  }
  return s
}

function resolveExercise(name: string, exercises: ExerciseOption[]): ExerciseOption | undefined {
  const query = expandName(name)
  let best: ExerciseOption | undefined
  let bestScore = 0
  for (const e of exercises) {
    const score = fuzzyScore(expandName(e.name), query)
    if (score > bestScore) {
      bestScore = score
      best = e
    }
  }
  return bestScore >= MATCH_THRESHOLD ? best : undefined
}

function collectExerciseNames(parsed: ParsedProgramJson): { primary: Set<string>; substitutes: Set<string> } {
  const primary = new Set<string>()
  const substitutes = new Set<string>()
  for (const week of parsed.weeks) {
    for (const workout of week.workouts) {
      for (const row of workout.rows) {
        primary.add(row.exercise)
        if (row.substitution_option_1) substitutes.add(row.substitution_option_1)
        if (row.substitution_option_2) substitutes.add(row.substitution_option_2)
      }
    }
  }
  return { primary, substitutes }
}

export interface ExerciseMatch {
  name: string
  isSubstitute: boolean
  matched: boolean
  matchedName?: string
}

export interface ImportPreview {
  built: BuiltProgram
  matches: ExerciseMatch[]
}

/**
 * Read-only: matches every exercise name against the library without writing
 * anything, so a screen can show which primary exercises will fall back to a
 * custom placeholder and which substitution names will be dropped — the exact
 * gap Chunk 1's real-file test found — before committing to importProgram().
 */
export async function previewImport(raw: unknown): Promise<ImportPreview> {
  const parsed = parseImportJson(raw)
  const exercises = await allExercises()
  const { primary, substitutes } = collectExerciseNames(parsed)

  const resolved = new Map<string, { key: string; name: string }>()
  const matches: ExerciseMatch[] = []

  for (const name of primary) {
    const match = resolveExercise(name, exercises)
    if (match) resolved.set(name, { key: match.key, name: match.name })
    matches.push({ name, isSubstitute: false, matched: !!match, matchedName: match?.name })
  }

  for (const name of substitutes) {
    if (primary.has(name)) continue
    const match = resolveExercise(name, exercises)
    if (match) resolved.set(name, { key: match.key, name: match.name })
    matches.push({ name, isSubstitute: true, matched: !!match, matchedName: match?.name })
  }

  const built = buildProgram(parsed, (name) => resolved.get(name))
  return { built, matches }
}

/** The only part of this file that touches the database. */
export async function importProgram(raw: unknown): Promise<{ programId: string; warnings: string[] }> {
  const parsed = parseImportJson(raw)
  const exercises = await allExercises()
  const { primary: primaryNames, substitutes: substituteNames } = collectExerciseNames(parsed)

  const resolved = new Map<string, { key: string; name: string }>()

  for (const name of primaryNames) {
    const match = resolveExercise(name, exercises)
    if (match) {
      resolved.set(name, { key: match.key, name: match.name })
      continue
    }
    // No confident match — mint a custom exercise so the import never leaves
    // a dangling exerciseKey. Bucketed as 'other'; groupFor() already treats
    // an unrecognised muscle name as 'Other' rather than throwing.
    const id = await addCustomExercise({
      name,
      bodyPart: 'other',
      equipment: 'other',
      target: 'other',
      secondary: [],
      steps: [],
    })
    resolved.set(name, { key: `custom:${id}`, name })
  }

  for (const name of substituteNames) {
    if (resolved.has(name)) continue
    const match = resolveExercise(name, exercises)
    if (match) {
      resolved.set(name, { key: match.key, name: match.name })
      continue
    }
    // Reverses the earlier plan decision to drop an unmatched substitution
    // name: a suggestion the swap UI can't select isn't useful, but neither
    // is silently losing one of the two explicit substitutes the program
    // author wrote down. Minted the same way as an unmatched primary.
    const id = await addCustomExercise({
      name,
      bodyPart: 'other',
      equipment: 'other',
      target: 'other',
      secondary: [],
      steps: [],
    })
    resolved.set(name, { key: `custom:${id}`, name })
  }

  const built = buildProgram(parsed, (name) => resolved.get(name))

  const programId = await createProgram(built.programName)

  const routineIdByKey = new Map<string, string>()
  for (const routine of built.routines) {
    const routineId = await createRoutine(routine.name)
    await setRoutineExercises(routineId, routine.exercises)
    routineIdByKey.set(routine.key, routineId)
  }

  await setProgramDays(
    programId,
    built.days.map((d) => ({
      week: d.week,
      dayIndex: d.dayIndex,
      routineId: d.routineKey ? routineIdByKey.get(d.routineKey) : undefined,
    }))
  )

  return { programId, warnings: built.warnings }
}
