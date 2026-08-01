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

export interface WeightPoint {
  date: string
  weightKg: number
  trend: number
}

export function toChartPoints(entries: BodyMeasurement[], days: number): WeightPoint[] {
  const cutoff = new Date()
  cutoff.setDate(cutoff.getDate() - days)
  const cutoffISO = cutoff.toISOString().slice(0, 10)

  const inRange = entries
    .filter((e) => e.date >= cutoffISO)
    .slice()
    .sort((a, b) => a.date.localeCompare(b.date))

  return inRange.map((e, i) => {
    const window = inRange.slice(Math.max(0, i - 6), i + 1)
    const avg = window.reduce((sum, w) => sum + w.weightKg, 0) / window.length
    return {
      date: e.date,
      weightKg: e.weightKg,
      trend: Math.round(avg * 10) / 10,
    }
  })
}