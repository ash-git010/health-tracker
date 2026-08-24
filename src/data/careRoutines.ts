import { db } from './db'
import { todayISO, addDays } from './dates'
import { newId, now, isLive } from './ids'
import { t } from './i18n'
import type { CareRoutine, CareStep, CareDone, CareStepDone, TimeOfDay } from './types'

/**
 * Stored verbatim in CareRoutine.kind, so kept in English — same reasoning as
 * commonFoods.ts. kindLabel() below is the display-only translation.
 */
export const DEFAULT_KINDS = ['Skin', 'Hair', 'Other']

export function kindLabel(kind: string): string {
  switch (kind) {
    case 'Skin':
      return t('care.kindSkin')
    case 'Hair':
      return t('care.kindHair')
    case 'Other':
      return t('care.kindOther')
    default:
      return kind
  }
}

/** A function, not a const — see rpeOptions()/restOptions() for why. */
export function times(): { value: TimeOfDay; label: string }[] {
  return [
    { value: 'morning', label: t('care.timeMorning') },
    { value: 'evening', label: t('care.timeEvening') },
    { value: 'anytime', label: t('care.timeAnytime') },
  ]
}

export type CareRoutineInput = Omit<CareRoutine, 'id' | 'createdAt' | 'updatedAt' | 'deletedAt' | 'sortOrder'>
export type CareStepInput = Omit<CareStep, 'id' | 'careRoutineId' | 'order' | 'createdAt' | 'updatedAt' | 'deletedAt'>

/* ---------- reads ---------- */

export async function listCareRoutines(): Promise<CareRoutine[]> {
  const all = await db.careRoutines.toArray()
  return all
    .filter(isLive)
    .sort((a, b) => a.sortOrder - b.sortOrder || a.name.localeCompare(b.name))
}

export async function getCareRoutine(id: string): Promise<CareRoutine | null> {
  const routine = await db.careRoutines.get(id)
  return routine && isLive(routine) ? routine : null
}

export async function getSteps(careRoutineId: string): Promise<CareStep[]> {
  const steps = await db.careSteps.where('careRoutineId').equals(careRoutineId).toArray()
  return steps.filter(isLive).sort((a, b) => a.order - b.order)
}

export async function getDoneForDate(date: string): Promise<CareDone[]> {
  const rows = await db.careDoneLog.where('date').equals(date).toArray()
  return rows.filter(isLive)
}

/** Ticked steps for a day, across all routines. */
export async function getStepDoneForDate(date: string): Promise<CareStepDone[]> {
  const rows = await db.careStepDone.where('date').equals(date).toArray()
  return rows.filter(isLive)
}

/** Convenience for screens: the set of step ids ticked on a given date. */
export async function tickedStepIds(date: string): Promise<Set<string>> {
  const rows = await getStepDoneForDate(date)
  return new Set(rows.map((r) => r.stepId))
}

export async function routineKinds(): Promise<string[]> {
  const all = await db.careRoutines.toArray()
  const used = [...new Set(all.filter(isLive).map((r) => r.kind).filter(Boolean))]
  const extra = used.filter((k) => !DEFAULT_KINDS.includes(k)).sort()
  return [...DEFAULT_KINDS, ...extra]
}

/* ---------- writes ---------- */

export async function createCareRoutine(input: CareRoutineInput): Promise<string> {
  const all = await db.careRoutines.toArray()
  const maxOrder = all.reduce((m, r) => Math.max(m, r.sortOrder), 0)
  const timestamp = now()
  const id = newId()

  await db.careRoutines.add({
    ...input,
    id,
    sortOrder: maxOrder + 1,
    createdAt: timestamp,
    updatedAt: timestamp,
  })
  return id
}

export async function updateCareRoutine(
  id: string,
  changes: Partial<Pick<CareRoutine, 'name' | 'kind' | 'timeOfDay' | 'sortOrder'>>
): Promise<void> {
  await db.careRoutines.update(id, { ...changes, updatedAt: now() })
}

export async function deleteCareRoutine(id: string): Promise<void> {
  const timestamp = now()
  const dead = { deletedAt: timestamp, updatedAt: timestamp }

  await db.transaction(
    'rw',
    [db.careRoutines, db.careSteps, db.careDoneLog, db.careStepDone],
    async () => {
      await db.careSteps.where('careRoutineId').equals(id).modify(dead)
      await db.careDoneLog.where('careRoutineId').equals(id).modify(dead)
      await db.careStepDone.where('careRoutineId').equals(id).modify(dead)
      await db.careRoutines.update(id, dead)
    }
  )
}

/**
 * Reconciles by position instead of deleting and re-adding.
 *
 * The previous version wiped every step and inserted fresh ones on each save,
 * which meant new ids each time — so historical ticks pointed at steps that no
 * longer existed. Editing a routine silently broke its own history. Updating
 * in place keeps ids stable and keeps past ticks meaningful.
 */
export async function setSteps(
  careRoutineId: string,
  steps: CareStepInput[]
): Promise<void> {
  const timestamp = now()

  await db.transaction('rw', db.careSteps, async () => {
    const existing = (
      await db.careSteps.where('careRoutineId').equals(careRoutineId).toArray()
    )
      .filter(isLive)
      .sort((a, b) => a.order - b.order)

    for (let i = 0; i < steps.length; i++) {
      const input = steps[i]
      const row = existing[i]

      if (row) {
        await db.careSteps.update(row.id, { ...input, order: i, updatedAt: timestamp })
      } else {
        await db.careSteps.add({
          ...input,
          id: newId(),
          careRoutineId,
          order: i,
          createdAt: timestamp,
          updatedAt: timestamp,
        })
      }
    }

    for (const row of existing.slice(steps.length)) {
      await db.careSteps.update(row.id, { deletedAt: timestamp, updatedAt: timestamp })
    }
  })
}

