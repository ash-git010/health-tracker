import { db } from './db'
import type { Exercise } from './types'
import { fuzzySearch } from './search'
import { POPULAR_EXERCISES } from './exercisePopularity'

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
  imageUrl?: string
  popularity: number
}

let seedCache: ExerciseOption[] | null = null

// For each popular movement, boost only the shortest matching seed name —
// almost always the base exercise rather than an equipment/angle variant.
function computePopularity(names: { key: string; name: string }[]): Map<string, number> {
  const boosts = new Map<string, number>()

  for (const [popularName, boost] of Object.entries(POPULAR_EXERCISES)) {
    const matches = names.filter((n) => n.name.toLowerCase().includes(popularName))
    if (matches.length === 0) continue

    const shortest = matches.reduce((a, b) => (b.name.length < a.name.length ? b : a))
    boosts.set(shortest.key, Math.max(boosts.get(shortest.key) ?? 0, boost))
  }

  return boosts
}

async function loadSeed(): Promise<ExerciseOption[]> {
  if (!seedCache) {
    const mod = await import('./seed/exercises.json')
    const raw = mod.default as SeedExercise[]
    const popularity = computePopularity(raw.map((e) => ({ key: e.id, name: e.name })))

    seedCache = raw.map((e) => ({
      key: e.id,
      name: e.name,
      bodyPart: e.bodyPart,
      equipment: e.equipment,
      target: e.target,
      secondary: e.secondary,
      steps: e.steps,
      custom: false,
      imageUrl: undefined,
      popularity: popularity.get(e.id) ?? 0,
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
    imageUrl: undefined,
    popularity: 0,
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

  if (!query.trim()) {
    return [...filtered].sort((a, b) => b.popularity - a.popularity || a.name.localeCompare(b.name))
  }

  return fuzzySearch(
    filtered,
    query,
    (e) => `${e.name} ${e.target} ${e.equipment}`,
    undefined,
    (e) => e.popularity
  )
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