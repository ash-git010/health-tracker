import { useEffect, useState } from 'react'
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
import { RoutinePlaceholder } from './features/routines/RoutinePlaceholder'
import { getGoals } from './data/goals'
import { getProfile } from './data/profile'
import { unlockAudio } from './data/audio'
import { ActiveWorkoutScreen } from './features/workouts/ActiveWorkoutScreen'
import { FinishWorkoutScreen } from './features/workouts/FinishWorkoutScreen'
import { WorkoutHistoryScreen } from './features/workouts/WorkoutHistoryScreen'
import { WorkoutDetailScreen } from './features/workouts/WorkoutDetailScreen'
import { ExerciseLibraryScreen } from './features/workouts/ExerciseLibraryScreen'
import { ExerciseDetailScreen } from './features/workouts/ExerciseDetailScreen'
import { ExerciseFormScreen } from './features/workouts/ExerciseFormScreen'
import { RoutineListScreen } from './features/workouts/RoutineListScreen'
import { RoutineFormScreen } from './features/workouts/RoutineFormScreen'

type Stage = 'checking' | 'name' | 'goals' | 'ready'

export default function App() {
  const [stage, setStage] = useState<Stage>('checking')
  const [name, setName] = useState('')

  useEffect(() => {
    async function check() {
      const [profile, goals] = await Promise.all([getProfile(), getGoals()])
      setName(profile?.name ?? '')
      if (!profile) setStage('name')
      else if (!goals) setStage('goals')
      else setStage('ready')
    }
    check()
  }, [])

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
    <BrowserRouter basename="/health-tracker">
      <Routes>
        <Route element={<Layout />}>
          <Route path="/" element={<HubScreen name={name} />} />

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
          <Route path="workouts/exercises" element={<ExerciseLibraryScreen />} />
          <Route path="workouts/exercises/new" element={<ExerciseFormScreen />} />
          <Route path="workouts/exercises/:key" element={<ExerciseDetailScreen />} />

          <Route path="routines" element={<Navigate to="/routines/today" replace />} />
          <Route path="routines/today" element={<RoutinePlaceholder />} />
          <Route path="routines/manage" element={<RoutinePlaceholder />} />

          <Route path="settings" element={<SettingsScreen />} />
          <Route path="settings/about" element={<AboutScreen />} />
          <Route path="settings/feedback" element={<FeedbackScreen />} />

          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}