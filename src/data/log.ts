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

export async function getEntriesInRange(
  startDate: string,
  endDate: string
): Promise<LogEntry[]> {
  return db.logEntries.where('date').between(startDate, endDate, true, true).toArray()
}

export interface DayTotals {
  date: string
  kcal: number
  protein: number
  carbs: number
  fat: number
  logged: boolean
}

export async function getDailyTotals(dates: string[]): Promise<DayTotals[]> {
  if (dates.length === 0) return []

  const entries = await getEntriesInRange(dates[0], dates[dates.length - 1])
  const byDate = new Map<string, LogEntry[]>()

  for (const entry of entries) {
    const list = byDate.get(entry.date) ?? []
    list.push(entry)
    byDate.set(entry.date, list)
  }

  return dates.map((date) => {
    const dayEntries = byDate.get(date) ?? []
    const sums = sumEntries(dayEntries)
    return {
      date,
      kcal: Math.round(sums.kcal),
      protein: Math.round(sums.protein),
      carbs: Math.round(sums.carbs),
      fat: Math.round(sums.fat),
      logged: dayEntries.length > 0,
    }
  })
}