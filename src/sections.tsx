import { t } from './data/i18n'

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

/**
 * A function, not a const — a module-level array would freeze these strings in
 * whatever language was active at import.
 *
 * `id` and `path` are route segments and are never translated: /meals/today
 * stays /meals/today in German. Only title, blurb and label are content.
 */
export function sections(): Section[] {
  return [
    {
      id: 'meals',
      title: t('sections.meals.title'),
      blurb: t('sections.meals.blurb'),
      ready: true,
      tabs: [
        { path: 'today', label: t('sections.meals.today') },
        { path: 'foods', label: t('sections.meals.foods') },
        { path: 'goals', label: t('sections.meals.goals') },
        { path: 'charts', label: t('sections.meals.charts') },
      ],
    },
    {
      id: 'body',
      title: t('sections.body.title'),
      blurb: t('sections.body.blurb'),
      ready: true,
      tabs: [{ path: 'weight', label: t('sections.body.weight') }],
    },
    {
      id: 'workouts',
      title: t('sections.workouts.title'),
      blurb: t('sections.workouts.blurb'),
      ready: true,
      tabs: [
        { path: 'log', label: t('sections.workouts.log') },
        { path: 'routines', label: t('sections.workouts.routines') },
        { path: 'progress', label: t('sections.workouts.progress') },
      ],
    },
    {
      id: 'routines',
      title: t('sections.routines.title'),
      blurb: t('sections.routines.blurb'),
      ready: true,
      tabs: [
        { path: 'today', label: t('sections.routines.today') },
        { path: 'manage', label: t('sections.routines.manage') },
      ],
    },
  ]
}

export function getSection(id: string): Section | undefined {
  return sections().find((s) => s.id === id)
}