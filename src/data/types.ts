// Sync fields, present on every entity that will sync to Supabase:
//   id         UUID minted on the device (crypto.randomUUID()), never server-assigned
//   updatedAt  ISO timestamp, stamped on every write — drives "what changed since last sync"
//   deletedAt  soft delete; rows are never removed, only marked, or sync resurrects them
//
// Goals and Profile are singletons — one row per user — so they keep a fixed
// numeric id locally and use user_id as the primary key server-side.

export type Unit = 'g' | 'ml'
export type SetType = 'normal' | 'warmup' | 'drop' | 'failure'
export type RoutineKind = string
export type TimeOfDay = 'morning' | 'evening' | 'anytime'

export interface Goals {
  id: number
  dailyCalories: number
  proteinPercent: number
  carbsPercent: number
  fatPercent: number
  minProteinGrams: number
  updatedAt: string
}

export interface Profile {
  id: number
  name: string
  folderOrder?: string[]
  createdAt: string
  updatedAt: string
}

export interface Food {
  id: string
  name: string
  brand?: string
  unit: Unit
  kcal: number
  protein: number
  carbs: number
  fat: number
  fiber?: number
  sugar?: number
  pieceGrams?: number
  pieceLabel?: string
  createdAt: string
  updatedAt: string
  deletedAt?: string
}

export interface LogEntry {
  id: string
  date: string
  meal: 'breakfast' | 'lunch' | 'dinner' | 'snack'
  foodId: string
  foodName: string
  amount: number
  unit: Unit
  kcal: number
  protein: number
  carbs: number
  fat: number
  createdAt: string
  updatedAt: string
  deletedAt?: string
}

export interface BodyMeasurement {
  id: string
  date: string
  weightKg: number
  heightCm?: number
  createdAt: string
  updatedAt: string
  deletedAt?: string
}

export interface Exercise {
  id: string
  seedId?: string
  name: string
  bodyPart: string
  equipment: string
  target: string
  secondary: string[]
  steps: string[]
  custom: boolean
  createdAt: string
  updatedAt: string
  deletedAt?: string
}

export interface Workout {
  id: string
  date: string
  name: string
  startedAt: string
  finishedAt?: string
  notes?: string
  routineId?: string
  /** The scheduled program day this satisfied. Stamped only when the workout
   *  was started from the schedule — an empty workout that happens to look
   *  like Pull day does not claim to be it. */
  programDayId?: string
  createdAt: string
  updatedAt: string
  deletedAt?: string
}

export interface WorkoutSet {
  id: string
  workoutId: string
  exerciseKey: string
  exerciseName: string
  order: number
  setNumber: number
  weightKg: number
  reps: number
  rpe?: number
  /** Copied from RoutineExercise.notes. Written to every set of the exercise
   *  and read from the first, exactly as restSeconds and rpe work — an
   *  exercise inside a workout is only a group of sets, with no row of its own. */
  notes?: string
  type: SetType
  restSeconds: number
  completed: boolean
  createdAt: string
  updatedAt: string
  deletedAt?: string
}

// A target, not a record. Every field except type is optional: a routine may
// specify 3 sets with no numbers at all, or 60kg × 8 at RPE 8.
//
// repsMin/repsMax are a REFERENCE RANGE, not a second input. A logged set has
// one rep count; the range only tells you what to aim for, and hitting the top
// of it is the signal to add weight rather than reps. When both are present,
// `reps` is ignored for display and repsMin is what prefills.
export interface RoutineSet {
  type: SetType
  weightKg?: number
  reps?: number
  repsMin?: number
  repsMax?: number
  rpe?: number
}

export interface Routine {
  id: string
  name: string
  folder?: string
  notes?: string
  sortOrder?: number
  createdAt: string
  updatedAt: string
  deletedAt?: string
}

export interface RoutineExercise {
  id: string
  routineId: string
  exerciseKey: string
  exerciseName: string
  order: number
    /** Count of non-warmup entries in `sets`. Kept in step with it on write. */
  targetSets: number
  sets?: RoutineSet[]
  notes?: string
  /** Exercise keys offered as swap suggestions, ahead of the computed
   *  same-muscle-group matches. Author-supplied from a JSON import, or
   *  picked by hand in the routine editor. */
  substitutes?: string[]
  restSeconds: number
  createdAt: string
  updatedAt: string
  deletedAt?: string
}

// An ordered schedule above routines. Weeks are a plain integer on ProgramDay
// rather than a table of their own — see the 2026-08-23 migration for why.
export interface Program {
  id: string
  name: string
  notes?: string
  /** Week numbers keep climbing; day rows are read modulo the weeks defined.
   *  Week 5 of a 4-week repeating program reads week 1. */
  repeats: boolean
  /** Not indexed in Dexie: IndexedDB rejects booleans as keys, so an index here
   *  would silently contain nothing. Filtered in JS, like deletedAt. */
  isActive: boolean
  /** Anchors day 1. Without it a repeating program cannot say which occurrence
   *  a workout satisfied, because the same day row recurs every week. */
  startedOn?: string
  /** Keyed by week number as a string: { "1": "Intro week", "5": "Deload" }. */
  weekNotes?: Record<string, string>
  sortOrder?: number
  createdAt: string
  updatedAt: string
  deletedAt?: string
}

export interface ProgramDay {
  id: string
  programId: string
  week: number
  /** 1–7 within the week. Not a weekday — day 1 is whatever calendar day the
   *  program was started on. */
  dayIndex: number
  /** undefined means a rest day. No foreign key, so deleting a routine leaves
   *  the day needing one rather than deleting it from the schedule. */
  routineId?: string
  createdAt: string
  updatedAt: string
  deletedAt?: string
}

export interface CareRoutine {
  id: string
  name: string
  kind: RoutineKind
  timeOfDay: TimeOfDay
  sortOrder: number
  createdAt: string
  updatedAt: string
  deletedAt?: string
}

export interface CareStep {
  id: string
  careRoutineId: string
  name: string
  product?: string
  notes?: string
  order: number
  createdAt: string
  updatedAt: string
  deletedAt?: string
}

// One row per routine per day. Holds skip state only — which steps were
// ticked now lives in CareStepDone.
export interface CareDone {
  id: string
  date: string
  careRoutineId: string
  skipped: boolean
  createdAt: string
  updatedAt: string
  deletedAt?: string
}

// One row per ticked step per day. Unticking sets deletedAt rather than
// removing the row, so two devices ticking different steps never collide.
export interface CareStepDone {
  id: string
  date: string
  careRoutineId: string
  stepId: string
  createdAt: string
  updatedAt: string
  deletedAt?: string
}