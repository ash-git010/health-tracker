import { t } from '../../data/i18n'

/**
 * A function, not a const — same reasoning as rpe.ts's rpeOptions(): a
 * module-level array would freeze 'Off' in whatever language was active at
 * import time.
 */
export function restOptions(): { label: string; seconds: number }[] {
  return [
    { label: '30s', seconds: 30 },
    { label: '60s', seconds: 60 },
    { label: '90s', seconds: 90 },
    { label: '2min', seconds: 120 },
    { label: '3min', seconds: 180 },
    { label: '5min', seconds: 300 },
    { label: t('rest.off'), seconds: 0 },
  ]
}

export function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return `${m}:${String(s).padStart(2, '0')}`
}

export function formatRestLabel(seconds: number): string {
  const match = restOptions().find((o) => o.seconds === seconds)
  if (match) return match.label
  return formatTime(seconds)
}
