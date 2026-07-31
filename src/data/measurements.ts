import { db } from './db'
import type { BodyMeasurement } from './types'

export type MeasurementInput = Omit<BodyMeasurement, 'id' | 'createdAt'>

export async function listMeasurements(): Promise<BodyMeasurement[]> {
  const all = await db.measurements.orderBy('date').toArray()
  return all.reverse()
}

export async function getMeasurementForDate(
  date: string
): Promise<BodyMeasurement | undefined> {
  return db.measurements.where('date').equals(date).first()
}

export async function saveMeasurement(input: MeasurementInput): Promise<void> {
  const existing = await getMeasurementForDate(input.date)

  if (existing?.id) {
    await db.measurements.update(existing.id, input)
  } else {
    await db.measurements.add({ ...input, createdAt: new Date().toISOString() })
  }
}

export async function deleteMeasurement(id: number): Promise<void> {
  await db.measurements.delete(id)
}

export async function latestMeasurement(): Promise<BodyMeasurement | undefined> {
  const all = await listMeasurements()
  return all[0]
}

export function bmi(weightKg: number, heightCm: number): number {
  const m = heightCm / 100
  return Math.round((weightKg / (m * m)) * 10) / 10
}

export function weightChange(entries: BodyMeasurement[], days: number): number | null {
  if (entries.length < 2) return null

  const newest = entries[0]
  const cutoff = new Date(newest.date + 'T12:00:00')
  cutoff.setDate(cutoff.getDate() - days)

  const older = entries.find((e) => new Date(e.date + 'T12:00:00') <= cutoff)
  if (!older) return null

  return Math.round((newest.weightKg - older.weightKg) * 10) / 10
}