import Dexie, { type Table } from 'dexie'
import type {
  Goals, Profile, Food, LogEntry, BodyMeasurement, Exercise, Workout, WorkoutSet,
  Routine, RoutineExercise, CareRoutine, CareStep, CareDone, CareStepDone,
} from './types'

// Local-only. Tracks sync progress; never pushed to the server.
export interface SyncState {
  key: string
  lastSyncedAt?: string
  migratedAt?: string
  // Set when the user chooses to carry on without an account, so the gate
  // does not reappear every launch. Non-indexed, so no version bump needed.
  authSkippedAt?: string
}

export class UpkeepDB extends Dexie {
  // Singletons — one row, fixed numeric id.
  goals!: Table<Goals, number>
  profile!: Table<Profile, number>

  // Synced entities — UUID primary keys minted on the device.
  foods!: Table<Food, string>
  logEntries!: Table<LogEntry, string>
  measurements!: Table<BodyMeasurement, string>
  exercises!: Table<Exercise, string>
  workouts!: Table<Workout, string>
  workoutSets!: Table<WorkoutSet, string>
  routines!: Table<Routine, string>
  routineExercises!: Table<RoutineExercise, string>
  careRoutines!: Table<CareRoutine, string>
  careSteps!: Table<CareStep, string>
  careDoneLog!: Table<CareDone, string>
  careStepDone!: Table<CareStepDone, string>

  // Local bookkeeping.
  syncState!: Table<SyncState, string>

  constructor() {
    super('UpkeepDB')

    this.version(1).stores({
      goals: 'id',
      profile: 'id',

      foods: 'id, name, createdAt, updatedAt',
      logEntries: 'id, date, foodId, [date+meal], updatedAt',
      measurements: 'id, date, updatedAt',

      exercises: 'id, name, bodyPart, equipment, updatedAt',
      workouts: 'id, date, routineId, updatedAt',
      workoutSets: 'id, workoutId, exerciseKey, [exerciseKey+createdAt], updatedAt',

      routines: 'id, name, folder, createdAt, updatedAt',
      routineExercises: 'id, routineId, [routineId+order], updatedAt',

      careRoutines: 'id, kind, timeOfDay, updatedAt',
      careSteps: 'id, careRoutineId, [careRoutineId+order], updatedAt',
      careDoneLog: 'id, date, careRoutineId, [date+careRoutineId], updatedAt',
      careStepDone: 'id, date, careRoutineId, stepId, [date+careRoutineId], updatedAt',

      syncState: 'key',
    })
  }
}

export const db = new UpkeepDB()