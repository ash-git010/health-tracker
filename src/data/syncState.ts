import { db } from './db'
import type { SyncState } from './db'
import { now } from './ids'

/**
 * The syncState table holds a single row keyed 'main'. It is local-only and
 * never pushed to the server — it records what this device knows about its own
 * sync progress.
 *
 * Every write here reads the existing row first and merges. migrate.ts also
 * writes to this row (migratedAt), and a blind put would wipe that, causing the
 * one-time migration to run a second time.
 */

const KEY = 'main'

export async function getSyncState(): Promise<SyncState> {
  return (await db.syncState.get(KEY)) ?? { key: KEY }
}

async function patch(changes: Partial<Omit<SyncState, 'key'>>): Promise<void> {
  const current = await getSyncState()
  await db.syncState.put({ ...current, ...changes, key: KEY })
}

/** True if the user has chosen to carry on without an account. */
export async function hasSkippedAuth(): Promise<boolean> {
  return Boolean((await getSyncState()).authSkippedAt)
}

export async function setSkippedAuth(): Promise<void> {
  await patch({ authSkippedAt: now() })
}

/**
 * Called after a successful register or login — the user now has an account,
 * so the "no account linked" nudge should stop appearing.
 */
export async function clearSkippedAuth(): Promise<void> {
  await patch({ authSkippedAt: undefined })
}

// ---------------------------------------------------------------------------
// Onboarding
//
// Stamped when the intro is finished, skipped, or bypassed via its log-in link.
// Also stamped silently by resolveStage for anyone who already has a profile —
// an existing tester updating to this version has been using the app for weeks
// and does not need it explained.
// ---------------------------------------------------------------------------

export async function hasSeenOnboarding(): Promise<boolean> {
  return Boolean((await getSyncState()).onboardingSeenAt)
}

export async function setOnboardingSeen(): Promise<void> {
  await patch({ onboardingSeenAt: now() })
}

/** Lets the intro be watched again from About, and re-tested in development. */
export async function clearOnboardingSeen(): Promise<void> {
  await patch({ onboardingSeenAt: undefined })
}

// ---------------------------------------------------------------------------
// Language
//
// undefined means "never chosen", which is what puts the language screen in
// front of a new user. Distinct from 'en', which means they chose English.
// ---------------------------------------------------------------------------

export async function getStoredLanguage(): Promise<'en' | 'de' | undefined> {
  return (await getSyncState()).language
}

export async function setStoredLanguage(language: 'en' | 'de'): Promise<void> {
  await patch({ language })
}


// ---------------------------------------------------------------------------
// Sync cursors
//
// One cursor per table, keyed by SERVER table name ('log_entries', not
// 'logEntries') so the key matches TableSync.name in sync.ts and there is no
// second naming convention to keep in step.
//
// A missing key means "this table has never synced", which is the correct
// starting state for every device: a fresh install, an existing tester after
// this update, and anything left behind by the old global cursor. Nothing reads
// the old `lastSyncedAt` any more, so all three are the same path — push
// everything, pull everything, once.
// ---------------------------------------------------------------------------

export async function getCursors(): Promise<Record<string, string>> {
  return (await getSyncState()).cursors ?? {}
}

/** Merges the given cursors over the stored ones. Tables not named are left alone. */
export async function setCursors(advanced: Record<string, string>): Promise<void> {
  const current = await getSyncState()
  await patch({ cursors: { ...(current.cursors ?? {}), ...advanced } })
}

/** Forces one table to resync from scratch on the next run. */
export async function clearCursor(table: string): Promise<void> {
  const current = await getSyncState()
  const next = { ...(current.cursors ?? {}) }
  delete next[table]
  await patch({ cursors: next })
}

/** Forces a full resync of everything on the next run. */
export async function clearCursors(): Promise<void> {
  await patch({ cursors: {} })
}

// ---------------------------------------------------------------------------
// Device ownership
//
// Set after this device's first successful sync. Compared on every automatic
// sync so a second person logging in on the same phone cannot silently absorb
// the first person's data.
// ---------------------------------------------------------------------------

export async function getSyncUserId(): Promise<string | undefined> {
  return (await getSyncState()).userId
}

export async function setSyncUserId(userId: string): Promise<void> {
  await patch({ userId })
}

/** Hands the device to a different account. Does not touch local data. */
export async function clearSyncUser(): Promise<void> {
  await patch({ userId: undefined, cursors: {} })
}

// Development only, for resetting first-run state without hand-editing
// IndexedDB. Deleting the whole 'main' row by hand would also clear
// migratedAt, which would re-run the one-time migration. Vite strips this
// branch from production builds.
if (import.meta.env.DEV) {
  ;(window as unknown as Record<string, unknown>).upkeepSync = {
    getSyncState,
    setSkippedAuth,
    clearSkippedAuth,
    clearOnboardingSeen,
  }
}