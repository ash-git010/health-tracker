export type MuscleGroup =
  | 'Chest'
  | 'Back'
  | 'Shoulders'
  | 'Biceps'
  | 'Triceps'
  | 'Quads'
  | 'Hamstrings'
  | 'Glutes'
  | 'Calves'
  | 'Core'
  | 'Other'

export const MUSCLE_GROUPS: MuscleGroup[] = [
  'Chest',
  'Back',
  'Shoulders',
  'Biceps',
  'Triceps',
  'Quads',
  'Hamstrings',
  'Glutes',
  'Calves',
  'Core',
  'Other',
]

// Covers every `target` and `secondary` value in src/data/seed/exercises.json.
const MUSCLE_MAP: Record<string, MuscleGroup> = {
  // target values
  abductors: 'Glutes',
  abs: 'Core',
  adductors: 'Other',
  biceps: 'Biceps',
  calves: 'Calves',
  'cardiovascular system': 'Other',
  delts: 'Shoulders',
  forearms: 'Other',
  glutes: 'Glutes',
  hamstrings: 'Hamstrings',
  lats: 'Back',
  'levator scapulae': 'Back',
  pectorals: 'Chest',
  quads: 'Quads',
  'serratus anterior': 'Back',
  spine: 'Back',
  traps: 'Back',
  triceps: 'Triceps',
  'upper back': 'Back',

  // secondary values (target duplicates omitted)
  abdominals: 'Core',
  'ankle stabilizers': 'Calves',
  ankles: 'Calves',
  back: 'Back',
  brachialis: 'Biceps',
  chest: 'Chest',
  core: 'Core',
  deltoids: 'Shoulders',
  feet: 'Other',
  'grip muscles': 'Other',
  groin: 'Other',
  hands: 'Other',
  'hip flexors': 'Core',
  'inner thighs': 'Other',
  'latissimus dorsi': 'Back',
  'lower abs': 'Core',
  'lower back': 'Back',
  obliques: 'Core',
  quadriceps: 'Quads',
  'rear deltoids': 'Shoulders',
  rhomboids: 'Back',
  'rotator cuff': 'Shoulders',
  shins: 'Calves',
  shoulders: 'Shoulders',
  soleus: 'Calves',
  sternocleidomastoid: 'Other',
  trapezius: 'Back',
  'upper chest': 'Chest',
  'wrist extensors': 'Other',
  'wrist flexors': 'Other',
  wrists: 'Other',
}

export function groupFor(muscleName: string): MuscleGroup {
  return MUSCLE_MAP[muscleName.trim().toLowerCase()] ?? 'Other'
}
