import { useCallback, useEffect, useState } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { Layout } from './Layout'
import { HubScreen } from './features/hub/HubScreen'
import { TodayScreen } from './features/log/TodayScreen'
import { AddEntryScreen } from './features/log/AddEntryScreen'
import { FoodListScreen } from './features/foods/FoodListScreen'
import { FoodFormScreen } from './features/foods/FoodFormScreen'
import { FoodSearchScreen } from './features/foods/FoodSearchScreen'
import { BarcodeScanScreen } from './features/foods/BarcodeScanScreen'
import { GoalsScreen } from './features/goals/GoalsScreen'
import { ChartsScreen } from './features/log/ChartsScreen'
import { BodyScreen } from './features/body/BodyScreen'
import { MeasurementFormScreen } from './features/body/MeasurementFormScreen'
import { SettingsScreen } from './features/settings/SettingsScreen'
import { AboutScreen } from './features/about/AboutScreen'
import { FeedbackScreen } from './features/about/FeedbackScreen'
import { NameScreen } from './features/onboarding/NameScreen'
import { AuthGateScreen } from './features/auth/AuthGateScreen'
import { RegisterScreen } from './features/auth/RegisterScreen'
import { LoginScreen } from './features/auth/LoginScreen'
import { AccountScreen } from './features/auth/AccountScreen'
import { getGoals } from './data/goals'
import { getProfile } from './data/profile'
import { getCurrentUser, onAuthChange } from './data/auth'
import { hasSkippedAuth, setSkippedAuth } from './data/syncState'
import { unlockAudio } from './data/audio'
import { ActiveWorkoutScreen } from './features/workouts/ActiveWorkoutScreen'
import { FinishWorkoutScreen } from './features/workouts/FinishWorkoutScreen'
import { WorkoutHistoryScreen } from './features/workouts/WorkoutHistoryScreen'
import { WorkoutProgressScreen } from './features/workouts/WorkoutProgressScreen'
import { WorkoutDetailScreen } from './features/workouts/WorkoutDetailScreen'
import { ExerciseLibraryScreen } from './features/workouts/ExerciseLibraryScreen'
import { ExerciseDetailScreen } from './features/workouts/ExerciseDetailScreen'
import { ExerciseFormScreen } from './features/workouts/ExerciseFormScreen'
import { RoutineListScreen } from './features/workouts/RoutineListScreen'
import { RoutineFormScreen } from './features/workouts/RoutineFormScreen'
import { DialogProvider } from './components/DialogProvider'
import { SaveAsRoutineScreen } from './features/workouts/SaveAsRoutineScreen'
import { ensureSortOrders } from './data/routines'
import { RoutineTodayScreen } from './features/routines/RoutineTodayScreen'
import { RoutineManageScreen } from './features/routines/RoutineManageScreen'
import { CareRoutineFormScreen } from './features/routines/CareRoutineFormScreen'

type Stage = 'checking' | 'gate' | 'register' | 'login' | 'name' | 'goals' | 'ready'

