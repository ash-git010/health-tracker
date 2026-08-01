import Dexie, { type Table } from 'dexie'
import type { Goals, Food, LogEntry, BodyMeasurement, Profile, Exercise, Workout, WorkoutSet } from './types'

export class HealthDB extends Dexie {
  goals!: Table<Goals, number>
  foods!: Table<Food, number>
  logEntries!: Table<LogEntry, number>
  measurements!: Table<BodyMeasurement, number>
  profile!: Table<Profile, number>
  exercises!: Table<Exercise, number>
  workouts!: Table<Workout, number>
  workoutSets!: Table<WorkoutSet, number>

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

    this.version(3).stores({
      exercises: '++id, name, bodyPart, equipment',
      workouts: '++id, date',
      workoutSets: '++id, workoutId, exerciseKey, [exerciseKey+createdAt]',
    })
  }
}

export const db = new HealthDB()