import { db } from './db'

export async function exportAll(): Promise<string> {
  const [goals, foods, logEntries, measurements] = await Promise.all([
    db.goals.toArray(),
    db.foods.toArray(),
    db.logEntries.toArray(),
    db.measurements.toArray(),
  ])

  return JSON.stringify(
    { version: 1, exportedAt: new Date().toISOString(), goals, foods, logEntries, measurements },
    null,
    2
  )
}

export async function importAll(json: string): Promise<void> {
  const data = JSON.parse(json)
  if (data.version !== 1) throw new Error('Unrecognised backup format')

  await db.transaction('rw', [db.goals, db.foods, db.logEntries, db.measurements], async () => {
    await Promise.all([
      db.goals.clear(),
      db.foods.clear(),
      db.logEntries.clear(),
      db.measurements.clear(),
    ])
    await db.goals.bulkAdd(data.goals ?? [])
    await db.foods.bulkAdd(data.foods ?? [])
    await db.logEntries.bulkAdd(data.logEntries ?? [])
    await db.measurements.bulkAdd(data.measurements ?? [])
  })
}

export function downloadBackup(json: string) {
  const blob = new Blob([json], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `health-tracker-${new Date().toISOString().slice(0, 10)}.json`
  a.click()
  URL.revokeObjectURL(url)
}