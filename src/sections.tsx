export interface SectionTab {
  path: string
  label: string
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
      { path: 'today', label: 'Today' },
      { path: 'foods', label: 'Foods' },
      { path: 'goals', label: 'Goals' },
      { path: 'charts', label: 'Charts' },
    ],
  },
  {
    id: 'body',
    title: 'Body',
    blurb: 'Weight and measurements over time',
    ready: true,
    tabs: [{ path: 'weight', label: 'Weight' }],
  },
  {
    id: 'workouts',
    title: 'Workouts',
    blurb: 'Exercises, routines and lifting progress',
    ready: true,
    tabs: [
      { path: 'log', label: 'Log' },
      { path: 'routines', label: 'Routines' },
      { path: 'progress', label: 'Progress' },
    ],
  },
  {
    id: 'routines',
    title: 'Routines',
    blurb: 'Skin, hair and daily habits',
    ready: false,
    tabs: [
      { path: 'today', label: 'Today' },
      { path: 'manage', label: 'Manage' },
    ],
  },
]

export function getSection(id: string): Section | undefined {
  return SECTIONS.find((s) => s.id === id)
}