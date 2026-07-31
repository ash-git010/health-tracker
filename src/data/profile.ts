import { db } from './db'
import type { Profile } from './types'

const PROFILE_ID = 1

export async function getProfile(): Promise<Profile | undefined> {
  return db.profile.get(PROFILE_ID)
}

export async function saveName(name: string): Promise<void> {
  await db.profile.put({
    id: PROFILE_ID,
    name: name.trim(),
    createdAt: new Date().toISOString(),
  })
}