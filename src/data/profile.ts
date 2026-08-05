import { db } from './db'
import { now } from './ids'
import type { Profile } from './types'

const PROFILE_ID = 1

export async function getProfile(): Promise<Profile | undefined> {
  return db.profile.get(PROFILE_ID)
}

export async function saveName(name: string): Promise<void> {
  const existing = await getProfile()
  await db.profile.put({
    ...existing,
    id: PROFILE_ID,
    name: name.trim(),
    createdAt: existing?.createdAt ?? now(),
    updatedAt: now(),
  })
}

export async function getFolderOrder(): Promise<string[]> {
  const profile = await getProfile()
  return profile?.folderOrder ?? []
}

export async function saveFolderOrder(order: string[]): Promise<void> {
  const profile = await getProfile()
  if (!profile) return
  await db.profile.put({ ...profile, folderOrder: order, updatedAt: now() })
}