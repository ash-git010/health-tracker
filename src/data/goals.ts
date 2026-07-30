import { db } from './db'
import type { Goals } from './types'

const GOALS_ID = 1

export async function getGoals(): Promise<Goals | undefined> {
  return db.goals.get(GOALS_ID)
}

export async function saveGoals(
  input: Omit<Goals, 'id' | 'updatedAt'>
): Promise<void> {
  await db.goals.put({
    ...input,
    id: GOALS_ID,
    updatedAt: new Date().toISOString(),
  })
}

export function macroGramsFromGoals(goals: Goals) {
  return {
    protein: Math.round((goals.dailyCalories * goals.proteinPercent) / 100 / 4),
    carbs: Math.round((goals.dailyCalories * goals.carbsPercent) / 100 / 4),
    fat: Math.round((goals.dailyCalories * goals.fatPercent) / 100 / 9),
  }
}