export type Unit = 'g' | 'ml'

export type SetType = 'normal' | 'warmup' | 'drop' | 'failure'

export interface Goals {
  id: number
  dailyCalories: number
  proteinPercent: number
  carbsPercent: number
  fatPercent: number
  minProteinGrams: number
  updatedAt: string
}

export interface Food {
  id?: number
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
}

export interface LogEntry {
  id?: number
  date: string
  meal: 'breakfast' | 'lunch' | 'dinner' | 'snack'
  foodId: number
  foodName: string
  amount: number
  unit: Unit
  kcal: number
  protein: number
  carbs: number
  fat: number
  createdAt: string
}

export interface BodyMeasurement {
  id?: number
  date: string
  weightKg: number
  heightCm?: number
  createdAt: string
}

export interface Profile {
  id: number
  name: string
  folderOrder?: string[]
  createdAt: string
}

export interface Exercise {
  id?: number
  seedId?: string
  name: string
  bodyPart: string
  equipment: string
  target: string
  secondary: string[]
  steps: string[]
  custom: boolean
  createdAt: string
}

export interface Workout {
  id?: number
  date: string
  name: string
  startedAt: string
  finishedAt?: string
  notes?: string
  routineId?: number
}

export interface WorkoutSet {
  id?: number
  workoutId: number
  exerciseKey: string
  exerciseName: string
  order: number
  setNumber: number
  weightKg: number
  reps: number
  type: SetType
  restSeconds: number
  completed: boolean
  createdAt: string
}

export interface Routine {
  id?: number
  name: string
  folder?: string
  sortOrder?: number
  createdAt: string
}

export interface RoutineExercise {
  id?: number
  routineId: number
  exerciseKey: string
  exerciseName: string
  order: number
  targetSets: number
  restSeconds: number
}