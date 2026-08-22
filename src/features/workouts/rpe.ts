import { t } from '../../data/i18n'

/**
 * A function, not a const. A module-level array would evaluate once at import
 * and freeze 'Off' in whatever language was active then — switching later
 * would not touch it.
 */
export function rpeOptions(): { label: string; value?: number }[] {
  return [
    { label: t('rpe.off') },
    { label: 'RPE 6', value: 6 },
    { label: 'RPE 6.5', value: 6.5 },
    { label: 'RPE 7', value: 7 },
    { label: 'RPE 7.5', value: 7.5 },
    { label: 'RPE 8', value: 8 },
    { label: 'RPE 8.5', value: 8.5 },
    { label: 'RPE 9', value: 9 },
    { label: 'RPE 9.5', value: 9.5 },
    { label: 'RPE 10', value: 10 },
  ]
}

export function formatRpe(value?: number): string {
  return value === undefined ? t('rpe.off') : String(value)
}