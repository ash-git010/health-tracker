export interface Release {
  version: string
  date: string
  changes: string[]
  changesDe?: string[]
}

export const CHANGELOG: Release[] = [
  {
    version: '2.2',
    date: '2026-08-24',
    changes: [
      'Upkeep is now bilingual — English and German, switch anytime in Settings',
      'Programs are here — import a multi-week plan from a file, or build one by hand with weeks, scheduled days and rep ranges',
      "The workout Log tab now shows what's due today from your active program, or offers your routines if you don't have one running",
      'Swap an exercise mid-workout without losing your sets, or set up alternates ahead of time on a routine',
      'A gold flash marks the moment you hit an all-time personal record',
      'The rest timer now floats above the screen instead of living on one exercise card',
      'Routine notes show on the active workout, not just in the editor',
    ],
    changesDe: [
      'Upkeep ist jetzt zweisprachig — Englisch und Deutsch, umschaltbar jederzeit in den Einstellungen',
      'Programme sind da — importiere einen mehrwöchigen Plan aus einer Datei oder baue einen von Hand, mit Wochen, geplanten Tagen und Wiederholungsbereichen',
      'Der Trainieren-Tab zeigt jetzt, was heute laut deinem aktiven Programm ansteht, oder bietet deine Pläne an, wenn keins läuft',
      'Tausche mitten im Workout eine Übung aus, ohne deine Sätze zu verlieren, oder richte vorab Alternativen für einen Plan ein',
      'Ein goldenes Aufblitzen markiert den Moment, in dem du einen persönlichen Bestwert aller Zeiten erreichst',
      'Der Pausentimer schwebt jetzt über dem Bildschirm, statt an einer Übungskarte zu kleben',
      'Notizen zum Plan werden jetzt auch beim aktiven Workout angezeigt, nicht nur im Editor',
    ],
  },
  {
    version: '2.1.1',
    date: '2026-08-22',
    changes: [
      'Typing a weight or an amount with a comma, like 67,5, now saves the number you actually typed — it used to silently drop the comma and save ten times too much',
      'Tap a set number to change its type or remove it; the small × next to each set is gone',
    ],
    changesDe: [
      'Ein Gewicht oder ein Betrag mit Komma, wie 67,5, wird jetzt so gespeichert, wie du es eingegeben hast — vorher wurde das Komma stillschweigend verworfen und der zehnfache Wert gespeichert',
      'Tippe auf eine Satznummer, um ihren Typ zu ändern oder den Satz zu entfernen; das kleine × neben jedem Satz ist weg',
    ],
  },
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
    changesDe: [
      'Pläne merken sich jetzt das Zielgewicht und die Ziel-Wiederholungen für jeden Satz, nicht nur die Anzahl der Sätze',
      'Pläne können Aufwärmsätze enthalten, und wenn du einen startest, bekommst du jeden Satz, den er vorsieht',
      'Beim ersten Mal, dass du eine Übung machst, werden deine Zielwerte vorausgefüllt; danach siehst du stattdessen deine letzte Einheit',
      'Lege ein Ziel-RPE für eine Übung fest und passe es mitten im Workout an, ohne den Plan zu ändern',
      'Wähle einen Pausentimer aus einer Liste, statt Sekunden zu zählen, und füge Notizen zu einem Plan oder einer Übung hinzu',
      'Etwas mitten im Workout geändert? Beim Beenden wird angeboten, es im Plan zu speichern, mit einer Liste, was sich geändert hat',
      'Übungen mit Körpergewicht: Lass das Gewicht leer und hake den Satz allein anhand der Wiederholungen ab',
      'Der Pausentimer läuft korrekt weiter, während dein Handy gesperrt ist, mit einem längeren Ton, den du auch wirklich hörst',
      'Ein geleertes Zahlenfeld springt nicht mehr auf 1 — es bleibt leer und sagt dir beim Speichern, wenn etwas fehlt',
      'Die Spalten der Sätze richten sich an ihren Überschriften aus und verschieben sich nicht mehr, wenn du einen Satz abhakst',
      'Der Löschen-Button bei einem Satz ist kleiner und rot, und der Header zeigt die Seite nicht mehr durch',
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
    changesDe: [
      'Passwort vergessen? Hol dir per E-Mail einen Code und setze ein neues, ohne etwas zu verlieren',
      'Neue Konten bestätigen jetzt deine E-Mail-Adresse mit einem Code, damit sich niemand als du anmelden kann',
      'Upkeep ist zu upkeepdaily.com umgezogen — aktualisiere alle Lesezeichen, die du hast',
      'E-Mails von Upkeep kommen jetzt von upkeepdaily.com und sehen aus wie die App',
      'Du bekommst eine E-Mail, wenn sich dein Passwort oder deine E-Mail-Adresse jemals ändert, damit du weißt, wenn es nicht du warst',
      'Das Wischen durch die Einführung auf Handys funktioniert jetzt — vorher passierte nichts',
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
    changesDe: [
      'Erstelle ein Konto, damit deine Daten sicher sind, falls du dein Handy verlierst',
      'Du kannst dich jetzt bei einem anderen Konto anmelden, auch auf einem Gerät, das schon mit einem synchronisiert hat',
      'Ein Fehler beim Wechseln eines Geräts zu einem zweiten Konto ist behoben',
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
    changesDe: [
      'Ändere dein Passwort auf dem Konto-Bildschirm',
      'Neue Passwörter brauchen mindestens 8 Zeichen',
      'Wenn du dich umbenennst, aktualisiert sich der Home-Bildschirm sofort',
      'Ein neues App-Symbol',
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
    changesDe: [
      'Eine kurze Einführung beim ersten Öffnen von Upkeep, die zeigt, was jeder Bereich macht',
      'Füge Upkeep mit einem Tipp auf Android zum Home-Bildschirm hinzu, mit Schritt-für-Schritt-Anleitung fürs iPhone',
      'Neue Installationsanleitung in den Einstellungen',
      '„Über Upkeep“ erklärt jetzt, wie deine Daten tatsächlich gespeichert werden',
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
    changesDe: [
      'Konten sind da — erstelle eins, und deine Daten synchronisieren sich automatisch im Hintergrund',
      'Melde dich auf einem anderen Gerät an, um dort weiterzumachen, wo du aufgehört hast',
      'Beim Anmelden auf einem Gerät mit vorhandenen Daten wirst du gefragt, was du behalten willst, und vorher wird alles gesichert',
      'Dein Name und deine Ziele kommen mit, wenn du dich woanders neu anmeldest',
      'Der Home-Bildschirm erinnert dich, wenn kein Konto verknüpft ist',
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
    changesDe: [
      'Routinen sind da — baue eine Haut-, Haar- oder beliebige tägliche Routine und hake sie ab',
      'Schritte können festhalten, welches Produkt du benutzt',
      'Serien für jede Routine, mit Skip-Tagen, die die Serie nicht unterbrechen',
      'Gruppiere Routinen nach morgens, abends oder jederzeit, und erstelle eigene Arten',
      'Der Home-Bildschirm zeigt jetzt deine Woche auf einen Blick',
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
    changesDe: [
      'Bestätigungen sehen jetzt wie Teil der App aus, statt wie Browser-Popups',
      'Ordne Pläne und Ordner neu an und verschiebe Pläne zwischen Ordnern',
      'Beim Speichern eines Workouts als Plan kannst du jetzt einen Ordner wählen',
      'Durchgängig Symbole, und aufgeräumtere Listen',
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
    ],
    changesDe: [
      'Neues dunkles Design überall — klarer, ruhiger, auf einen Blick leichter lesbar',
      'Wichtige Zahlen stehen jetzt auf jedem Bildschirm im Mittelpunkt',
      'Symbole für Trainingsgeräte, Bereiche und Bedienelemente',
      'Neu gestalteter Home-Bildschirm',
      'Suche, scanne oder füge ein neues Essen hinzu, ohne die Mahlzeit zu verlassen, die du gerade erfasst',
      'Größere Tippflächen und weichere Übergänge',
    ],
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
    changesDe: [
      'Neuer Fortschritt-Tab bei Workouts — sieh dein Training auf einen Blick',
      'Kalenderansicht, die zeigt, an welchen Tagen du trainiert hast, mit wöchentlichem Serienzähler',
      'Sätze pro Muskelgruppe, damit du erkennst, was du zu wenig trainierst',
      'Muskelbalance-Diagramm, das zeigt, wie gleichmäßig du deinen Körper trainierst',
      'Volumen-Trend der letzten drei Monate',
      'Aktuelle persönliche Rekorde, mit einem direkten Link zu dieser Übung',
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
    changesDe: [
      'Tippe auf eine Übung, um ihre komplette Historie, Rekorde und ihren Fortschritt im Zeitverlauf zu sehen',
      'Persönliche Rekorde für geschätztes 1RM, maximales Gewicht, maximale Wiederholungen und Volumen',
      'Geschätzte Leistungstabelle, die zeigt, was du bei jeder Wiederholungszahl heben könntest',
      'Erstelle eigene Übungen für alles, was nicht in der Bibliothek ist',
      'Entferne einen einzelnen Satz, ohne die ganze Übung zu löschen',
      'Klarere Diagramme — keine negativen Werte oder doppelten Daten mehr',
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
    changesDe: [
      'Workouts sind da — protokolliere Sätze, baue Pläne, verfolge deine Lifts',
      'Eine Bibliothek mit über 1.300 Übungen inklusive Anleitung, durchsuchbar nach Name, Muskel oder Ausrüstung',
      'Hake jeden Satz beim Trainieren ab, mit den Werten der letzten Einheit als Referenz',
      'Pausentimer, der unter der Übung herunterzählt, mit Signalton, wenn die Zeit um ist',
      'Speichere jedes Workout als Plan, organisiert in Ordnern, und starte beim nächsten Mal davon',
      'Benenne dein Workout am Ende statt am Anfang',
      'Workout-Verlauf mit allen Details — tippe auf eine Einheit, um sie zu überprüfen oder zu bearbeiten',
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
    changesDe: [
      'Durchgängig größere Tippflächen — Buttons und Bedienelemente sind leichter zu treffen',
      'Die Workout-Zusammenfassung bleibt fixiert, während du durch die Übungen scrollst',
      'Filtere Übungen bei der Suche nach Körperbereich',
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
    changesDe: [
      'Updates installieren sich jetzt automatisch, statt auf ein manuelles Neuladen zu warten',
      'Ein Hinweis erscheint, wenn eine neue Version bereit ist',
      'Neues App-Symbol — entfernen und vom Home-Bildschirm neu installieren, um es zu sehen',
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
    changesDe: [
      'Die Suche verzeiht jetzt Tippfehler, Teilwörter und jede Wortreihenfolge',
      'Schnell-hinzufügen-Buttons, die beim Scrollen sichtbar bleiben',
      'Die untere Leiste überlappt nicht mehr mit dem Gesten-Bereich auf manchen Handys',
      'Barcode-Scannen funktioniert jetzt auf dem iPhone, wenn auch langsamer als auf Android',
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
    changesDe: [
      'Der Zurück-Button funktioniert jetzt überall in der App richtig',
      'Beim Neuladen bleibst du auf dem Bildschirm, den du gerade angesehen hast',
      'Gewichts-Trenddiagramm mit gleitendem Durchschnitt aus 7 Einträgen',
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
    changesDe: [
      'Neuer Diagramme-Tab bei Essen — Makro-Aufschlüsselung, Kalorien- und Protein-Trends',
      'Wechsle zwischen 7-, 14- und 30-Tage-Ansichten',
      'Zusammenfassung mit durchschnittlicher Aufnahme und wie oft du dein Proteinminimum erreicht hast',
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
    changesDe: [
      'Die Suche findet jetzt auch einfaches Essen wie Äpfel, Eier, Hähnchen oder Reis, nicht nur verpackte Produkte',
      'Vieles davon kommt jetzt mit Stückgewicht, sodass du „1 Apfel“ erfassen kannst, statt ihn zu wiegen',
      'Markenprodukte in der Suche werden jetzt auf die in deinem Land verkauften gefiltert',
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
    changesDe: [
      'Neuer Home-Bildschirm — wähle, was du verfolgen möchtest',
      'Die App merkt sich deinen letzten Bereich und öffnet ihn direkt',
      'Einstellungen und Feedback sind jetzt von überall über das Zahnrad-Symbol erreichbar',
      'Platzhalter für Workouts und Routinen hinzugefügt, demnächst verfügbar',
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
    changesDe: [
      'Verfolge dein Gewicht über die Zeit, mit Veränderung über 7 und 30 Tage',
      'Optionale Größe, mit automatisch berechnetem BMI',
      'Melde Fehler und schlage Ideen vor, direkt aus den Einstellungen',
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
    changesDe: [
      'Durchsuche die Open-Food-Facts-Datenbank nach Namen — nützlich, wenn ein Produkt keinen Barcode hat',
      'Füge Essen hinzu, das in Stück gemessen wird (Tortillas, Scheiben, Eier), und erfasse nach Anzahl statt Gewicht',
      'Kalorien werden jetzt auch bei Produkten erkannt, die nur Kilojoule angeben',
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
    changesDe: [
      'Umbenannt in Upkeep',
      'Frisches Aussehen mit einheitlichem Design auf jedem Bildschirm',
      'Die App fragt jetzt beim ersten Öffnen nach deinem Namen und begrüßt dich damit',
      'Neue Über-Seite mit Installationshilfe, Versionshinweisen und Infos zur Geräteunterstützung',
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
    changesDe: [
      'Scanne einen Barcode, um ein Produkt automatisch nachzuschlagen',
      'Produktdaten stammen von Open Food Facts, einer freien Community-Datenbank',
      'Exportiere deine Daten als Backup-Datei und stelle sie später wieder her',
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
    changesDe: [
      'Erfasse Mahlzeiten über Frühstück, Mittag-, Abendessen und Snacks',
      'Tägliche Kalorien- und Makro-Summen mit Fortschrittsbalken',
      'Separates Tracking für dein tägliches Mindestprotein',
      'Blättere zurück durch vergangene Tage',
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
    changesDe: [
      'Lege dein tägliches Kalorienziel und deine Makro-Verteilung fest',
      'Baue eine Essensliste mit Werten pro 100 g oder 100 ml auf',
      'Warnung, wenn die Kalorien eines Lebensmittels nicht zu seinen Makros passen',
    ],
  },
  {
    version: '0.1',
    date: '2026-07-29',
    changes: [
      'First version — installable on your phone as an app',
      'Works offline',
    ],
    changesDe: [
      'Erste Version — als App auf dein Handy installierbar',
      'Funktioniert offline',
    ],
  },
]

export const APP_VERSION = CHANGELOG[0].version