export default function App() {
  const [stage, setStage] = useState<Stage>('checking')
  const [name, setName] = useState('')

  /**
   * Works out where the user should be, given what exists locally and whether
   * they are signed in. Called on mount, after register/login/skip, and
   * whenever the auth state changes — so there is only one copy of this logic.
   *
   * The gate comes first because a returning tester with a full profile still
   * needs to be offered an account, but only once.
   */
  const resolveStage = useCallback(async () => {
    const [profile, goals, user, skipped] = await Promise.all([
      getProfile(),
      getGoals(),
      getCurrentUser(),
      hasSkippedAuth(),
    ])

    setName(profile?.name ?? '')

    if (!user && !skipped) return setStage('gate')
    if (!profile) return setStage('name')
    if (!goals) return setStage('goals')
    setStage('ready')
  }, [])

  useEffect(() => {
    resolveStage()
    ensureSortOrders()
  }, [resolveStage])

  // Keeps the stage and the hub greeting correct when the user logs in or out
  // from the account screen, without that screen needing to know about stages.
  useEffect(() => onAuthChange(() => resolveStage()), [resolveStage])

  useEffect(() => {
    function handleFirstTap() {
      unlockAudio()
      window.removeEventListener('pointerdown', handleFirstTap)
    }
    window.addEventListener('pointerdown', handleFirstTap)
    return () => window.removeEventListener('pointerdown', handleFirstTap)
  }, [])

  if (stage === 'checking') {
    return (
      <p className="muted" style={{ padding: '2rem', textAlign: 'center' }}>
        Loading…
      </p>
    )
  }

  if (stage === 'gate') {
    return (
      <AuthGateScreen
        name={name || undefined}
        onRegister={() => setStage('register')}
        onLogin={() => setStage('login')}
        onSkip={async () => {
          await setSkippedAuth()
          await resolveStage()
        }}
      />
    )
  }

  if (stage === 'register') {
    return (
      <RegisterScreen
        existingName={name || undefined}
        onDone={resolveStage}
        onSwitchToLogin={() => setStage('login')}
        onBack={() => setStage('gate')}
      />
    )
  }

  if (stage === 'login') {
    return (
      <LoginScreen
        onDone={resolveStage}
        onSwitchToRegister={() => setStage('register')}
        onBack={() => setStage('gate')}
      />
    )
  }

  if (stage === 'name') {
    return (
      <NameScreen
        onDone={async () => {
          const profile = await getProfile()
          setName(profile?.name ?? '')
          setStage('goals')
        }}
      />
    )
  }

  if (stage === 'goals') {
    return (
      <div className="stack" style={{ padding: '1.5rem 1rem' }}>
        <h1>Nice to meet you, {name}</h1>
        <p className="muted">Set your daily goals to get started.</p>
        <GoalsScreen onSaved={() => setStage('ready')} />
      </div>
    )
  }

  return (
    <DialogProvider>
      <BrowserRouter basename="/health-tracker">
        <Routes>
          <Route element={<Layout />}>
            <Route path="/" element={<HubScreen name={name} />} />

            <Route path="account" element={<AccountScreen />} />

            <Route path="meals" element={<Navigate to="/meals/today" replace />} />
            <Route path="meals/today" element={<TodayScreen />} />
            <Route path="meals/today/add" element={<AddEntryScreen />} />
            <Route path="meals/foods" element={<FoodListScreen />} />
            <Route path="meals/foods/new" element={<FoodFormScreen />} />
            <Route path="meals/foods/:id/edit" element={<FoodFormScreen />} />
            <Route path="meals/foods/search" element={<FoodSearchScreen />} />
            <Route path="meals/foods/scan" element={<BarcodeScanScreen />} />
            <Route path="meals/goals" element={<GoalsScreen />} />
            <Route path="meals/charts" element={<ChartsScreen />} />

            <Route path="body" element={<Navigate to="/body/weight" replace />} />
            <Route path="body/weight" element={<BodyScreen />} />
            <Route path="body/weight/log" element={<MeasurementFormScreen />} />

            <Route path="workouts" element={<Navigate to="/workouts/log" replace />} />
            <Route path="workouts/log" element={<ActiveWorkoutScreen />} />
            <Route path="workouts/finish" element={<FinishWorkoutScreen />} />
            <Route path="workouts/routines" element={<RoutineListScreen />} />
            <Route path="workouts/routines/new" element={<RoutineFormScreen />} />
            <Route path="workouts/routines/:id/edit" element={<RoutineFormScreen />} />
            <Route path="workouts/history" element={<WorkoutHistoryScreen />} />
            <Route path="workouts/history/:id" element={<WorkoutDetailScreen />} />
            <Route path="workouts/history/:id/save-as-routine" element={<SaveAsRoutineScreen />} />
            <Route path="workouts/progress" element={<WorkoutProgressScreen />} />
            <Route path="workouts/exercises" element={<ExerciseLibraryScreen />} />
            <Route path="workouts/exercises/new" element={<ExerciseFormScreen />} />
            <Route path="workouts/exercises/:key" element={<ExerciseDetailScreen />} />

            <Route path="routines" element={<Navigate to="/routines/today" replace />} />
            <Route path="routines/today" element={<RoutineTodayScreen />} />
            <Route path="routines/manage" element={<RoutineManageScreen />} />
            <Route path="routines/manage/new" element={<CareRoutineFormScreen />} />
            <Route path="routines/manage/:id/edit" element={<CareRoutineFormScreen />} />

            <Route path="settings" element={<SettingsScreen />} />
            <Route path="settings/about" element={<AboutScreen />} />
            <Route path="settings/feedback" element={<FeedbackScreen />} />

            <Route path="*" element={<Navigate to="/" replace />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </DialogProvider>
  )
}