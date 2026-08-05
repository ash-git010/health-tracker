import { db } from './db'
import { newId, now } from './ids'

const BACKUP_VERSION = 2

/**
 * Version 1 covered only goals, foods, logEntries and measurements — workouts
 * and routines were never included. Version 2 covers everything.
 */
export async function exportAll(): Promise<string> {
  const [
    goals, profile, foods, logEntries, measurements,
    exercises, workouts, workoutSets,
    routines, routineExercises,
    careRoutines, careSteps, careDoneLog, careStepDone,
  ] = await Promise.all([
    db.goals.toArray(),
    db.profile.toArray(),
    db.foods.toArray(),
    db.logEntries.toArray(),
    db.measurements.toArray(),
    db.exercises.toArray(),
    db.workouts.toArray(),
    db.workoutSets.toArray(),
    db.routines.toArray(),
    db.routineExercises.toArray(),
    db.careRoutines.toArray(),
    db.careSteps.toArray(),
    db.careDoneLog.toArray(),
    db.careStepDone.toArray(),
  ])

  return JSON.stringify(
    {
      version: BACKUP_VERSION,
      exportedAt: now(),
      goals, profile, foods, logEntries, measurements,
      exercises, workouts, workoutSets,
      routines, routineExercises,
      careRoutines, careSteps, careDoneLog, careStepDone,
    },
    null,
    2
  )
}

/**
 * Restores a v1 file: integer ids become UUIDs, sync fields are filled in,
 * and logEntry.foodId is remapped to the new food ids. A v1 file has no
 * workout or routine data, so those tables are left untouched rather than
 * cleared — wiping them to restore a nutrition-only backup would lose data
 * the file never contained.
 */
async function importV1(data: Record<string, unknown[]>): Promise<void> {
  const timestamp = now()
  const foodIds = new Map<number, string>()

  const foods = ((data.foods ?? []) as Record<string, unknown>[]).map((f) => {
    const id = newId()
    if (typeof f.id === 'number') foodIds.set(f.id, id)
    const { id: _oldId, ...rest } = f
    return {
      ...rest,
      id,
      createdAt: (f.createdAt as string) ?? timestamp,
      updatedAt: (f.createdAt as string) ?? timestamp,
    }
  })

  const logEntries = ((data.logEntries ?? []) as Record<string, unknown>[]).map((e) => {
    const { id: _oldId, ...rest } = e
    return {
      ...rest,
      id: newId(),
      // '' when the food is gone. Macros are snapshotted, so the entry stands.
      foodId: typeof e.foodId === 'number' ? foodIds.get(e.foodId) ?? '' : '',
      createdAt: (e.createdAt as string) ?? timestamp,
      updatedAt: (e.createdAt as string) ?? timestamp,
    }
  })

  const measurements = ((data.measurements ?? []) as Record<string, unknown>[]).map((m) => {
    const { id: _oldId, ...rest } = m
    return {
      ...rest,
      id: newId(),
      createdAt: (m.createdAt as string) ?? timestamp,
      updatedAt: (m.createdAt as string) ?? timestamp,
    }
  })

  const goals = ((data.goals ?? []) as Record<string, unknown>[]).map((g) => ({
    ...g,
    updatedAt: (g.updatedAt as string) ?? timestamp,
  }))

  await db.transaction(
    'rw',
    [db.goals, db.foods, db.logEntries, db.measurements],
    async () => {
      await Promise.all([
        db.goals.clear(),
        db.foods.clear(),
        db.logEntries.clear(),
        db.measurements.clear(),
      ])
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await db.goals.bulkAdd(goals as any)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await db.foods.bulkAdd(foods as any)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await db.logEntries.bulkAdd(logEntries as any)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await db.measurements.bulkAdd(measurements as any)
    }
  )
}

async function importV2(data: Record<string, unknown[]>): Promise<void> {
  const tables = [
    db.goals, db.profile, db.foods, db.logEntries, db.measurements,
    db.exercises, db.workouts, db.workoutSets,
    db.routines, db.routineExercises,
    db.careRoutines, db.careSteps, db.careDoneLog, db.careStepDone,
  ]

  await db.transaction('rw', tables, async () => {
    await Promise.all(tables.map((t) => t.clear()))
    await Promise.all([
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      db.goals.bulkAdd((data.goals ?? []) as any),
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      db.profile.bulkAdd((data.profile ?? []) as any),
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      db.foods.bulkAdd((data.foods ?? []) as any),
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      db.logEntries.bulkAdd((data.logEntries ?? []) as any),
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      db.measurements.bulkAdd((data.measurements ?? []) as any),
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      db.exercises.bulkAdd((data.exercises ?? []) as any),
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      db.workouts.bulkAdd((data.workouts ?? []) as any),
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      db.workoutSets.bulkAdd((data.workoutSets ?? []) as any),
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      db.routines.bulkAdd((data.routines ?? []) as any),
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      db.routineExercises.bulkAdd((data.routineExercises ?? []) as any),
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      db.careRoutines.bulkAdd((data.careRoutines ?? []) as any),
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      db.careSteps.bulkAdd((data.careSteps ?? []) as any),
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      db.careDoneLog.bulkAdd((data.careDoneLog ?? []) as any),
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      db.careStepDone.bulkAdd((data.careStepDone ?? []) as any),
    ])
  })
}

export async function importAll(json: string): Promise<void> {
  const data = JSON.parse(json)

  if (data.version === 1) return importV1(data)
  if (data.version === 2) return importV2(data)
  throw new Error('Unrecognised backup format')
}

export function downloadBackup(json: string) {
  const blob = new Blob([json], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `upkeep-${new Date().toISOString().slice(0, 10)}.json`
  a.click()
  URL.revokeObjectURL(url)
}