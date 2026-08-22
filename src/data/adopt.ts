import type { Table } from 'dexie'
import { db } from './db'
import { supabase } from './supabase'
import { getCurrentUser } from './auth'
import { syncAll, pullGoals, pullProfile, SYNC_TABLE_NAMES, type SyncReport } from './sync'
import { asSyncWrite } from './syncWrites'
import { clearCursors, setSyncUserId } from './syncState'
import { exportAll, downloadBackup } from './backup'
import { isLive, now } from './ids'
import { t } from './i18n'

/**
 * Deciding what happens when a device with local data signs into an account.
 *
 * Every synced row carries a device-minted UUID, so merging two histories
 * cannot collide — the worst case is a duplicate the user deletes, never a
 * corrupted row. That is why merge is the safe default and the other two modes
 * are the ones that need a backup first.
 *
 * The singletons are the exception: goals and profile are one row each and
 * cannot be merged in any meaningful sense, so one of them wins outright.
 */

// Local Dexie table for each server table name. Kept here rather than on
// TableSync because sync.ts has no reason to know about wholesale clearing.
// The check below fails loudly if sync.ts gains a table and this does not.
const LOCAL_BY_SERVER: Record<string, Table<{ deletedAt?: string }, string>> = {
  foods: db.foods,
  log_entries: db.logEntries,
  measurements: db.measurements,
  custom_exercises: db.exercises,
  routines: db.routines,
  routine_exercises: db.routineExercises,
  workouts: db.workouts,
  workout_sets: db.workoutSets,
  care_routines: db.careRoutines,
  care_steps: db.careSteps,
  care_done_log: db.careDoneLog,
  care_step_done: db.careStepDone,
} as unknown as Record<string, Table<{ deletedAt?: string }, string>>

if (import.meta.env.DEV) {
  const missing = SYNC_TABLE_NAMES.filter((n) => !(n in LOCAL_BY_SERVER))
  if (missing.length > 0) {
    throw new Error(`adopt.ts is missing local tables for: ${missing.join(', ')}`)
  }
}

/**
 * Display names, for the screen that shows both sides before choosing.
 *
 * A function, not a const: a module-level object literal evaluates once at
 * import and would freeze whatever language happened to be active then, so
 * switching afterwards would leave this table in the old one. Called during
 * render instead, which costs nothing at twelve keys.
 *
 * The keys are server table names and stay English — they are identifiers, not
 * content, and they must keep matching SYNC_TABLE_NAMES.
 */
export function tableLabels(): Record<string, string> {
  return {
    foods: t('adopt.table.foods'),
    log_entries: t('adopt.table.logEntries'),
    measurements: t('adopt.table.measurements'),
    custom_exercises: t('adopt.table.customExercises'),
    routines: t('adopt.table.routines'),
    routine_exercises: t('adopt.table.routineExercises'),
    workouts: t('adopt.table.workouts'),
    workout_sets: t('adopt.table.workoutSets'),
    care_routines: t('adopt.table.careRoutines'),
    care_steps: t('adopt.table.careSteps'),
    care_done_log: t('adopt.table.careDoneLog'),
    care_step_done: t('adopt.table.careStepDone'),
  }
}

export type AdoptMode = 'merge' | 'keep-local' | 'keep-account'

export interface SingletonPreview {
  /** Whose copy will survive, and therefore what the user is about to lose. */
  winner: 'local' | 'account' | 'neither'
  localUpdatedAt?: string
  accountUpdatedAt?: string
}

export interface AdoptPreview {
  local: Record<string, number>
  account: Record<string, number>
  localTotal: number
  accountTotal: number
  goals: SingletonPreview
  profile: SingletonPreview
}

// ---------------------------------------------------------------------------
// Counting
// ---------------------------------------------------------------------------

async function localCounts(): Promise<Record<string, number>> {
  const out: Record<string, number> = {}
  for (const name of SYNC_TABLE_NAMES) {
    // Soft-deleted rows are still in Dexie. Counting them would tell the user
    // they have data they cannot see.
    out[name] = await LOCAL_BY_SERVER[name].filter(isLive).count()
  }
  return out
}

async function accountCounts(): Promise<Record<string, number>> {
  const out: Record<string, number> = {}
  for (const name of SYNC_TABLE_NAMES) {
    // head: true asks for the count without transferring any rows. RLS scopes
    // this to the signed-in user, so no user_id filter is needed.
    const { count, error } = await supabase
      .from(name)
      .select('*', { count: 'exact', head: true })
      .is('deleted_at', null)
    if (error) throw new Error(`${name} count: ${error.message}`)
    out[name] = count ?? 0
  }
  return out
}

async function singletonPreview(
  table: 'goals' | 'profile'
): Promise<SingletonPreview> {
  const local = await (table === 'goals' ? db.goals.get(1) : db.profile.get(1))
  const { data, error } = await supabase.from(table).select('updated_at').maybeSingle()
  if (error) throw new Error(`${table} preview: ${error.message}`)

  const localAt = local?.updatedAt
  const accountAt = (data?.updated_at as string | undefined) ?? undefined

  if (!localAt && !accountAt) return { winner: 'neither' }
  if (!accountAt) return { winner: 'local', localUpdatedAt: localAt }
  if (!localAt) return { winner: 'account', accountUpdatedAt: accountAt }

   // Compared as instants, not strings. Postgres returns '+00:00' where
  // JavaScript's toISOString gives 'Z' — the same moment, but 'Z' sorts after
  // '+' as text, so a string comparison calls two identical timestamps
  // different and picks local as the winner.
  return {
    winner: Date.parse(localAt) > Date.parse(accountAt) ? 'local' : 'account',
    localUpdatedAt: localAt,
    accountUpdatedAt: accountAt,
  }
}

