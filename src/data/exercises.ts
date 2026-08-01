import { db } from './db'
import type { Exercise } from './types'
import { fuzzySearch } from './search'

interface SeedExercise {
  id: string
  name: string
  bodyPart: string
  equipment: string
  target: string
  secondary: string[]
  steps: string[]
}

export interface ExerciseOption {
  key: string
  name: string
  bodyPart: string
  equipment: string
  target: string
  secondary: string[]
  steps: string[]
  custom: boolean
}

let seedCache: ExerciseOption[] | null = null

async function loadSeed(): Promise<ExerciseOption[]> {
  if (!seedCache) {
    const mod = await import('./seed/exercises.json')
    const raw = mod.default as SeedExercise[]
    seedCache = raw.map((e) => ({
      key: e.id,
      name: e.name,
      bodyPart: e.bodyPart,
      equipment: e.equipment,
      target: e.target,
      secondary: e.secondary,
      steps: e.steps,
      custom: false,
    }))
  }
  return seedCache
}

export async function allExercises(): Promise<ExerciseOption[]> {
  const [seedOptions, custom] = await Promise.all([loadSeed(), db.exercises.toArray()])

  const customOptions: ExerciseOption[] = custom.map((e) => ({
    key: `custom:${e.id}`,
    name: e.name,
    bodyPart: e.bodyPart,
    equipment: e.equipment,
    target: e.target,
    secondary: e.secondary,
    steps: e.steps,
    custom: true,
  }))

  return [...customOptions, ...seedOptions]
}

export async function findExercise(key: string): Promise<ExerciseOption | undefined> {
  return (await allExercises()).find((e) => e.key === key)
}

export function searchExercises(
  list: ExerciseOption[],
  query: string,
  bodyPart?: string,
  equipment?: string
): ExerciseOption[] {
  const filtered = list.filter((e) => {
    if (bodyPart && e.bodyPart !== bodyPart) return false
    if (equipment && e.equipment !== equipment) return false
    return true
  })

  return fuzzySearch(filtered, query, (e) => `${e.name} ${e.target} ${e.equipment}`)
}

export function bodyParts(list: ExerciseOption[]): string[] {
  return [...new Set(list.map((e) => e.bodyPart))].sort()
}

export function equipmentTypes(list: ExerciseOption[]): string[] {
  return [...new Set(list.map((e) => e.equipment))].sort()
}

export async function addCustomExercise(
  input: Omit<Exercise, 'id' | 'createdAt' | 'custom'>
): Promise<number> {
  return db.exercises.add({ ...input, custom: true, createdAt: new Date().toISOString() })
}

export async function deleteCustomExercise(id: number): Promise<void> {
  await db.exercises.delete(id)
}