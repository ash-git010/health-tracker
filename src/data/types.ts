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
  type: SetType
  restSeconds: number
  completed: boolean
  createdAt: string
  updatedAt: string
  deletedAt?: string
}

// A target, not a record. Every field except type is optional: a routine may
// specify 3 sets with no numbers at all, or 60kg × 8 at RPE 8.
export interface RoutineSet {
  type: SetType
  weightKg?: number
  reps?: number
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
  restSeconds: number
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