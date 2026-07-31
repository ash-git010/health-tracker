export type Unit = 'g' | 'ml'

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
  createdAt: string
}