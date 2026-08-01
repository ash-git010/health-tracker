export function todayISO(): string {
  return toISODate(new Date())
}

export function toISODate(d: Date): string {
  const year = d.getFullYear()
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

export function addDays(iso: string, delta: number): string {
  const d = new Date(iso + 'T12:00:00')
  d.setDate(d.getDate() + delta)
  return toISODate(d)
}

export function formatDay(iso: string): string {
  if (iso === todayISO()) return 'Today'
  if (iso === addDays(todayISO(), -1)) return 'Yesterday'
  return new Date(iso + 'T12:00:00').toLocaleDateString(undefined, {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
  })
}

export function lastNDays(n: number, endISO = todayISO()): string[] {
  const days: string[] = []
  for (let i = n - 1; i >= 0; i--) {
    days.push(addDays(endISO, -i))
  }
  return days
}

export function shortDay(iso: string): string {
  return new Date(iso + 'T12:00:00').toLocaleDateString(undefined, { weekday: 'short' })
}