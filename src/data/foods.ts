import { db } from './db'
import type { Food } from './types'

export type FoodInput = Omit<Food, 'id' | 'createdAt'>

export async function listFoods(): Promise<Food[]> {
  return db.foods.orderBy('name').toArray()
}

export async function getFood(id: number): Promise<Food | undefined> {
  return db.foods.get(id)
}

export async function addFood(input: FoodInput): Promise<number> {
  return db.foods.add({ ...input, createdAt: new Date().toISOString() })
}

export async function updateFood(id: number, input: FoodInput): Promise<void> {
  await db.foods.update(id, input)
}

export async function deleteFood(id: number): Promise<void> {
  await db.foods.delete(id)
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