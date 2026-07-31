export interface Release {
  version: string
  date: string
  changes: string[]
}

export const CHANGELOG: Release[] = [
  {
    version: '0.7',
    date: '2026-08-01',
    changes: [
      'Track your weight over time, with 7 and 30 day change',
      'Optional height, with BMI calculated automatically',
      'Report bugs and suggest ideas from the Settings screen',
    ],
  },
  {
    version: '0.6',
    date: '2026-07-31',
    changes: [
      'Search the Open Food Facts database by name — useful when a product has no barcode',
      'Add foods measured in pieces (tortillas, slices, eggs) and log by count instead of weight',
      'Fixed calories not being read from products that only list kilojoules',
    ],
  },
  {
    version: '0.5',
    date: '2026-07-31',
    changes: [
      'Renamed to Upkeep',
      'Fresh look with a consistent design across every screen',
      'The app now asks your name when you first open it, and greets you by it',
      'New About page with install help, release notes, and device support info',
    ],
  },
  {
    version: '0.4',
    date: '2026-07-31',
    changes: [
      'Scan a barcode to look up a product automatically',
      'Product data comes from Open Food Facts, a free community database',
      'Export your data as a backup file, and restore it later',
    ],
  },
  {
    version: '0.3',
    date: '2026-07-31',
    changes: [
      'Log meals across breakfast, lunch, dinner and snacks',
      'Daily calorie and macro totals with progress bars',
      'Separate tracking for your minimum daily protein',
      'Browse back through previous days',
    ],
  },
  {
    version: '0.2',
    date: '2026-07-30',
    changes: [
      'Set your daily calorie target and macro split',
      'Build a food list with values stored per 100g or 100ml',
      'Warning when a food\'s calories don\'t match its macros',
    ],
  },
  {
    version: '0.1',
    date: '2026-07-29',
    changes: [
      'First version — installable on your phone as an app',
      'Works offline',
    ],
  },
]