import { useNavigate, useLocation } from 'react-router-dom'
import { AddEntry } from './AddEntry'
import { todayISO } from '../../data/dates'
import type { Meal } from '../../data/log'

export function AddEntryScreen() {
  const navigate = useNavigate()
  const location = useLocation()

  const state = location.state as { meal?: Meal; date?: string } | null
  const meal = state?.meal ?? 'breakfast'
  const date = state?.date ?? todayISO()

  return (
    <AddEntry
      date={date}
      defaultMeal={meal}
      onDone={() => navigate('/meals/today')}
      onCancel={() => navigate('/meals/today')}
    />
  )
}