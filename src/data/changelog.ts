export interface Release {
  version: string
  date: string
  changes: string[]
}

export const CHANGELOG: Release[] = [
    {
    version: '2.1',
    date: '2026-08-18',
    changes: [
      'Routines now remember the weight and reps you are aiming for on every set, not just how many sets',
      'Routines can include warm-up sets, and starting one gives you every set it asks for',
      'The first time you do an exercise your targets are filled in; after that you see your last session instead',
      'Set a target RPE for an exercise and adjust it mid-workout without changing the routine',
      'Pick a rest timer from a list instead of counting out seconds, and add notes to a routine or an exercise',
      'Changed something mid-workout? Finishing offers to save it back to the routine, and tells you what changed',
      'Bodyweight exercises: leave the weight blank and tick the set on reps alone',
      'The rest timer keeps proper time while your phone is locked, with a longer sound you can actually hear',
      'Clearing a number no longer jumps it to 1 — the box stays empty and tells you if something is missing when you save',
      'Set columns line up with their headings and stop shifting when you tick a set',
      'The delete button on a set is smaller and red, and the header no longer shows the page through it',
    ],
  },
  {
    version: '2.0',
    date: '2026-08-11',
    changes: [
      'Forgotten your password? Get a code by email and set a new one, without losing anything',
      'New accounts now confirm your email address with a code, so nobody can sign up as you',
      'Upkeep has moved to upkeepdaily.com — update any bookmark you have',
      'Emails from Upkeep now come from upkeepdaily.com and look like the app',
      'You get an email if your password or email address ever changes, so you know if it was not you',
      'Fixed swiping through the intro on phones, which did nothing before',
    ],
  },
  {
    version: '1.9',
    date: '2026-08-10',
    changes: [
      'Create an account to keep your data safe if you lose your phone',
      'You can now sign into a different account on a device that has already synced with one',
      'Fixed an error when moving a device to a second account',
    ],
  },
  {
    version: '1.8',
    date: '2026-08-09',
    changes: [
      'Change your password from the Account screen',
      'New passwords need at least 8 characters',
      'Renaming yourself now updates the home screen straight away',
      'A new app icon',
    ],
  },
  {
    version: '1.7',
    date: '2026-08-09',
    changes: [
      'A short intro the first time you open Upkeep, showing what each section does',
      'Add Upkeep to your home screen in one tap on Android, with step-by-step instructions for iPhone',
      'New install guide in Settings',
      'About now explains how your data is actually stored',
    ],
  },
  {
    version: '1.6',
    date: '2026-08-09',
    changes: [
      'Accounts are here — create one and your data syncs automatically in the background',
      'Log in on another device to pick up where you left off',
      'Signing in on a device that already has data asks what you want to keep, and backs everything up first',
      'Your name and goals come with you when you log in somewhere new',
      'Home screen reminds you when no account is linked',
    ],
  },
  {
    version: '1.5',
    date: '2026-08-03',
    changes: [
      'Routines are here — build skin, hair or any daily routine and tick it off',
      'Steps can note which product you use',
      'Streaks for each routine, with skip days that don\'t break them',
      'Group routines by morning, evening or anytime, and create your own types',
      'Home screen now shows your week at a glance',
    ],
  },
  {
    version: '1.4',
    date: '2026-08-03',
    changes: [
      'Confirmations now look like part of the app instead of browser popups',
      'Reorder routines and folders, and move routines between folders',
      'Saving a workout as a routine now lets you pick a folder',
      'Icons throughout, and tidier list layouts',
    ],
  },
  {
    version: '1.3',
    date: '2026-08-03',
    changes: [
      'New dark design throughout — cleaner, calmer, easier to read at a glance',
      'Key numbers are now front and centre on every screen',
      'Icons for exercise equipment, sections and controls',
      'Redesigned home screen',
      'Search, scan or add a new food without leaving the meal you\'re logging',
      'Bigger tap targets and smoother transitions',
    ]
  },
  {
    version: '1.2',
    date: '2026-08-03',
    changes: [
      'New Progress tab in Workouts — see your training at a glance',
      'Calendar view showing which days you trained, with a weekly streak counter',
      'Sets per muscle group, so you can spot what you\'re undertraining',
      'Muscle balance chart comparing how evenly you train across the body',
      'Volume trend over the last three months',
      'Recent personal records, with a link straight to that exercise',
    ],
  },
  {
    version: '1.1',
    date: '2026-08-03',
    changes: [
      'Tap any exercise to see its full history, records and progress over time',
      'Personal records for estimated 1RM, max weight, max reps and volume',
      'Estimated performance table showing what you could lift at any rep count',
      'Create your own exercises for anything not in the library',
      'Remove a single set without deleting the whole exercise',
      'Clearer charts — no more negative values or repeated dates',
    ],
  },
  {
    version: '1.0',
    date: '2026-08-02',
    changes: [
      'Workouts are here — log sets, build routines, track your lifts',
      'A library of over 1,300 exercises with instructions, searchable by name, muscle or equipment',
      'Tick off each set as you go, with last session\'s numbers shown for reference',
      'Rest timer that counts down under the exercise, with a beep when time\'s up',
      'Save any workout as a routine, organised into folders, and start from it next time',
      'Name your workout at the end rather than the start',
      'Workout history with full detail — tap any session to review or edit it',
    ],
  },
  {
    version: '0.9.5',
    date: '2026-08-02',
    changes: [
      'Bigger tap targets throughout — buttons and controls are easier to hit',
      'The workout summary stays pinned while you scroll through exercises',
      'Filter exercises by body part while searching',
    ],
  },
  {
    version: '0.9.4',
    date: '2026-08-02',
    changes: [
      'Updates now install automatically instead of waiting for a manual refresh',
      'A prompt appears when a new version is ready',
      'New app icon — remove and reinstall from your home screen to see it',
    ],
  },
  {
    version: '0.9.3',
    date: '2026-08-02',
    changes: [
      'Search now handles typos, partial words and any word order',
      'Quick-add buttons that stay on screen while you scroll',
      'Fixed the bottom bar overlapping the gesture area on some phones',
      'Barcode scanning now works on iPhone, though slower than Android',
    ],
  },
  {
    version: '0.9.2',
    date: '2026-08-01',
    changes: [
      'The back button now works properly throughout the app',
      'Refreshing keeps you on the screen you were viewing',
      'Weight trend chart with a 7-entry rolling average',
    ],
  },
  {
    version: '0.9.1',
    date: '2026-08-01',
    changes: [
      'New Charts tab in Meals — macro breakdown, calorie and protein trends',
      'Switch between 7, 14 and 30 day views',
      'Summary showing average intake and how often you hit your protein minimum',
    ],
  },
  {
    version: '0.9',
    date: '2026-08-01',
    changes: [
      'Search now includes common whole foods — apples, eggs, chicken, rice — not just packaged products',
      'Many common foods come with piece weights, so you can log "1 apple" instead of weighing it',
      'Branded search results are now filtered to products sold in your country',
    ],
  },
  {
    version: '0.8',
    date: '2026-08-01',
    changes: [
      'New home screen — pick what you want to track',
      'The app remembers your last section and opens straight into it',
      'Settings and feedback now reachable from anywhere via the gear icon',
      'Placeholders added for workouts and routines, coming soon',
    ],
  },
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

export const APP_VERSION = CHANGELOG[0].version