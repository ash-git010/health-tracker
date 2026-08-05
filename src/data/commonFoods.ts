import type { Food } from './types'
import { fuzzySearch } from './search'

/**
 * Bundled reference data, not user rows — same category as the exercise seed.
 * These never live in the database, so they have no id and no sync fields.
 * A UUID is minted only when one is copied into the user's food list.
 */
export interface CommonFood
  extends Omit<Food, 'id' | 'brand' | 'createdAt' | 'updatedAt' | 'deletedAt'> {
  keywords?: string
}

export const COMMON_FOODS: CommonFood[] = [
  // Fruit
  { name: 'Apple, raw', unit: 'g', kcal: 52, protein: 0.3, carbs: 13.8, fat: 0.2, fiber: 2.4, sugar: 10.4, pieceGrams: 182, pieceLabel: 'apple' },
  { name: 'Banana, raw', unit: 'g', kcal: 89, protein: 1.1, carbs: 22.8, fat: 0.3, fiber: 2.6, sugar: 12.2, pieceGrams: 118, pieceLabel: 'banana' },
  { name: 'Orange, raw', unit: 'g', kcal: 47, protein: 0.9, carbs: 11.8, fat: 0.1, fiber: 2.4, sugar: 9.4, pieceGrams: 131, pieceLabel: 'orange' },
  { name: 'Avocado, raw', unit: 'g', kcal: 160, protein: 2, carbs: 8.5, fat: 14.7, fiber: 6.7, pieceGrams: 150, pieceLabel: 'avocado' },
  { name: 'Blueberries, raw', unit: 'g', kcal: 57, protein: 0.7, carbs: 14.5, fat: 0.3, fiber: 2.4, sugar: 10 },
  { name: 'Strawberries, raw', unit: 'g', kcal: 32, protein: 0.7, carbs: 7.7, fat: 0.3, fiber: 2, sugar: 4.9 },
  { name: 'Grapes, raw', unit: 'g', kcal: 69, protein: 0.7, carbs: 18.1, fat: 0.2, fiber: 0.9, sugar: 15.5 },

  // Vegetables
  { name: 'Potato, raw', unit: 'g', kcal: 77, protein: 2, carbs: 17.5, fat: 0.1, fiber: 2.1, pieceGrams: 173, pieceLabel: 'potato' },
  { name: 'Sweet potato, raw', unit: 'g', kcal: 86, protein: 1.6, carbs: 20.1, fat: 0.1, fiber: 3 },
  { name: 'Broccoli, raw', unit: 'g', kcal: 34, protein: 2.8, carbs: 6.6, fat: 0.4, fiber: 2.6 },
  { name: 'Carrot, raw', unit: 'g', kcal: 41, protein: 0.9, carbs: 9.6, fat: 0.2, fiber: 2.8, pieceGrams: 61, pieceLabel: 'carrot' },
  { name: 'Tomato, raw', unit: 'g', kcal: 18, protein: 0.9, carbs: 3.9, fat: 0.2, fiber: 1.2, pieceGrams: 123, pieceLabel: 'tomato' },
  { name: 'Cucumber, raw', unit: 'g', kcal: 15, protein: 0.7, carbs: 3.6, fat: 0.1, fiber: 0.5 },
  { name: 'Onion, raw', unit: 'g', kcal: 40, protein: 1.1, carbs: 9.3, fat: 0.1, fiber: 1.7 },
  { name: 'Spinach, raw', unit: 'g', kcal: 23, protein: 2.9, carbs: 3.6, fat: 0.4, fiber: 2.2 },
  { name: 'Bell pepper, raw', unit: 'g', kcal: 31, protein: 1, carbs: 6, fat: 0.3, fiber: 2.1 },

  // Meat and fish
  { name: 'Chicken breast, raw, skinless', unit: 'g', kcal: 120, protein: 22.5, carbs: 0, fat: 2.6, keywords: 'poultry' },
  { name: 'Chicken breast, cooked', unit: 'g', kcal: 165, protein: 31, carbs: 0, fat: 3.6, keywords: 'poultry grilled' },
  { name: 'Chicken thigh, raw, skinless', unit: 'g', kcal: 121, protein: 19.7, carbs: 0, fat: 4.1, keywords: 'poultry' },
  { name: 'Beef mince, 5% fat, raw', unit: 'g', kcal: 137, protein: 21.4, carbs: 0, fat: 5, keywords: 'ground hackfleisch' },
  { name: 'Beef mince, 20% fat, raw', unit: 'g', kcal: 254, protein: 17.2, carbs: 0, fat: 20, keywords: 'ground hackfleisch' },
  { name: 'Pork loin, raw', unit: 'g', kcal: 143, protein: 21, carbs: 0, fat: 5.9 },
  { name: 'Salmon, raw', unit: 'g', kcal: 208, protein: 20.4, carbs: 0, fat: 13.4, keywords: 'fish lachs' },
  { name: 'Tuna, canned in water, drained', unit: 'g', kcal: 116, protein: 25.5, carbs: 0, fat: 0.8, keywords: 'fish thunfisch' },
  { name: 'Egg, whole, raw', unit: 'g', kcal: 143, protein: 12.6, carbs: 0.7, fat: 9.5, pieceGrams: 50, pieceLabel: 'egg' },
  { name: 'Egg white, raw', unit: 'g', kcal: 52, protein: 10.9, carbs: 0.7, fat: 0.2, pieceGrams: 33, pieceLabel: 'egg white' },

  // Dairy
  { name: 'Milk, whole 3.5%', unit: 'ml', kcal: 64, protein: 3.3, carbs: 4.7, fat: 3.6, keywords: 'vollmilch' },
  { name: 'Milk, semi-skimmed 1.5%', unit: 'ml', kcal: 47, protein: 3.4, carbs: 4.9, fat: 1.6, keywords: 'milch' },
  { name: 'Greek yoghurt, 0% fat', unit: 'g', kcal: 59, protein: 10.3, carbs: 3.6, fat: 0.4 },
  { name: 'Quark, low fat', unit: 'g', kcal: 67, protein: 12, carbs: 4, fat: 0.2, keywords: 'magerquark' },
  { name: 'Skyr, plain', unit: 'g', kcal: 63, protein: 11, carbs: 4, fat: 0.2 },
  { name: 'Cheddar cheese', unit: 'g', kcal: 403, protein: 24.9, carbs: 1.3, fat: 33.1 },
  { name: 'Mozzarella', unit: 'g', kcal: 280, protein: 22.2, carbs: 2.2, fat: 22.4 },
  { name: 'Butter', unit: 'g', kcal: 717, protein: 0.9, carbs: 0.1, fat: 81.1 },

  // Grains and starches
  { name: 'Oats, rolled, dry', unit: 'g', kcal: 379, protein: 13.2, carbs: 67.7, fat: 6.5, fiber: 10.1, keywords: 'haferflocken porridge' },
  { name: 'Rice, white, dry', unit: 'g', kcal: 365, protein: 7.1, carbs: 80, fat: 0.7 },
  { name: 'Rice, white, cooked', unit: 'g', kcal: 130, protein: 2.7, carbs: 28.2, fat: 0.3 },
  { name: 'Rice, brown, cooked', unit: 'g', kcal: 123, protein: 2.7, carbs: 25.6, fat: 1, fiber: 1.6 },
  { name: 'Pasta, dry', unit: 'g', kcal: 371, protein: 13, carbs: 74.7, fat: 1.5, fiber: 3.2, keywords: 'nudeln spaghetti' },
  { name: 'Pasta, cooked', unit: 'g', kcal: 158, protein: 5.8, carbs: 30.9, fat: 0.9 },
  { name: 'Bread, wholemeal', unit: 'g', kcal: 247, protein: 13, carbs: 41, fat: 3.4, fiber: 7, pieceGrams: 32, pieceLabel: 'slice', keywords: 'vollkornbrot toast' },
  { name: 'Bread, white', unit: 'g', kcal: 265, protein: 9, carbs: 49, fat: 3.2, fiber: 2.7, pieceGrams: 25, pieceLabel: 'slice', keywords: 'toast' },
  { name: 'Tortilla, wheat', unit: 'g', kcal: 306, protein: 8.2, carbs: 51, fat: 7.4, pieceGrams: 62, pieceLabel: 'tortilla', keywords: 'wrap' },

  // Legumes and plant protein
  { name: 'Lentils, cooked', unit: 'g', kcal: 116, protein: 9, carbs: 20.1, fat: 0.4, fiber: 7.9, keywords: 'linsen' },
  { name: 'Chickpeas, cooked', unit: 'g', kcal: 164, protein: 8.9, carbs: 27.4, fat: 2.6, fiber: 7.6, keywords: 'kichererbsen garbanzo' },
  { name: 'Black beans, cooked', unit: 'g', kcal: 132, protein: 8.9, carbs: 23.7, fat: 0.5, fiber: 8.7 },
  { name: 'Tofu, firm', unit: 'g', kcal: 144, protein: 15.8, carbs: 4.3, fat: 8.7 },

  // Nuts, seeds, fats
  { name: 'Almonds', unit: 'g', kcal: 579, protein: 21.2, carbs: 21.6, fat: 49.9, fiber: 12.5, keywords: 'mandeln' },
  { name: 'Walnuts', unit: 'g', kcal: 654, protein: 15.2, carbs: 13.7, fat: 65.2, fiber: 6.7 },
  { name: 'Peanut butter', unit: 'g', kcal: 588, protein: 25.1, carbs: 20, fat: 50.4, fiber: 6, keywords: 'erdnussbutter' },
  { name: 'Olive oil', unit: 'ml', kcal: 884, protein: 0, carbs: 0, fat: 100, keywords: 'olivenöl' },

  // Other
  { name: 'Honey', unit: 'g', kcal: 304, protein: 0.3, carbs: 82.4, fat: 0, sugar: 82.1 },
  { name: 'Sugar, white', unit: 'g', kcal: 387, protein: 0, carbs: 100, fat: 0, sugar: 100 },
  { name: 'Dark chocolate, 70%', unit: 'g', kcal: 546, protein: 7.8, carbs: 45.9, fat: 31.3, fiber: 10.9 },
  { name: 'Whey protein powder', unit: 'g', kcal: 400, protein: 80, carbs: 8, fat: 5, keywords: 'shake' },
]

export function searchCommonFoods(query: string, limit = 8): CommonFood[] {
  if (query.trim().length < 2) return []
  return fuzzySearch(COMMON_FOODS, query, (f) => `${f.name} ${f.keywords ?? ''}`, limit)
}