export type EquipmentCategory = 'weights' | 'machine' | 'bodyweight' | 'cardio'

const CATEGORY_MAP: Record<string, EquipmentCategory> = {
  barbell: 'weights',
  'olympic barbell': 'weights',
  'ez barbell': 'weights',
  'trap bar': 'weights',
  dumbbell: 'weights',
  kettlebell: 'weights',
  weighted: 'weights',
  'medicine ball': 'weights',

  'smith machine': 'machine',
  'leverage machine': 'machine',
  'sled machine': 'machine',
  cable: 'machine',
  hammer: 'machine',

  'body weight': 'bodyweight',
  assisted: 'bodyweight',
  band: 'bodyweight',
  'resistance band': 'bodyweight',
  'stability ball': 'bodyweight',
  'bosu ball': 'bodyweight',
  roller: 'bodyweight',
  'wheel roller': 'bodyweight',
  rope: 'bodyweight',
  tire: 'bodyweight',

  'elliptical machine': 'cardio',
  'stationary bike': 'cardio',
  'skierg machine': 'cardio',
  'stepmill machine': 'cardio',
  'upper body ergometer': 'cardio',
}

export function categoryFor(equipment: string | undefined): EquipmentCategory {
  if (!equipment) return 'bodyweight'
  return CATEGORY_MAP[equipment.trim().toLowerCase()] ?? 'bodyweight'
}

export const CATEGORY_LABEL: Record<EquipmentCategory, string> = {
  weights: 'Free weights',
  machine: 'Machine',
  bodyweight: 'Bodyweight',
  cardio: 'Cardio',
}

interface Props {
  equipment?: string
  category?: EquipmentCategory
  size?: number
  className?: string
}

export function EquipmentIcon({ equipment, category, size = 24, className }: Props) {
  const cat = category ?? categoryFor(equipment)

  const common = {
    width: size,
    height: size,
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: 2,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
    className,
    'aria-hidden': true,
  }

  if (cat === 'weights') {
    return (
      <svg {...common}>
        <path d="M6.5 6.5v11" />
        <path d="M17.5 6.5v11" />
        <path d="M3.5 9v6" />
        <path d="M20.5 9v6" />
        <path d="M6.5 12h11" />
      </svg>
    )
  }

  if (cat === 'machine') {
    return (
      <svg {...common}>
        <path d="M4 3v18" />
        <path d="M4 4h9" />
        <rect x="8" y="8" width="10" height="4" rx="1" />
        <rect x="8" y="13" width="10" height="4" rx="1" />
        <path d="M13 4v4" />
      </svg>
    )
  }

  if (cat === 'cardio') {
    return (
      <svg {...common}>
        <path d="M2 13h4l2.5-6 3 12 2.5-8 1.5 3h6.5" />
      </svg>
    )
  }

  return (
    <svg {...common}>
      <circle cx="12" cy="4.5" r="2" />
      <path d="M12 6.5v6" />
      <path d="M7 9h10" />
      <path d="M12 12.5 8.5 20" />
      <path d="m12 12.5 3.5 7.5" />
    </svg>
  )
}