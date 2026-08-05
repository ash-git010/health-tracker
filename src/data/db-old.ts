import Dexie, { type Table } from 'dexie'
import type {
  Goals, Food, LogEntry, BodyMeasurement, Profile, Exercise, Workout, WorkoutSet,
  Routine, RoutineExercise, CareRoutine, CareStep, CareDone,
} from './types-old'

export class HealthDB extends Dexie {
  goals!: Table<Goals, number>
  foods!: Table<Food, number>
  logEntries!: Table<LogEntry, number>
  measurements!: Table<BodyMeasurement, number>
  profile!: Table<Profile, number>
  exercises!: Table<Exercise, number>
  workouts!: Table<Workout, number>
  workoutSets!: Table<WorkoutSet, number>
  routines!: Table<Routine, number>
  routineExercises!: Table<RoutineExercise, number>
  careRoutines!: Table<CareRoutine, number>
  careSteps!: Table<CareStep, number>
  careDoneLog!: Table<CareDone, number>

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

    this.version(4).stores({
      routines: '++id, name, folder, createdAt',
      routineExercises: '++id, routineId, [routineId+order]',
    })
    this.version(5).stores({
      careRoutines: '++id, kind, timeOfDay',
      careSteps: '++id, careRoutineId, [careRoutineId+order]',
      careDoneLog: '++id, date, careRoutineId, [date+careRoutineId]',
    })
  }
}

export const db = new HealthDB()