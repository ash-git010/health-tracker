import { getDailyTotals } from './log'
import { listWorkouts } from './workouts'
import { listMeasurements } from './measurements'
import {
  listCareRoutines,
  getSteps,
  getDoneForDate,
  tickedStepIds,
  isComplete,
} from './careRoutines'
import { lastNDays, todayISO, addDays } from './dates'

export interface HubSummary {
  daysLogged: number | null
  workoutsThisWeek: number | null
  currentWeight: number | null
  routinesDone: { done: number; total: number } | null
}

export async function hubSummary(): Promise<HubSummary> {
  const [totals, workouts, measurements, routines] = await Promise.all([
    getDailyTotals(lastNDays(7)),
    listWorkouts(200),
    listMeasurements(),
    listCareRoutines(),
  ])

  const weekStart = addDays(todayISO(), -6)

  const loggedDays = totals.filter((d) => d.logged).length
  const weekWorkouts = workouts.filter((w) => w.date >= weekStart && w.finishedAt).length

  let routinesDone: HubSummary['routinesDone'] = null
  if (routines.length > 0) {
    const today = todayISO()

    // Was awaiting getSteps once per routine in sequence. Still one query per
    // routine, but they now run in parallel, and the day's ticks are a single
    // query for all routines rather than one each.
    const [done, ticked, stepLists] = await Promise.all([
      getDoneForDate(today),
      tickedStepIds(today),
      Promise.all(routines.map((r) => getSteps(r.id))),
    ])

    const doneByRoutine = new Map(done.map((d) => [d.careRoutineId, d]))

    let completed = 0
    routines.forEach((r, i) => {
      if (isComplete(doneByRoutine.get(r.id), stepLists[i], ticked)) completed++
    })
    routinesDone = { done: completed, total: routines.length }
  }

  return {
    daysLogged: totals.some((d) => d.logged) ? loggedDays : null,
    workoutsThisWeek: workouts.length > 0 ? weekWorkouts : null,
    currentWeight: measurements[0]?.weightKg ?? null,
    routinesDone,
  }
}