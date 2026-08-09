import type { Table } from 'dexie'
import { db } from './db'
import { syncAll, type SyncReport } from './sync'
import { isSyncWriting } from './syncWrites'
import { getCurrentUser, onAuthChange } from './auth'
import { getSyncUserId, clearSyncUser } from './syncState'

/**
 * Decides *when* syncAll runs. syncAll itself knows nothing about this file.
 *
 * Four triggers: app open, a debounced window after local writes, returning to
 * a backgrounded tab, and regaining connectivity. On a phone the app is almost
 * never cold-started — it is woken from the app switcher days later — so
 * visibilitychange matters more than app open.
 */

const FIRST_RUN_TIMEOUT_MS = 8_000
const WRITE_DEBOUNCE_MS = 5_000
const OPPORTUNISTIC_MIN_GAP_MS = 30_000

let started = false
let inFlight: Promise<SyncReport | null> | null = null
let writeTimer: ReturnType<typeof setTimeout> | null = null
let lastRunAt = 0

/** Dev-only record of what ran, so a test is one command instead of counting requests. */
const runs: { at: string; trigger: string; pushed: number; pulled: number; error?: string }[] = []
let pendingTrigger = 'startup'

// Tables whose contents sync. syncState is deliberately absent: it is
// local-only, and hooking it would make writing a cursor trigger a sync.
const HOOKED = [
  db.goals, db.profile, db.foods, db.logEntries, db.measurements,
  db.exercises, db.workouts, db.workoutSets, db.routines, db.routineExercises,
  db.careRoutines, db.careSteps, db.careDoneLog, db.careStepDone,
] as unknown as Table<unknown, unknown>[]

async function run(): Promise<SyncReport | null> {
  const trigger = pendingTrigger
  const user = await getCurrentUser()
  if (!user) return null

  // Only adoption claims a device. An unclaimed device is refused here just as
  // firmly as one belonging to someone else: at login the auth trigger fires
  // while the decision screen is still rendering, and letting it through would
  // merge two people's data before the user had chosen anything.
  const owner = await getSyncUserId()
  if (owner !== user.id) {
    console.warn(
      '[autoSync] This device has not been claimed by the signed-in account. ' +
      'Automatic sync is paused until the adoption screen resolves it.'
    )
    runs.push({ at: new Date().toISOString(), trigger, pushed: 0, pulled: 0, error: 'unclaimed device' })
    return null
  }

  let report: SyncReport
  try {
    report = await syncAll()
  } finally {
    lastRunAt = Date.now()
  }

  runs.push({
    at: new Date().toISOString(),
    trigger,
    pushed: report.pushed,
    pulled: report.pulled,
    error: report.error,
  })

  if (report.error) {
    // No retry and no backoff on purpose. A failure here is usually Supabase
    // paused after 7 days idle, or no connection — both resolve themselves,
    // and the next natural trigger picks the same range back up because the
    // cursors did not advance.
    console.warn('[autoSync] sync failed:', report.error)
  }

  return report
}

/**
 * Runs a sync, or joins the one already running. Two triggers firing together
 * — adding a food just as connectivity returns — would otherwise both capture
 * startedAt, both push, and race on the cursor write.
 */
export function syncNow(trigger = 'manual'): Promise<SyncReport | null> {
  if (inFlight) return inFlight
  pendingTrigger = trigger
  inFlight = run().finally(() => {
    inFlight = null
  })
  return inFlight
}

/**
 * Waits for a sync before the first-run stages decide anything, so a device
 * logging into an existing account gets the server's name and goals instead of
 * being asked to invent new ones.
 *
 * Bounded on purpose. A Supabase project paused after 7 days idle takes ~30
 * seconds to wake, and blocking that long on a loading screen reads as a
 * crash. On timeout the caller carries on with whatever is local; the sync is
 * still running and lands when it lands.
 */
export async function syncBeforeFirstRun(): Promise<void> {
  await Promise.race([
    syncNow('first-run').catch(() => null),
    new Promise((resolve) => setTimeout(resolve, FIRST_RUN_TIMEOUT_MS)),
  ])
}

function scheduleFromWrite(): void {
  if (writeTimer) clearTimeout(writeTimer)
  writeTimer = setTimeout(() => {
    writeTimer = null
    void syncNow('write')
  }, WRITE_DEBOUNCE_MS)
}

function onLocalWrite(): void {
  // Sync's own pull writes are ignored outright rather than remembered. An
  // earlier version remembered them and rescheduled, so every sync that pulled
  // a row queued another one five seconds later, indefinitely.
  if (isSyncWriting()) return
  scheduleFromWrite()
}

/** Triggers that fire on their own schedule, so they need a floor. */
function opportunistic(trigger: string): void {
  if (Date.now() - lastRunAt < OPPORTUNISTIC_MIN_GAP_MS) return
  void syncNow(trigger)
}

/**
 * Idempotent, and never torn down. StrictMode double-invokes effects in dev,
 * and the app never unmounts in production, so a `started` guard is simpler
 * and safer than unsubscribing.
 */
export function startAutoSync(): void {
  if (started) return
  started = true

  for (const t of HOOKED) {
    // Block bodies, not expressions: Dexie treats a returned value from
    // 'creating' as the primary key and from 'updating' as a modifications
    // object. These must return undefined.
    t.hook('creating', () => {
      onLocalWrite()
    })
    t.hook('updating', () => {
      onLocalWrite()
    })
    t.hook('deleting', () => {
      onLocalWrite()
    })
  }

  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') opportunistic('visible')
  })

  // No floor here: regaining connectivity is a real event, not tab-flicking.
  window.addEventListener('online', () => {
    void syncNow('online')
  })

  onAuthChange((user) => {
    // Deferred out of the callback. supabase-js holds an internal lock while
    // it runs this, and calling back into supabase.auth from inside it can
    // deadlock. setTimeout(0) puts the work on the next task instead.
    if (user) setTimeout(() => void syncNow('auth'), 0)
  })

  void syncNow('startup')
}

if (import.meta.env.DEV) {
  ;(window as unknown as Record<string, unknown>).upkeepAutoSync = {
    syncNow,
    /** Every sync since page load, newest last. */
    log: () => console.table(runs),
    count: () => runs.length,
    reset: () => {
      runs.length = 0
    },
    state: () => ({
      started,
      inFlight: inFlight !== null,
      writeTimerPending: writeTimer !== null,
      lastRunAt: lastRunAt ? new Date(lastRunAt).toISOString() : null,
    }),
    // Hands the device to whoever is signed in now, clearing cursors.
    // Stand-in for data adoption until §10.4 exists.
    claimDevice: clearSyncUser,
  }
}