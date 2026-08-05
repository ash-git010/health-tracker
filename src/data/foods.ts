import { db } from './db'
import { newId, now, isLive } from './ids'
import type { Food } from './types'

// Sync fields are set by this layer, never by callers.
export type FoodInput = Omit<Food, 'id' | 'createdAt' | 'updatedAt' | 'deletedAt'>

export async function listFoods(): Promise<Food[]> {
  const all = await db.foods.orderBy('name').toArray()
  return all.filter(isLive)
}

export async function getFood(id: string): Promise<Food | undefined> {
  const food = await db.foods.get(id)
  return food && isLive(food) ? food : undefined
}

export async function addFood(input: FoodInput): Promise<string> {
  const timestamp = now()
  const id = newId()
  await db.foods.add({ ...input, id, createdAt: timestamp, updatedAt: timestamp })
  return id
}

export async function updateFood(id: string, input: FoodInput): Promise<void> {
  await db.foods.update(id, { ...input, updatedAt: now() })
}

// Soft delete: the row stays so sync can tell other devices it went away.
// A hard delete would simply be re-downloaded on the next pull.
export async function deleteFood(id: string): Promise<void> {
  await db.foods.update(id, { deletedAt: now(), updatedAt: now() })
}

export function macrosForAmount(food: Food, amount: number) {
  const factor = amount / 100
  return {
    kcal: round1(food.kcal * factor),
    protein: round1(food.protein * factor),
    carbs: round1(food.carbs * factor),
    fat: round1(food.fat * factor),
  }
}

export function amountInBaseUnit(
  food: Food,
  amount: number,
  mode: 'base' | 'piece'
): number {
  if (mode === 'piece' && food.pieceGrams) return amount * food.pieceGrams
  return amount
}

export function hasPieces(food: Food): boolean {
  return typeof food.pieceGrams === 'number' && food.pieceGrams > 0
}

function round1(n: number): number {
  return Math.round(n * 10) / 10
}