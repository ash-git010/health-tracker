import { db } from './db'
import seed from './seed/exercises.json'
import type { Exercise } from './types'

interface SeedExercise {
  id: string
  name: string
  bodyPart: string
  equipment: string
  target: string
  secondary: string[]
  steps: string[]
}

const SEED = seed as SeedExercise[]

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

const seedOptions: ExerciseOption[] = SEED.map((e) => ({
  key: e.id,
  name: e.name,
  bodyPart: e.bodyPart,
  equipment: e.equipment,
  target: e.target,
  secondary: e.secondary,
  steps: e.steps,
  custom: false,
}))

export async function allExercises(): Promise<ExerciseOption[]> {
  const custom = await db.exercises.toArray()
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
  const q = query.trim().toLowerCase()

  return list
    .filter((e) => {
      if (bodyPart && e.bodyPart !== bodyPart) return false
      if (equipment && e.equipment !== equipment) return false
      if (!q) return true
      return e.name.toLowerCase().includes(q) || e.target.toLowerCase().includes(q)
    })
    .sort((a, b) => {
      if (!q) return a.name.localeCompare(b.name)
      const aStarts = a.name.toLowerCase().startsWith(q) ? 0 : 1
      const bStarts = b.name.toLowerCase().startsWith(q) ? 0 : 1
      return aStarts - bStarts || a.name.localeCompare(b.name)
    })
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