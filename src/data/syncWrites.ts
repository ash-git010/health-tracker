/**
 * Marks writes that came from sync itself rather than from the user.
 *
 * Sync's pull half writes through bulkPut, which fires the same Dexie hooks as
 * a user edit. Without this, every pull looks like a local change and schedules
 * another sync, which pulls, which schedules another.
 *
 * A depth counter rather than a boolean: writes nest, and a boolean would be
 * cleared by the inner one while the outer was still running.
 *
 * Deliberately a separate module. autoSync imports sync; if sync imported
 * autoSync back, that is a circular import.
 */

let depth = 0

/** True while sync is writing. Read by the autoSync hooks. */
export function isSyncWriting(): boolean {
  return depth > 0
}

export async function asSyncWrite<T>(fn: () => Promise<T>): Promise<T> {
  depth++
  try {
    return await fn()
  } finally {
    depth--
  }
}