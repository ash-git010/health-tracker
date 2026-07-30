import Dexie, { type Table } from 'dexie'
import type { Goals, Food, LogEntry, BodyMeasurement } from './types'

export class HealthDB extends Dexie {
  goals!: Table<Goals, number>
  foods!: Table<Food, number>
  logEntries!: Table<LogEntry, number>
  measurements!: Table<BodyMeasurement, number>

  constructor() {
    super('HealthTrackerDB')
    this.version(1).stores({
      goals: 'id',
      foods: '++id, name, createdAt',
      logEntries: '++id, date, foodId, [date+meal]',
      measurements: '++id, date',
    })
  }
}

export const db = new HealthDB()