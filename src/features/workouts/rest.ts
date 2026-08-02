export const REST_OPTIONS: { label: string; seconds: number }[] = [
  { label: '30s', seconds: 30 },
  { label: '60s', seconds: 60 },
  { label: '90s', seconds: 90 },
  { label: '2min', seconds: 120 },
  { label: '3min', seconds: 180 },
  { label: '5min', seconds: 300 },
  { label: 'Off', seconds: 0 },
]

export function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return `${m}:${String(s).padStart(2, '0')}`
}

export function formatRestLabel(seconds: number): string {
  const match = REST_OPTIONS.find((o) => o.seconds === seconds)
  if (match) return match.label
  return formatTime(seconds)
}
