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

export async function getFolderOrder(): Promise<string[]> {
  const profile = await getProfile()
  return profile?.folderOrder ?? []
}

export async function saveFolderOrder(order: string[]): Promise<void> {
  const profile = await getProfile()
  if (!profile) return
  await db.profile.put({ ...profile, folderOrder: order })
}