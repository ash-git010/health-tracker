import { db } from './db'
import { todayISO, addDays } from './dates'
import type { CareRoutine, CareStep, CareDone, TimeOfDay } from './types'

export const DEFAULT_KINDS = ['Skin', 'Hair', 'Other']

export const TIMES: { value: TimeOfDay; label: string }[] = [
  { value: 'morning', label: 'Morning' },
  { value: 'evening', label: 'Evening' },
  { value: 'anytime', label: 'Anytime' },
]

export type CareRoutineInput = Omit<CareRoutine, 'id' | 'createdAt' | 'sortOrder'>
export type CareStepInput = Omit<CareStep, 'id' | 'careRoutineId' | 'order'>

/* ---------- reads ---------- */

export async function listCareRoutines(): Promise<CareRoutine[]> {
  const all = await db.careRoutines.toArray()
  return all.sort((a, b) => a.sortOrder - b.sortOrder || a.name.localeCompare(b.name))
}

export async function getCareRoutine(id: number): Promise<CareRoutine | null> {
  return (await db.careRoutines.get(id)) ?? null
}

export async function getSteps(careRoutineId: number): Promise<CareStep[]> {
  const steps = await db.careSteps.where('careRoutineId').equals(careRoutineId).toArray()
  return steps.sort((a, b) => a.order - b.order)
}

export async function getDoneForDate(date: string): Promise<CareDone[]> {
  return db.careDoneLog.where('date').equals(date).toArray()
}

export async function routineKinds(): Promise<string[]> {
  const all = await db.careRoutines.toArray()
  const used = [...new Set(all.map((r) => r.kind).filter(Boolean))]
  const extra = used.filter((k) => !DEFAULT_KINDS.includes(k)).sort()
  return [...DEFAULT_KINDS, ...extra]
}

/* ---------- writes ---------- */

export async function createCareRoutine(input: CareRoutineInput): Promise<number> {
  const all = await db.careRoutines.toArray()
  const maxOrder = all.reduce((m, r) => Math.max(m, r.sortOrder), 0)

  return db.careRoutines.add({
    ...input,
    sortOrder: maxOrder + 1,
    createdAt: new Date().toISOString(),
  })
}

export async function updateCareRoutine(
  id: number,
  changes: Partial<Pick<CareRoutine, 'name' | 'kind' | 'timeOfDay' | 'sortOrder'>>
): Promise<void> {
  await db.careRoutines.update(id, changes)
}

export async function deleteCareRoutine(id: number): Promise<void> {
  await db.transaction('rw', [db.careRoutines, db.careSteps, db.careDoneLog], async () => {
    await db.careSteps.where('careRoutineId').equals(id).delete()
    await db.careDoneLog.where('careRoutineId').equals(id).delete()
    await db.careRoutines.delete(id)
  })
}

export async function setSteps(careRoutineId: number, steps: CareStepInput[]): Promise<void> {
  await db.transaction('rw', db.careSteps, async () => {
    await db.careSteps.where('careRoutineId').equals(careRoutineId).delete()
    await db.careSteps.bulkAdd(steps.map((s, order) => ({ ...s, careRoutineId, order })))
  })
}

export async function moveCareRoutine(id: number, direction: -1 | 1): Promise<void> {
  const all = await listCareRoutines()
  const routine = all.find((r) => r.id === id)
  if (!routine) return

  const siblings = all.filter((r) => r.kind === routine.kind)
  const index = siblings.findIndex((r) => r.id === id)
  const target = siblings[index + direction]
  if (!target) return

  await db.transaction('rw', db.careRoutines, async () => {
    await db.careRoutines.update(routine.id!, { sortOrder: target.sortOrder })
    await db.careRoutines.update(target.id!, { sortOrder: routine.sortOrder })
  })
}

/** Tick or untick a step for a given day. Event handlers only — never a live query. */
export async function toggleStep(
  careRoutineId: number,
  stepId: number,
  date: string
): Promise<void> {
  const existing = await db.careDoneLog
    .where('[date+careRoutineId]')
    .equals([date, careRoutineId])
    .first()

  if (!existing) {
    await db.careDoneLog.add({
      date,
      careRoutineId,
      stepIds: [stepId],
      skipped: false,
      createdAt: new Date().toISOString(),
    })
    return
  }

  const has = existing.stepIds.includes(stepId)
  const stepIds = has
    ? existing.stepIds.filter((id) => id !== stepId)
    : [...existing.stepIds, stepId]

  await db.careDoneLog.update(existing.id!, { stepIds, skipped: false })
}

export async function setSkipped(
  careRoutineId: number,
  date: string,
  skipped: boolean
): Promise<void> {
  const existing = await db.careDoneLog
    .where('[date+careRoutineId]')
    .equals([date, careRoutineId])
    .first()

  if (!existing) {
    if (!skipped) return
    await db.careDoneLog.add({
      date,
      careRoutineId,
      stepIds: [],
      skipped: true,
      createdAt: new Date().toISOString(),
    })
    return
  }

  await db.careDoneLog.update(existing.id!, { skipped, stepIds: skipped ? [] : existing.stepIds })
}

/* ---------- derived ---------- */

export function isComplete(done: CareDone | undefined, steps: CareStep[]): boolean {
  if (!done) return false
  if (done.skipped) return true
  if (steps.length === 0) return false
  return steps.every((s) => done.stepIds.includes(s.id!))
}

export async function routineStreak(careRoutineId: number): Promise<number> {
  const [steps, allDone] = await Promise.all([
    getSteps(careRoutineId),
    db.careDoneLog.where('careRoutineId').equals(careRoutineId).toArray(),
  ])

  if (steps.length === 0) return 0

  const byDate = new Map(allDone.map((d) => [d.date, d]))
  let streak = 0
  let cursor = todayISO()

  // Today not being done yet shouldn't break the streak.
  if (!isComplete(byDate.get(cursor), steps)) {
    cursor = addDays(cursor, -1)
  }

  while (isComplete(byDate.get(cursor), steps)) {
    streak++
    cursor = addDays(cursor, -1)
  }

  return streak
}

export async function completionRate(careRoutineId: number, days: number): Promise<number> {
  const [steps, allDone] = await Promise.all([
    getSteps(careRoutineId),
    db.careDoneLog.where('careRoutineId').equals(careRoutineId).toArray(),
  ])

  if (steps.length === 0) return 0

  const byDate = new Map(allDone.map((d) => [d.date, d]))
  let completed = 0

  for (let i = 0; i < days; i++) {
    if (isComplete(byDate.get(addDays(todayISO(), -i)), steps)) completed++
  }

  return Math.round((completed / days) * 100)
}