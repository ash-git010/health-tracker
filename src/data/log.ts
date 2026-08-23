import { db } from './db'
import { macrosForAmount } from './foods'
import { newId, now, isLive } from './ids'
import type { Food, LogEntry } from './types'
import { t } from './i18n'
import type { TKey } from './locales/en'

export type Meal = LogEntry['meal']

export const MEALS: Meal[] = ['breakfast', 'lunch', 'dinner', 'snack']

/**
 * Meal ids are stored data — the `[date+meal]` Dexie index and a Postgres
 * column — so they stay English forever. Only the label translates.
 *
 * A Record of *keys* is safe at module level; a Record of t() results would
 * freeze its language at import (§5). The lookup happens inside the function.
 */
const MEAL_KEYS: Record<Meal, TKey> = {
  breakfast: 'meals.breakfast',
  lunch: 'meals.lunch',
  dinner: 'meals.dinner',
  snack: 'meals.snack',
}

export function mealLabel(meal: Meal): string {
  return t(MEAL_KEYS[meal])
}

export async function getEntriesForDate(date: string): Promise<LogEntry[]> {
  const entries = await db.logEntries.where('date').equals(date).sortBy('createdAt')
  return entries.filter(isLive)
}

export async function logFood(
  food: Food,
  amount: number,
  meal: Meal,
  date: string
): Promise<void> {
  if (!food.id) throw new Error('Food has no id')
  const macros = macrosForAmount(food, amount)
  const timestamp = now()

  await db.logEntries.add({
    id: newId(),
    date,
    meal,
    foodId: food.id,
    foodName: food.name,
    amount,
    unit: food.unit,
    ...macros,
    createdAt: timestamp,
    updatedAt: timestamp,
  })
}

export async function deleteEntry(id: string): Promise<void> {
  await db.logEntries.update(id, { deletedAt: now(), updatedAt: now() })
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
  const entries = await db.logEntries
    .where('date')
    .between(startDate, endDate, true, true)
    .toArray()
  return entries.filter(isLive)
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