import Dexie, { type Table } from 'dexie'
import type {
  Goals, Profile, Food, LogEntry, BodyMeasurement, Exercise, Workout, WorkoutSet,
  Routine, RoutineExercise, Program, ProgramDay,
  CareRoutine, CareStep, CareDone, CareStepDone,
} from './types'

// Local-only. Tracks sync progress; never pushed to the server.
export interface SyncState {
  key: string
  /**
   * @deprecated The old single global cursor. Never read as of the per-table
   * cursor change — kept only so existing rows type-check. Do not reintroduce:
   * one timestamp for fourteen tables cannot express "foods are current, care
   * routines have never synced", which is what caused the foreign key failures.
   */
  lastSyncedAt?: string
  /** Per-table sync cursors, keyed by SERVER table name (`log_entries`). */
  cursors?: Record<string, string>
  userId?: string
  migratedAt?: string
  authSkippedAt?: string
  /**
   * When the intro slideshow was finished, skipped, or bypassed via its log-in
   * link. Also stamped silently for anyone who already had a profile when this
   * version arrived — an existing tester does not need the app explained.
   */
  onboardingSeenAt?: string
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
  programs!: Table<Program, string>
  programDays!: Table<ProgramDay, string>
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

    // v2 — Programs. Only the new stores are declared; everything from v1
    // carries forward untouched, which is why v1 above must never be edited.
    //
    // isActive is deliberately absent from the index list. IndexedDB does not
    // accept booleans as keys, so an index on it would silently hold nothing
    // — the same trap as deletedAt. It is filtered in JS.
    //
    // Workout.programDayId and WorkoutSet.notes need no declaration here:
    // Dexie stores whole objects, and a non-indexed field rides along inside
    // one. Restating those stores would only add risk.
    this.version(2).stores({
      programs: 'id, name, createdAt, updatedAt',
      programDays: 'id, programId, [programId+week+dayIndex], updatedAt',
    })
  }
}

export const db = new UpkeepDB()