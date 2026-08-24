import { db } from './db'
import { newId, now, isLive } from './ids'
import { todayISO, addDays } from './dates'
import type { Program, ProgramDay } from './types'

export async function listPrograms(): Promise<Program[]> {
  const all = await db.programs.toArray()
  return all
    .filter(isLive)
    .sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0) || a.name.localeCompare(b.name))
}

export async function getProgram(id: string): Promise<Program | null> {
  const program = await db.programs.get(id)
  return program && isLive(program) ? program : null
}

/** At most one program is active at a time — enforced by the client, not the
 *  database (the migration deliberately carries no unique index; see its
 *  comment on why a partial unique index would fail sync under
 *  last-write-wins). */
export async function activeProgram(): Promise<Program | null> {
  const all = await db.programs.toArray()
  return all.find((p) => isLive(p) && p.isActive) ?? null
}

export async function createProgram(name: string): Promise<string> {
  const timestamp = now()
  const id = newId()
  await db.programs.add({
    id,
    name,
    repeats: false,
    isActive: false,
    createdAt: timestamp,
    updatedAt: timestamp,
  })
  return id
}

export async function updateProgram(
  id: string,
  changes: Partial<Pick<Program, 'name' | 'notes' | 'repeats' | 'weekNotes' | 'sortOrder'>>
): Promise<void> {
  await db.programs.update(id, { ...changes, updatedAt: now() })
}

export async function deleteProgram(id: string): Promise<void> {
  const timestamp = now()
  await db.transaction('rw', [db.programs, db.programDays], async () => {
    await db.programDays
      .where('programId')
      .equals(id)
      .modify({ deletedAt: timestamp, updatedAt: timestamp })
    await db.programs.update(id, { deletedAt: timestamp, updatedAt: timestamp })
  })
}

/**
 * Deactivates any other active program first, then activates this one.
 * `startedOn` is set only if it was never set — reactivating a program you
 * merely stepped away from resumes where its schedule already was, rather
 * than restarting week 1. A deliberate restart is a separate action.
 */
export async function activateProgram(id: string): Promise<void> {
  const timestamp = now()
  await db.transaction('rw', db.programs, async () => {
    const all = await db.programs.toArray()
    for (const p of all) {
      if (isLive(p) && p.isActive && p.id !== id) {
        await db.programs.update(p.id, { isActive: false, updatedAt: timestamp })
      }
    }
    const target = all.find((p) => p.id === id)
    await db.programs.update(id, {
      isActive: true,
      startedOn: target?.startedOn ?? todayISO(),
      updatedAt: timestamp,
    })
  })
}

/** The Log tab's "tap the program name" action — deactivates only. Deleting
 *  a program happens from the routines/programs list screen instead. */
export async function deactivateProgram(id: string): Promise<void> {
  await db.programs.update(id, { isActive: false, updatedAt: now() })
}

/** Starts a program over: today becomes day 1 again. */
export async function restartProgram(id: string): Promise<void> {
  await db.programs.update(id, { startedOn: todayISO(), updatedAt: now() })
}

export async function getProgramDays(programId: string): Promise<ProgramDay[]> {
  const all = await db.programDays.where('programId').equals(programId).toArray()
  return all.filter(isLive).sort((a, b) => a.week - b.week || a.dayIndex - b.dayIndex)
}

export interface ProgramDayInput {
  week: number
  dayIndex: number
  routineId?: string
}

/**
 * Reconciles by (week, dayIndex) rather than wiping and re-adding — the same
 * discipline as setRoutineExercises, for the same reason: a fresh id per save
 * would tombstone-flood the sync log.
 */
export async function setProgramDays(programId: string, days: ProgramDayInput[]): Promise<void> {
  const timestamp = now()

  await db.transaction('rw', db.programDays, async () => {
    const existing = (
      await db.programDays.where('programId').equals(programId).toArray()
    ).filter(isLive)
    const existingByKey = new Map(existing.map((d) => [`${d.week}:${d.dayIndex}`, d]))
    const seen = new Set<string>()

    for (const input of days) {
      const key = `${input.week}:${input.dayIndex}`
      seen.add(key)
      const row = existingByKey.get(key)

      if (row) {
        await db.programDays.update(row.id, {
          routineId: input.routineId || undefined,
          updatedAt: timestamp,
        })
      } else {
        await db.programDays.add({
          id: newId(),
          programId,
          week: input.week,
          dayIndex: input.dayIndex,
          routineId: input.routineId || undefined,
          createdAt: timestamp,
          updatedAt: timestamp,
        })
      }
    }

    for (const row of existing) {
      if (!seen.has(`${row.week}:${row.dayIndex}`)) {
        await db.programDays.update(row.id, { deletedAt: timestamp, updatedAt: timestamp })
      }
    }
  })
}

export function definedWeekCount(days: ProgramDay[]): number {
  return days.reduce((max, d) => Math.max(max, d.week), 0)
}

function daysBetween(startISO: string, endISO: string): number {
  const start = new Date(startISO + 'T12:00:00').getTime()
  const end = new Date(endISO + 'T12:00:00').getTime()
  return Math.round((end - start) / 86400000)
}

/** The week number to DISPLAY — keeps climbing even for a repeating program.
 *  Week 5 of a 4-week repeating program still reads "Week 5" (§12.16). */
export function currentWeekNumber(program: Program, today = todayISO()): number {
  if (!program.startedOn) return 1
  return Math.max(1, Math.floor(daysBetween(program.startedOn, today) / 7) + 1)
}

/** 1-7. Day 1 is whatever calendar day the program was made active, not Monday. */
export function currentDayIndex(program: Program, today = todayISO()): number {
  if (!program.startedOn) return 1
  const daysSince = daysBetween(program.startedOn, today)
  return (((daysSince % 7) + 7) % 7) + 1
}

/** The week number to READ program_days at — wraps for a repeating program.
 *  This is what diverges from currentWeekNumber; see its comment. */
export function scheduleWeekFor(program: Program, weekCount: number, climbingWeek: number): number {
  if (!program.repeats || weekCount <= 0) return climbingWeek
  return ((climbingWeek - 1) % weekCount) + 1
}

/** The calendar date the current climbing week began — day 1 of THIS cycle,
 *  not the program's original start. A repeating program reuses the same
 *  ProgramDay rows every cycle, so "was this day done" needs a cutoff that
 *  moves with the current week rather than the program's whole history. */
export function weekStartISO(program: Program, today = todayISO()): string {
  if (!program.startedOn) return today
  const week = currentWeekNumber(program, today)
  return addDays(program.startedOn, (week - 1) * 7)
}

export function todaysProgramDay(
  program: Program,
  days: ProgramDay[],
  today = todayISO()
): ProgramDay | undefined {
  const weekCount = definedWeekCount(days)
  const scheduleWeek = scheduleWeekFor(program, weekCount, currentWeekNumber(program, today))
  const dayIndex = currentDayIndex(program, today)
  return days.find((d) => d.week === scheduleWeek && d.dayIndex === dayIndex)
}

/** A non-repeating program past its last defined week is finished. */
export function isProgramComplete(program: Program, days: ProgramDay[], today = todayISO()): boolean {
  if (program.repeats) return false
  const weekCount = definedWeekCount(days)
  return weekCount > 0 && currentWeekNumber(program, today) > weekCount
}
