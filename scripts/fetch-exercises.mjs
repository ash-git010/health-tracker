import { writeFileSync, mkdirSync } from 'fs'

const SOURCE =
  'https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/data/exercises.json'

console.log('Downloading…')
const res = await fetch(SOURCE)
if (!res.ok) throw new Error(`Download failed: ${res.status}`)

const raw = await res.json()
console.log(`Got ${raw.length} exercises`)

const trimmed = raw.map((ex) => ({
  id: ex.id,
  name: titleCase(ex.name),
  bodyPart: ex.body_part ?? ex.category,
  equipment: ex.equipment,
  target: ex.target,
  secondary: ex.secondary_muscles ?? [],
  steps: ex.instruction_steps?.en ?? [],
}))

mkdirSync('src/data/seed', { recursive: true })
writeFileSync('src/data/seed/exercises.json', JSON.stringify(trimmed))

const bytes = JSON.stringify(trimmed).length
console.log(`Wrote ${trimmed.length} exercises, ${(bytes / 1024).toFixed(0)} KB`)

function titleCase(s) {
  return s.replace(/\b\w/g, (c) => c.toUpperCase())
}