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

    'auth.err.emailTaken': 'That email already has an account. Log in instead.',
  'auth.err.invalidCredentials': 'Email or password is wrong.',
  'auth.err.invalidEmail': 'That email address does not look right.',
  'auth.err.weakPassword': 'Password needs to be at least 6 characters.',
  'auth.err.wrongPassword': 'That is not your current password.',
  'auth.err.samePassword': 'The new password must be different from the old one.',
  'auth.err.invalidCode': 'That code is wrong or has expired. Request a new one.',
  'auth.err.rateLimited': 'Too many attempts. Wait a minute and try again.',
  'auth.err.offline':
    'No connection. Your data is safe on this device — try again later.',
  'auth.err.unknown': 'Something went wrong. Try again.',
  'auth.err.notSignedIn': 'You are not signed in.',

  'auth.email': 'Email',
  'auth.emailPlaceholder': 'you@example.com',
  'auth.password': 'Password',
  'auth.newPassword': 'New password',
  'auth.confirmNewPassword': 'Confirm new password',
  'auth.currentPassword': 'Current password',
  'auth.minChars': 'At least {n} characters',
  'auth.minCharsWarn': 'At least {n} characters.',
  'auth.pwMismatch': 'The two passwords do not match.',
  'auth.code': 'Code',
  'auth.resend': 'Resend code',
  'auth.resendIn': 'Resend code in {n}s',
  'auth.saving': 'Saving…',

  'login.title': 'Log in',
  'login.submit': 'Log in',
  'login.busy': 'Logging in…',
  'login.forgot': 'Forgot password',
  'login.createInstead': 'Create an account instead',

  'forgot.title': 'Forgot password',
  'forgot.lead': 'Check the address below, and we will send a {n}-digit code to it.',
  'forgot.send': 'Send code',
  'forgot.sending': 'Sending…',
  'forgot.backToLogin': 'Back to log in',
  'forgot.codeTitle': 'Enter your code',
  'forgot.codeLead':
    'If {email} has an account, a code is on its way. It expires in an hour.',
  'forgot.wrongAddress': 'Wrong address?',
  'forgot.changeIt': 'Change it',
  'forgot.setPassword': 'Set new password',

    'register.title': 'Create an account',
  'register.creatingFor': 'Creating an account for {name}.',
  'register.change': 'Change',
  'register.submit': 'Create account',
  'register.busy': 'Creating…',
  'register.logInInstead': 'Log in instead',
  'register.confirmTitle': 'Confirm your email',
  'register.confirmLead':
    'A {n}-digit code is on its way to {email}. Enter it to finish creating your account.',
  'register.confirm': 'Confirm and continue',
  'register.confirming': 'Confirming…',
  'register.haveAccount': 'Already have an account? Log in',
  'register.wrongAddress': 'Wrong address? Go back',

  'account.noAccount': 'No account linked',
  'account.noAccountWarn':
    'Everything you have logged lives only on this phone. Losing it, clearing your browser, or reinstalling erases it permanently.',
  'account.pitch':
    'An account keeps your data safe if you lose your phone. It syncs in the background and lets you log in on another device. Everything already on this phone comes with you.',
  'account.linked': 'Account linked',
  'account.linkedNote':
    'Your data syncs automatically in the background, so losing this phone does not mean losing what you have logged.',
  'account.details': 'Details',
  'account.nameNote':
    'Your name is part of your profile, not your account — change it in Settings, and it works with or without one. Changing your email is not available yet; it needs a confirmation message to both addresses, which is not set up.',
  'account.session': 'Session',
  'account.logOut': 'Log out',
  'account.logOutTitle': 'Log out?',
  'account.logOutMessage':
    'Your data stays on this device. You can log back in at any time to sync it again.',
  'account.changePassword': 'Change password',
  'account.passwordChanged': 'Password changed.',
  'account.savePassword': 'Save password',

    'adopt.checking': 'Checking your account…',
  'adopt.working': 'Sorting out your data…',
  'adopt.failedTitle': 'Could not check your account',
  'adopt.failedLead':
    'Nothing has been changed. Your data is still on this device exactly as it was.',
  'adopt.tryAgain': 'Try again',
  'adopt.logOutInstead': 'Log out instead',
  'adopt.failedFoot':
    'Your data stays on this device. Nothing has been sent to the account.',
  'adopt.errCheck': 'Could not reach your account',
  'adopt.errGeneric': 'Something went wrong',

  'adopt.title': 'Two sets of data',
  'adopt.lead':
    'This device has data, and so does the account you just signed into. Choose what to keep.',
  'adopt.colDevice': 'Device',
  'adopt.colAccount': 'Account',
  'adopt.entries': '{n} entry|{n} entries',
  'adopt.unknownDate': 'an unknown date',

  'adopt.keepBoth': 'Keep both',
  'adopt.keepBothNote':
    'Nothing is lost. Anything you have on both sides will appear twice, and you can delete the extras afterwards.',
  'adopt.goalsNote':
    'Your daily goals were last edited on this device on {local}, and the account’s on {account} — the account’s will replace yours.',
  'adopt.keepLocal': 'Keep only this device’s',
  'adopt.keepLocalNote':
    'The account’s {entries} are removed and replaced with what is on this device. A backup downloads first.',
  'adopt.keepAccount': 'Keep only the account’s',
  'adopt.keepAccountNote':
    'This device’s {entries} are erased. A backup downloads first, but this cannot be undone from inside the app.',
  'adopt.eraseTitle': 'Delete this device’s data?',
  'adopt.eraseMessage':
    'Everything logged on this device will be erased and replaced with the account’s data. A backup file downloads first, but this cannot be undone from inside the app.',
  'adopt.eraseConfirm': 'Erase and replace',

  'adopt.table.foods': 'Foods',
  'adopt.table.logEntries': 'Meal entries',
  'adopt.table.measurements': 'Weight entries',
  'adopt.table.customExercises': 'Custom exercises',
  'adopt.table.routines': 'Workout routines',
  'adopt.table.routineExercises': 'Routine exercises',
  'adopt.table.programs': 'Programs',
  'adopt.table.programDays': 'Scheduled days',
  'adopt.table.workouts': 'Workouts',
  'adopt.table.workoutSets': 'Sets logged',
  'adopt.table.careRoutines': 'Care routines',
  'adopt.table.careSteps': 'Care steps',
  'adopt.table.careDoneLog': 'Routine days',
  'adopt.table.careStepDone': 'Steps ticked',

  'sections.meals.title': 'Meals',
  'sections.meals.blurb': 'Calories, macros and your food list',
  'sections.meals.today': 'Today',
  'sections.meals.foods': 'Foods',
  'sections.meals.goals': 'Goals',
  'sections.meals.charts': 'Charts',

  'sections.body.title': 'Body',
  'sections.body.blurb': 'Weight and measurements over time',
  'sections.body.weight': 'Weight',

  'sections.workouts.title': 'Workouts',
  'sections.workouts.blurb': 'Exercises, routines and lifting progress',
  'sections.workouts.log': 'Log',
  'sections.workouts.routines': 'Routines',
  'sections.workouts.progress': 'Progress',

  'sections.routines.title': 'Routines',
  'sections.routines.blurb': 'Skin, hair and daily habits',
  'sections.routines.today': 'Today',
  'sections.routines.manage': 'Manage',

  'hub.track': 'Track',
  'hub.soon': 'Soon',
  'hub.daysLogged': 'Days logged',
  'hub.workout': 'Workout',
  'hub.workouts': 'Workouts',
  'hub.routinesLabel': 'Routines',
  'hub.noAccount': 'No account linked — your data is only on this device',
  'hub.morning': 'Good morning',
  'hub.afternoon': 'Good afternoon',
  'hub.evening': 'Good evening',

  'macro.protein': 'Protein',
  'macro.carbs': 'Carbs',
  'macro.fat': 'Fat',

  'meals.breakfast': 'Breakfast',
  'meals.lunch': 'Lunch',
  'meals.dinner': 'Dinner',
  'meals.snack': 'Snack',

  'meals.prevDay': 'Previous day',
  'meals.nextDay': 'Next day',
  'meals.eaten': 'Eaten',
  'meals.over': 'Over',
  'meals.left': 'Left',
  'meals.ofKcal': '/ {n} kcal',
  'meals.proteinMet': 'Protein minimum met · {n}g',
  'meals.proteinBelow': '{n}g below your protein minimum',
  'meals.addTo': 'Add to {meal}',
  'meals.nothingLogged': 'Nothing logged',
  'meals.remove': 'Remove {name}',
  'meals.addFood': 'Add food',

  'add.title': 'Pick a food',
  'add.searchYours': 'Search your foods…',
  'add.search': 'Search',
  'add.scan': 'Scan',
  'add.new': 'New',
  'add.yourFoods': 'Your foods',
  'add.noMatch': 'No match for "{query}"',
  'add.noFoods': 'No foods saved yet',
  'add.perHundred': '{kcal} kcal per 100{unit}',
  'add.perPiece': '1 {label} = {grams}{unit}',
  'add.piece': 'piece',
  'add.pieces': 'Pieces',
  'add.millilitres': 'Millilitres',
  'add.grams': 'Grams',
  'add.amount': 'Amount',
  'add.pcs': 'pcs',
  'add.meal': 'Meal',
  'add.macros': 'P {p}g · C {c}g · F {f}g',
  'add.submit': 'Add to log',  

  'macro.pShort': 'P {n}',
  'macro.cShort': 'C {n}',
  'macro.fShort': 'F {n}',

  'foods.filter': 'Filter your foods…',
  'foods.noMatches': 'No matches.',
  'foods.empty': 'No foods yet. Search the database, scan a barcode, or add one manually.',
  'foods.per100': '/100{unit}',
  'foods.editAria': 'Edit {name}',
  'foods.deleteAria': 'Delete {name}',
  'foods.deleteTitle': 'Delete {name}?',
  'foods.deleteMessage':
    'This removes it from your food list. Past log entries are unaffected.',
  'foods.deleteConfirm': 'Delete',

  'search.title': 'Search foods',
  'search.placeholder': 'Apple, chicken breast, oats…',
  'search.startTyping': 'Start typing to search.',
  'search.commonFoods': 'Common foods',
  'search.branded': 'Branded products',
  'search.keepTyping': 'Keep typing…',
  'search.searching': 'Searching…',
  'search.unavailable': 'Branded search is unavailable right now.',
  'search.nothingFound':
    'Nothing found. Restaurant meals often aren’t in the database — add it manually.',
  'search.loadingProduct': 'Loading product…',

  'form.editTitle': 'Edit food',
  'form.newTitle': 'New food',
  'form.name': 'Name',
  'form.namePlaceholder': 'Oats',
  'form.brand': 'Brand (optional)',
  'form.measuredIn': 'Measured in',
  'form.grams': 'Grams (solids)',
  'form.millilitres': 'Millilitres (liquids)',
  'form.valuesPer': 'Values per 100{unit}',
  'form.calories': 'Calories',
  'form.protein': 'Protein',
  'form.carbs': 'Carbs',
  'form.fat': 'Fat',
  'form.fiber': 'Fibre (optional)',
  'form.sugar': 'Sugar (optional)',

  'form.piecesTitle': 'Pieces (optional)',
  'form.piecesNote': 'For things you count rather than weigh — tortillas, slices, eggs.',
  'form.pieceLabel': 'What one piece is called',
  'form.pieceLabelPlaceholder': 'tortilla',
  'form.fromPackage': 'Work it out from the package',
  'form.packWeight': 'Package weight',
  'form.packCount': 'Pieces inside',
  'form.calculate': 'Calculate',
  'form.pieceWeight': 'Weight per {label}',
  'form.pieceKcal': 'One {label} ≈ {n} kcal',

  'form.kcalWarning':
    'Heads up: the macros work out to about {derived} kcal, but you entered {entered}. Worth double-checking — though high-fibre foods do differ legitimately.',

  'form.saveChanges': 'Save changes',
  'form.addFood': 'Add food',  

  'scan.title': 'Scan barcode',
  'scan.starting': 'Starting the camera…',
  'scan.hint': 'Hold the barcode inside the box, about 20cm away, level with the ground.',
  'scan.camera': 'Camera: {resolution}',
  'scan.manualLabel': 'Or enter the barcode number',
  'scan.lookUp': 'Look up',
  'scan.lookingUp': 'Looking up product…',
  'scan.notFound': 'Barcode {code} isn’t in the database. Add it manually instead.',
  'scan.lookupFailed': 'Lookup failed',

  'scan.err.blocked':
    'Camera access is blocked. Allow it in your browser settings, or type the number below.',
  'scan.err.noCamera': 'No camera found on this device. Type the number below.',
  'scan.err.other': 'Camera could not start{detail}. Type the number below.',

  'goals.title': 'Daily goals',
  'goals.dailyCalories': 'Daily calories',
  'goals.macroSplit': 'Macro split',
  'goals.total': 'Total: {n}%',
  'goals.mustBe100': ' — must add up to 100',
  'goals.minProtein': 'Minimum protein per day',
  'goals.worksOutTo': 'That works out to',
  'goals.breakdown': '{p}g protein · {c}g carbs · {f}g fat',
  'goals.save': 'Save goals',

  'charts.title': 'Charts',
  'charts.rangeDays': '{n} day|{n} days',
  'charts.todaysMacros': 'Today’s macros',
  'charts.nothingToday': 'Nothing logged today yet.',
  'charts.calories': 'Calories',
  'charts.protein': 'Protein',
  'charts.average': 'Average',
  'charts.ofKcal': '/ {n} kcal',
  'charts.ofGrams': '/ {n} g',
  'charts.kcalTarget': 'Dashed line: your {n} kcal target',
  'charts.proteinTarget': 'Dashed line: your {n}g minimum',
  'charts.tooltipMacro': '{grams}g · {kcal} kcal',
  'charts.tooltipKcal': '{n} kcal',
  'charts.tooltipGrams': '{n} g',

  'charts.summary': 'Summary',
  'charts.nothingInPeriod': 'Nothing logged in this period.',
  'charts.daysLogged': 'Days logged',
  'charts.ofDays': '{done} of {total}',
  'charts.avgCalories': 'Average calories',
  'charts.avgProtein': 'Average protein',
  'charts.target': 'target {n}',
  'charts.proteinHit': 'Protein minimum hit',
  'charts.ofNDays': '{done} of {total} day|{done} of {total} days',  

  'layout.home': 'Home',
  'layout.account': 'Account',
  'layout.settings': 'Settings',
}



export type TKey = keyof typeof en
export default en