import type { TKey } from './en'

/**
 * Typed against en.ts's keys: omit one and the build fails.
 *
 * Informal "du" throughout — this is a personal health app, not a bank.
 * "Upkeep" is never translated.
 */
const de: Record<TKey, string> = {
  'settings.title': 'Einstellungen',
  'settings.name': 'Name',
  'settings.nameLabel': 'Wie wir dich nennen',
  'settings.updateName': 'Namen ändern',
  'settings.saved': 'Gespeichert',

  'settings.language': 'Sprache',

  'settings.yourData': 'Deine Daten',
  'settings.dataNote':
    'Nur auf diesem Gerät gespeichert. Exportiere regelmäßig — beim Löschen der Browserdaten geht alles verloren.',
  'settings.exportBackup': 'Backup exportieren',
  'settings.backupDownloaded': 'Backup heruntergeladen',
  'settings.restore': 'Backup wiederherstellen',
  'settings.restoreTitle': 'Backup wiederherstellen?',
  'settings.restoreMessage': 'Dies ersetzt alles, was derzeit auf diesem Gerät gespeichert ist.',
  'settings.restoreConfirm': 'Wiederherstellen',
  'settings.restored': 'Wiederhergestellt. Lade die App neu, um es zu sehen.',
  'settings.importFailed': 'Import fehlgeschlagen: {message}',
  'settings.unknownError': 'unbekannter Fehler',

  'settings.app': 'App',
  'settings.install': 'Auf dem Handy installieren',
  'settings.about': 'Über Upkeep',
  'settings.feedback': 'Problem melden',

    'common.add': 'Hinzufügen',
  'common.back': 'Zurück',
  'common.save': 'Speichern',
  'common.cancel': 'Abbrechen',
  'common.continue': 'Weiter',

  'app.loading': 'Lädt…',
  'app.gettingData': 'Deine Daten werden geladen…',

  'dates.today': 'Heute',
  'dates.yesterday': 'Gestern',

  'rpe.off': 'Aus',

  'onb.skip': 'Überspringen',
  'onb.getStarted': 'Los geht\u2019s',
  'onb.haveAccount': 'Hast du schon ein Konto?',
  'onb.logIn': 'Anmelden',
  'onb.goToSlide': 'Zu Folie {n}',

  'onb.welcome.title': 'Willkommen bei Upkeep',
  'onb.welcome.lead': 'Alles, was du für dich tust, an einem Ort.',
  'onb.welcome.p1': 'Vier Bereiche, ein Startbildschirm',
  'onb.welcome.p2': 'Funktioniert offline, öffnet sofort',
  'onb.welcome.p3': 'Keine Werbung, kein Feed, kein Streak-Druck',

  'onb.meals.title': 'Mahlzeiten',
  'onb.meals.lead': 'Erfasse, was du isst, ohne dich mit der App zu streiten.',
  'onb.meals.p1': 'Barcode scannen oder Lebensmittel suchen',
  'onb.meals.p2': 'Nach Gewicht oder nach Stück erfassen',
  'onb.meals.p3': 'Tägliche Makroziele und Diagramme',

  'onb.body.title': 'Körper',
  'onb.body.lead': 'Gewicht, geglättet — damit ein schwerer Morgen kein Trend wird.',
  'onb.body.p1': 'Gleitender Durchschnitt über 7 Einträge',
  'onb.body.p2': 'Veränderung über 7 und 30 Tage auf einen Blick',
  'onb.body.p3': 'Optional Größe und BMI',

  'onb.workouts.title': 'Training',
  'onb.workouts.lead': 'Trainiere nach Plan oder frei — und sieh deinen Fortschritt.',
  'onb.workouts.p1': 'Über 1.300 Übungen, plus deine eigenen',
  'onb.workouts.p2': 'Sätze, Aufwärmsätze, Dropsätze, Pausentimer',
  'onb.workouts.p3': 'Persönliche Rekorde und Volumen-Trends',

  'onb.routines.title': 'Routinen',
  'onb.routines.lead': 'Die kleinen täglichen Dinge, die nur wirken, wenn du sie wirklich machst.',
  'onb.routines.p1': 'Morgen-, Abend- und Jederzeit-Routinen',
  'onb.routines.p2': 'Benannte Schritte mit Produktnotizen',
  'onb.routines.p3': 'Streaks, die einen ausgelassenen Tag überstehen',

  'onb.account.title': 'Deine Daten bleiben deine',
  'onb.account.lead':
    'Alles wird zuerst auf diesem Gerät gespeichert. Es funktioniert auch ohne Empfang.',
  'onb.account.p1': 'Mit einem Konto synchronisierst du zwischen deinen Geräten',
  'onb.account.p2': 'Melde dich überall an und mach da weiter, wo du aufgehört hast',
  'onb.account.p3': 'Exportiere jederzeit ein vollständiges Backup',

  'onb.install.title': 'Zum Startbildschirm hinzufügen',
  'onb.install.lead':
    'Upkeep öffnet sich dann wie jede andere App — im Vollbild, mit eigenem Icon, und funktioniert weiterhin ohne Empfang.',
  'onb.install.done': 'Hinzugefügt. Öffne Upkeep nächstes Mal über deinen Startbildschirm.',
  'onb.install.button': 'Zum Startbildschirm hinzufügen',
  'onb.install.hint': 'Dein Browser fragt dich zur Bestätigung.',
  'onb.install.iosHead': 'Auf dem iPhone, in Safari',
  'onb.install.ios1': 'Tippe unten auf den Teilen-Button.',
  'onb.install.ios2': 'Scrolle nach unten und tippe auf „Zum Home-Bildschirm“.',
  'onb.install.ios3': 'Tippe oben rechts auf „Hinzufügen“.',
  'onb.install.androidHead': 'In deinem Browser-Menü',
  'onb.install.android1': 'Tippe oben rechts auf die drei Punkte.',
  'onb.install.android2': 'Wähle „App installieren“ oder „Zum Startbildschirm hinzufügen“.',
  'onb.install.android3': 'Bestätige.',

  'gate.welcome': 'Willkommen bei Upkeep',
  'gate.welcomeBack': 'Willkommen zurück, {name}',
  'gate.lead':
    'Ein Konto schützt deine Daten, falls du dein Handy verlierst, und synchronisiert sie zwischen deinen Geräten.',
  'gate.leadReturning':
    'Erstelle ein Konto, damit deine Daten sicher sind und zwischen deinen Geräten synchronisiert werden. Alles, was du bisher erfasst hast, kommt mit.',
  'gate.create': 'Konto erstellen',
  'gate.haveOne': 'Ich habe bereits eins',
  'gate.without': 'Ohne Konto fortfahren',
  'gate.withoutTitle': 'Ohne Konto',
  'gate.withoutWarn':
    'Deine Daten liegen nur auf diesem Handy. Wenn du es verlierst, deine Browserdaten löschst oder die App neu installierst, ist alles weg und kann nicht wiederhergestellt werden.',
  'gate.withoutNote':
    'Du kannst später ein Konto erstellen und behältst alles, was du bis dahin erfasst hast. Es geht nichts verloren, wenn du dich jetzt entscheidest und es dir später anders überlegst.',
  'gate.createInstead': 'Stattdessen ein Konto erstellen',
  'gate.continueWithout': 'Ohne Konto fortfahren',

  'name.title': 'Willkommen bei Upkeep',
  'name.lead': 'Wie sollen wir dich nennen?',
  'name.label': 'Dein Name',
  'name.placeholder': 'Max Mustermann',

  'goals.greeting': 'Schön, dich kennenzulernen, {name}',
  'goals.lead': 'Lege deine Tagesziele fest, um loszulegen.',
}

export default de