/**
 * Reads both sides without changing anything, so the choice can be made on
 * real numbers rather than in the abstract.
 *
 * Note the singleton verdicts reflect a *merge*. Choosing keep-local or
 * keep-account overrides them.
 */
export async function previewAdoption(): Promise<AdoptPreview> {
  const user = await getCurrentUser()
  if (!user) throw new Error('Not signed in')

  const [local, account, goals, profile] = await Promise.all([
    localCounts(),
    accountCounts(),
    singletonPreview('goals'),
    singletonPreview('profile'),
  ])

  const sum = (r: Record<string, number>) => Object.values(r).reduce((a, b) => a + b, 0)

  return {
    local,
    account,
    localTotal: sum(local),
    accountTotal: sum(account),
    goals,
    profile,
  }
}

/**
 * True if this device holds anything worth deciding about. Stops at the first
 * hit rather than counting everything, since the answer is usually yes.
 */
export async function hasLocalData(): Promise<boolean> {
  for (const name of SYNC_TABLE_NAMES) {
    const count = await LOCAL_BY_SERVER[name].filter(isLive).count()
    if (count > 0) return true
  }
  // A name typed at onboarding counts, even on a device with no rows anywhere.
  return (await db.profile.get(1)) !== undefined
}

// ---------------------------------------------------------------------------
// Adopting
// ---------------------------------------------------------------------------

/** Soft-deletes every live server row. Tombstones, so other devices learn too. */
async function softDeleteAccountRows(userId: string): Promise<number> {
  const stamp = now()
  let total = 0

  // Order does not matter: nothing is removed, so no foreign key can break.
  for (const name of SYNC_TABLE_NAMES) {
    const { data, error } = await supabase
      .from(name)
      .update({ deleted_at: stamp, updated_at: stamp })
      .eq('user_id', userId)
      .is('deleted_at', null)
      .select('id')
    if (error) throw new Error(`${name} soft delete: ${error.message}`)
    total += data?.length ?? 0
  }

  return total
}

/** Empties every local table. Wrapped so the Dexie hooks do not fire a sync mid-wipe. */
async function clearLocalTables(): Promise<void> {
  const tables = [
    db.goals, db.profile,
    ...SYNC_TABLE_NAMES.map((n) => LOCAL_BY_SERVER[n]),
  ] as unknown as Table<unknown, unknown>[]

  await asSyncWrite(() =>
    db.transaction('rw', tables, async () => {
      await Promise.all(tables.map((t) => t.clear()))
    })
  )
}

export interface AdoptResult {
  mode: AdoptMode
  /** Rows tombstoned server-side. keep-local only. */
  removedFromAccount?: number
  sync: SyncReport
}

/**
 * Commits one of the three choices, then syncs.
 *
 * The device is claimed *before* the sync, not after. If the sync fails
 * halfway, an unclaimed device would fall through the ownership guard on the
 * next automatic run and merge without asking.
 *
 * keep-account is the only path in the app that destroys local data. The
 * confirmation for it belongs in the UI; this function assumes it was given.
 */
export async function adoptAccount(
  mode: AdoptMode,
  options: { backup?: boolean } = {}
): Promise<AdoptResult> {
  const user = await getCurrentUser()
  if (!user) throw new Error('Not signed in')

  // Captured and written to disk before anything is touched. A merge cannot
  // lose a row, but it can produce duplicates that are tedious to unpick by
  // hand, and this file is what makes that recoverable.
  //
  // Skipped when the caller knows there is nothing to lose — an empty device,
  // or an empty account. Downloading an empty backup would only confuse.
  if (options.backup !== false) {
    const backup = await exportAll()
    downloadBackup(backup)
  }
  let removedFromAccount: number | undefined

  if (mode === 'merge') {
    // Singletons resolve BEFORE the push. syncAll pushes first, and pushGoals
    // upserts unconditionally when the cursor is empty — so without this, the
    // account's goals would be overwritten by this device's regardless of
    // which was newer, and the comparison inside pullGoals would never run.
    await pullGoals(undefined)
    await pullProfile(undefined)
  }

  if (mode === 'keep-local') {
    // Before the push, not after: tombstoning afterwards would also kill the
    // rows this device had just sent up.
    removedFromAccount = await softDeleteAccountRows(user.id)
  }

  if (mode === 'keep-account') {
    await clearLocalTables()
  }

  await clearCursors()

  const sync = await syncAll()

  // syncAll reports errors rather than throwing, so an unchecked call is
  // indistinguishable from success — which is how a device got claimed by an
  // account it had failed to push a single row into.
  //
  // Throwing leaves the device unclaimed, and autoSync refuses unclaimed
  // devices, so nothing syncs behind the user's back while the screen offers
  // a retry.
  if (sync.error) throw new Error(sync.error)

  await setSyncUserId(user.id)

  return { mode, removedFromAccount, sync }
}

if (import.meta.env.DEV) {
  ;(window as unknown as Record<string, unknown>).upkeepAdopt = {
    preview: previewAdoption,
    adopt: adoptAccount,
    // Now a function — call it as upkeepAdopt.labels(), not upkeepAdopt.labels.
    labels: tableLabels,
  }
}