export async function moveCareRoutine(id: string, direction: -1 | 1): Promise<void> {
  const all = await listCareRoutines()
  const routine = all.find((r) => r.id === id)
  if (!routine) return

  const siblings = all.filter((r) => r.kind === routine.kind)
  const index = siblings.findIndex((r) => r.id === id)
  const target = siblings[index + direction]
  if (!target) return

  const timestamp = now()

  await db.transaction('rw', db.careRoutines, async () => {
    await db.careRoutines.update(routine.id, {
      sortOrder: target.sortOrder,
      updatedAt: timestamp,
    })
    await db.careRoutines.update(target.id, {
      sortOrder: routine.sortOrder,
      updatedAt: timestamp,
    })
  })
}

/**
 * Tick or untick a step for a given day. Event handlers only — never a live
 * query (Dexie runs those read-only and will throw).
 *
 * One row per step per day. Unticking sets deletedAt; re-ticking clears it on
 * the same row rather than adding another, so a day can't accumulate
 * duplicates. Two devices ticking different steps now write different rows and
 * never collide.
 */
export async function toggleStep(
  careRoutineId: string,
  stepId: string,
  date: string
): Promise<void> {
  const timestamp = now()

  const existing = await db.careStepDone
    .where('[date+careRoutineId]')
    .equals([date, careRoutineId])
    .filter((r) => r.stepId === stepId)
    .first()

  if (existing) {
    await db.careStepDone.update(existing.id, {
      // Dexie deletes a property when its update value is undefined, which is
      // exactly what reviving the row needs.
      deletedAt: existing.deletedAt ? undefined : timestamp,
      updatedAt: timestamp,
    })
  } else {
    await db.careStepDone.add({
      id: newId(),
      date,
      careRoutineId,
      stepId,
      createdAt: timestamp,
      updatedAt: timestamp,
    })
  }

  // Ticking anything means the day wasn't skipped after all.
  const done = await db.careDoneLog
    .where('[date+careRoutineId]')
    .equals([date, careRoutineId])
    .first()

  if (done?.skipped) {
    await db.careDoneLog.update(done.id, { skipped: false, updatedAt: timestamp })
  }
}

export async function setSkipped(
  careRoutineId: string,
  date: string,
  skipped: boolean
): Promise<void> {
  const timestamp = now()

  const existing = await db.careDoneLog
    .where('[date+careRoutineId]')
    .equals([date, careRoutineId])
    .first()

  if (!existing) {
    if (!skipped) return
    await db.careDoneLog.add({
      id: newId(),
      date,
      careRoutineId,
      skipped: true,
      createdAt: timestamp,
      updatedAt: timestamp,
    })
    return
  }

  // Ticks are left alone. Skipping a day you'd partly done and then unskipping
  // it used to wipe them; now they come back.
  await db.careDoneLog.update(existing.id, {
    skipped,
    deletedAt: undefined,
    updatedAt: timestamp,
  })
}

/* ---------- derived ---------- */

export function isComplete(
  done: CareDone | undefined,
  steps: CareStep[],
  ticked: Set<string>
): boolean {
  if (done?.skipped) return true
  if (steps.length === 0) return false
  return steps.every((s) => ticked.has(s.id))
}

/** Ticked step ids for a routine, grouped by date. */
async function ticksByDate(careRoutineId: string): Promise<Map<string, Set<string>>> {
  const rows = await db.careStepDone.where('careRoutineId').equals(careRoutineId).toArray()
  const map = new Map<string, Set<string>>()

  for (const row of rows) {
    if (!isLive(row)) continue
    const set = map.get(row.date) ?? new Set<string>()
    set.add(row.stepId)
    map.set(row.date, set)
  }

  return map
}

const EMPTY = new Set<string>()

export async function routineStreak(careRoutineId: string): Promise<number> {
  const [steps, allDone, ticks] = await Promise.all([
    getSteps(careRoutineId),
    db.careDoneLog.where('careRoutineId').equals(careRoutineId).toArray(),
    ticksByDate(careRoutineId),
  ])

  if (steps.length === 0) return 0

  const byDate = new Map(allDone.filter(isLive).map((d) => [d.date, d]))
  let streak = 0
  let cursor = todayISO()

  // Today not being done yet shouldn't break the streak.
  if (!isComplete(byDate.get(cursor), steps, ticks.get(cursor) ?? EMPTY)) {
    cursor = addDays(cursor, -1)
  }

  while (isComplete(byDate.get(cursor), steps, ticks.get(cursor) ?? EMPTY)) {
    streak++
    cursor = addDays(cursor, -1)
  }

  return streak
}

export async function completionRate(careRoutineId: string, days: number): Promise<number> {
  const [steps, allDone, ticks] = await Promise.all([
    getSteps(careRoutineId),
    db.careDoneLog.where('careRoutineId').equals(careRoutineId).toArray(),
    ticksByDate(careRoutineId),
  ])

  if (steps.length === 0) return 0

  const byDate = new Map(allDone.filter(isLive).map((d) => [d.date, d]))
  let completed = 0

  for (let i = 0; i < days; i++) {
    const date = addDays(todayISO(), -i)
    if (isComplete(byDate.get(date), steps, ticks.get(date) ?? EMPTY)) completed++
  }

  return Math.round((completed / days) * 100)
}