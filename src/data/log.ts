import { db } from './db'
import { macrosForAmount } from './foods'
import type { Food, LogEntry } from './types'

export type Meal = LogEntry['meal']

export const MEALS: Meal[] = ['breakfast', 'lunch', 'dinner', 'snack']

export async function getEntriesForDate(date: string): Promise<LogEntry[]> {
  return db.logEntries.where('date').equals(date).sortBy('createdAt')
}

export async function logFood(
  food: Food,
  amount: number,
  meal: Meal,
  date: string
): Promise<void> {
  if (!food.id) throw new Error('Food has no id')
  const macros = macrosForAmount(food, amount)

  await db.logEntries.add({
    date,
    meal,
    foodId: food.id,
    foodName: food.name,
    amount,
    unit: food.unit,
    ...macros,
    createdAt: new Date().toISOString(),
  })
}

export async function deleteEntry(id: number): Promise<void> {
  await db.logEntries.delete(id)
}

export function sumEntries(entries: LogEntry[]) {
  return entries.reduce(
    (acc, e) => ({
      kcal: acc.kcal + e.kcal,
      protein: acc.protein + e.protein,
      carbs: acc.carbs + e.carbs,
      fat: acc.fat + e.fat,
    }),
    { kcal: 0, protein: 0, carbs: 0, fat: 0 }
  )
}