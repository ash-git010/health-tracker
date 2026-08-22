/**
 * The source of truth. de.ts is typed against these keys, so a missing or
 * misspelled German string is a build error, not a runtime fallback.
 *
 * Flat dotted keys, not nested objects — nesting needs recursive types to get
 * the same check, and buys nothing at this scale.
 *
 * "Upkeep" is a brand name and is never translated. It appears inside values
 * here verbatim and must stay that way in every catalogue.
 */
const en = {
  'settings.title': 'Settings',
  'settings.name': 'Name',
  'settings.nameLabel': 'What we call you',
  'settings.updateName': 'Update name',
  'settings.saved': 'Saved',

  'settings.language': 'Language',

  'settings.yourData': 'Your data',
  'settings.dataNote':
    'Stored on this device only. Export regularly — clearing browser data erases everything.',
  'settings.exportBackup': 'Export backup',
  'settings.backupDownloaded': 'Backup downloaded',
  'settings.restore': 'Restore from backup',
  'settings.restoreTitle': 'Restore from backup?',
  'settings.restoreMessage': 'This replaces everything currently stored on this device.',
  'settings.restoreConfirm': 'Restore',
  'settings.restored': 'Restored. Reload the app to see it.',
  'settings.importFailed': 'Import failed: {message}',
  'settings.unknownError': 'unknown error',

  'settings.app': 'App',
  'settings.install': 'Install on your phone',
  'settings.about': 'About Upkeep',
  'settings.feedback': 'Report a problem',

    'common.add': 'Add',
  'common.back': 'Back',
  'common.save': 'Save',
  'common.cancel': 'Cancel',
  'common.continue': 'Continue',

  'app.loading': 'Loading…',
  'app.gettingData': 'Getting your data…',

  'dates.today': 'Today',
  'dates.yesterday': 'Yesterday',

  'rpe.off': 'Off',

  'onb.skip': 'Skip',
  'onb.getStarted': 'Get started',
  'onb.haveAccount': 'Already have an account?',
  'onb.logIn': 'Log in',
  'onb.goToSlide': 'Go to slide {n}',

  'onb.welcome.title': 'Welcome to Upkeep',
  'onb.welcome.lead': 'Everything you do to look after yourself, kept in one place.',
  'onb.welcome.p1': 'Four sections, one home screen',
  'onb.welcome.p2': 'Works offline, opens instantly',
  'onb.welcome.p3': 'No ads, no feed, no streak guilt',

  'onb.meals.title': 'Meals',
  'onb.meals.lead': 'Log what you eat without fighting the app to do it.',
  'onb.meals.p1': 'Scan a barcode or search the food database',
  'onb.meals.p2': 'Log by weight or by piece',
  'onb.meals.p3': 'Daily macro goals and charts',

  'onb.body.title': 'Body',
  'onb.body.lead': 'Weight, smoothed — so one heavy morning does not read as a trend.',
  'onb.body.p1': '7-entry rolling average',
  'onb.body.p2': '7 and 30 day change at a glance',
  'onb.body.p3': 'Optional height and BMI',

  'onb.workouts.title': 'Workouts',
  'onb.workouts.lead': 'Train from a routine or freestyle it, and see the progress.',
  'onb.workouts.p1': '1,300+ exercises, plus your own',
  'onb.workouts.p2': 'Sets, warmups, drop sets, rest timer',
  'onb.workouts.p3': 'Personal records and volume trends',

  'onb.routines.title': 'Routines',
  'onb.routines.lead': 'The small daily things that only work when you actually do them.',
  'onb.routines.p1': 'Morning, evening and anytime routines',
  'onb.routines.p2': 'Named steps with product notes',
  'onb.routines.p3': 'Streaks that survive a skipped day',

  'onb.account.title': 'Your data stays yours',
  'onb.account.lead': 'Everything is stored on this device first. It works with no signal.',
  'onb.account.p1': 'An account syncs it across your devices',
  'onb.account.p2': 'Sign in anywhere to pick up where you left off',
  'onb.account.p3': 'Export a full backup whenever you like',

  'onb.install.title': 'Add it to your home screen',
  'onb.install.lead':
    'Upkeep then opens like any other app — full screen, its own icon, and it still works with no signal.',
  'onb.install.done': 'Added. Open Upkeep from your home screen next time.',
  'onb.install.button': 'Add to home screen',
  'onb.install.hint': 'Your browser will ask you to confirm.',
  'onb.install.iosHead': 'On iPhone, in Safari',
  'onb.install.ios1': 'Tap the Share button at the bottom of the screen.',
  'onb.install.ios2': 'Scroll down and tap "Add to Home Screen".',
  'onb.install.ios3': 'Tap "Add" in the top right.',
  'onb.install.androidHead': 'In your browser menu',
  'onb.install.android1': 'Tap the three dots in the top right.',
  'onb.install.android2': 'Choose "Install app" or "Add to Home screen".',
  'onb.install.android3': 'Confirm.',

  'gate.welcome': 'Welcome to Upkeep',
  'gate.welcomeBack': 'Welcome back, {name}',
  'gate.lead': 'An account keeps your data safe if you lose your phone, and syncs it between devices.',
  'gate.leadReturning':
    'Create an account to keep your data safe and sync it between devices. Everything you have logged so far comes with you.',
  'gate.create': 'Create an account',
  'gate.haveOne': 'I already have one',
  'gate.without': 'Continue without an account',
  'gate.withoutTitle': 'Without an account',
  'gate.withoutWarn':
    'Your data lives only on this phone. If you lose it, clear your browser, or reinstall, everything is gone and cannot be recovered.',
  'gate.withoutNote':
    'You can create an account later and keep everything you have logged up to that point. Nothing is lost by deciding now and changing your mind afterwards.',
  'gate.createInstead': 'Create an account instead',
  'gate.continueWithout': 'Continue without one',

  'name.title': 'Welcome to Upkeep',
  'name.lead': 'What should we call you?',
  'name.label': 'Your name',
  'name.placeholder': 'John Doe',

  'goals.greeting': 'Nice to meet you, {name}',
  'goals.lead': 'Set your daily goals to get started.',
}



export type TKey = keyof typeof en
export default en