import Dexie, { type Table } from 'dexie'
import type { Goals, Food, LogEntry, BodyMeasurement, Profile } from './types'

export class HealthDB extends Dexie {
  goals!: Table<Goals, number>
  foods!: Table<Food, number>
  logEntries!: Table<LogEntry, number>
  measurements!: Table<BodyMeasurement, number>
  profile!: Table<Profile, number>

  constructor() {
    super('HealthTrackerDB')

    this.version(1).stores({
      goals: 'id',
      foods: '++id, name, createdAt',
      logEntries: '++id, date, foodId, [date+meal]',
      measurements: '++id, date',
    })

    this.version(2).stores({
      profile: 'id',
    })
  }
}

export const db = new HealthDB()