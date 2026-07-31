import type { ReactNode } from 'react'
import { TodayScreen } from './features/log/TodayScreen'
import { FoodListScreen } from './features/foods/FoodListScreen'
import { GoalsScreen } from './features/goals/GoalsScreen'
import { BodyScreen } from './features/body/BodyScreen'
import { WorkoutPlaceholder } from './features/workouts/WorkoutPlaceholder'
import { RoutinePlaceholder } from './features/routines/RoutinePlaceholder'

export interface SectionTab {
  id: string
  label: string
  render: () => ReactNode
}

export interface Section {
  id: string
  title: string
  blurb: string
  ready: boolean
  tabs: SectionTab[]
}

export const SECTIONS: Section[] = [
  {
    id: 'meals',
    title: 'Meals',
    blurb: 'Calories, macros and your food list',
    ready: true,
    tabs: [
      { id: 'today', label: 'Today', render: () => <TodayScreen /> },
      { id: 'foods', label: 'Foods', render: () => <FoodListScreen /> },
      { id: 'goals', label: 'Goals', render: () => <GoalsScreen /> },
    ],
  },
  {
    id: 'body',
    title: 'Body',
    blurb: 'Weight and measurements over time',
    ready: true,
    tabs: [{ id: 'weight', label: 'Weight', render: () => <BodyScreen /> }],
  },
  {
    id: 'workouts',
    title: 'Workouts',
    blurb: 'Exercises, routines and lifting progress',
    ready: false,
    tabs: [
      { id: 'log', label: 'Log', render: () => <WorkoutPlaceholder name="Workout log" /> },
      {
        id: 'routines',
        label: 'Routines',
        render: () => <WorkoutPlaceholder name="Routines" />,
      },
      {
        id: 'exercises',
        label: 'Exercises',
        render: () => <WorkoutPlaceholder name="Exercise library" />,
      },
    ],
  },
  {
    id: 'routines',
    title: 'Routines',
    blurb: 'Skin, hair and daily habits',
    ready: false,
    tabs: [
      { id: 'today', label: 'Today', render: () => <RoutinePlaceholder /> },
      { id: 'manage', label: 'Manage', render: () => <RoutinePlaceholder /> },
    ],
  },
]

export function getSection(id: string): Section | undefined {
  return SECTIONS.find((s) => s.id === id)
}