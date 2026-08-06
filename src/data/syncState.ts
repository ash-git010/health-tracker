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

export async function getLastSyncedAt(): Promise<string | undefined> {
  return (await getSyncState()).lastSyncedAt
}

export async function setLastSyncedAt(timestamp: string): Promise<void> {
  await patch({ lastSyncedAt: timestamp })
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
  }
}