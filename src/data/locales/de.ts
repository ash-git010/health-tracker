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

  'auth.err.emailTaken':
    'Diese E-Mail-Adresse hat bereits ein Konto. Melde dich stattdessen an.',
  'auth.err.invalidCredentials': 'E-Mail oder Passwort ist falsch.',
  'auth.err.invalidEmail': 'Diese E-Mail-Adresse sieht nicht richtig aus.',
  'auth.err.weakPassword': 'Das Passwort muss mindestens 6 Zeichen haben.',
  'auth.err.wrongPassword': 'Das ist nicht dein aktuelles Passwort.',
  'auth.err.samePassword': 'Das neue Passwort muss sich vom alten unterscheiden.',
  'auth.err.invalidCode': 'Dieser Code ist falsch oder abgelaufen. Fordere einen neuen an.',
  'auth.err.rateLimited': 'Zu viele Versuche. Warte eine Minute und probiere es erneut.',
  'auth.err.offline':
    'Keine Verbindung. Deine Daten sind auf diesem Gerät sicher — probiere es später erneut.',
  'auth.err.unknown': 'Etwas ist schiefgelaufen. Probiere es erneut.',
  'auth.err.notSignedIn': 'Du bist nicht angemeldet.',

  'auth.email': 'E-Mail',
  'auth.emailPlaceholder': 'du@beispiel.de',
  'auth.password': 'Passwort',
  'auth.newPassword': 'Neues Passwort',
  'auth.confirmNewPassword': 'Neues Passwort bestätigen',
  'auth.currentPassword': 'Aktuelles Passwort',
  'auth.minChars': 'Mindestens {n} Zeichen',
  'auth.minCharsWarn': 'Mindestens {n} Zeichen.',
  'auth.pwMismatch': 'Die beiden Passwörter stimmen nicht überein.',
  'auth.code': 'Code',
  'auth.resend': 'Code erneut senden',
  'auth.resendIn': 'Erneut senden in {n}s',
  'auth.saving': 'Wird gespeichert…',

  'login.title': 'Anmelden',
  'login.submit': 'Anmelden',
  'login.busy': 'Wird angemeldet…',
  'login.forgot': 'Passwort vergessen',
  'login.createInstead': 'Stattdessen Konto erstellen',

  'forgot.title': 'Passwort vergessen',
  'forgot.lead':
    'Prüfe die Adresse unten — wir senden einen {n}-stelligen Code dorthin.',
  'forgot.send': 'Code senden',
  'forgot.sending': 'Wird gesendet…',
  'forgot.backToLogin': 'Zurück zur Anmeldung',
  'forgot.codeTitle': 'Code eingeben',
  'forgot.codeLead':
    'Falls {email} ein Konto hat, ist ein Code unterwegs. Er läuft in einer Stunde ab.',
  'forgot.wrongAddress': 'Falsche Adresse?',
  'forgot.changeIt': 'Ändern',
  'forgot.setPassword': 'Neues Passwort setzen',

    'register.title': 'Konto erstellen',
  'register.creatingFor': 'Du erstellst ein Konto für {name}.',
  'register.change': 'Ändern',
  'register.submit': 'Konto erstellen',
  'register.busy': 'Wird erstellt…',
  'register.logInInstead': 'Stattdessen anmelden',
  'register.confirmTitle': 'E-Mail bestätigen',
  'register.confirmLead':
    'Ein {n}-stelliger Code ist unterwegs an {email}. Gib ihn ein, um dein Konto fertig zu erstellen.',
  'register.confirm': 'Bestätigen und weiter',
  'register.confirming': 'Wird bestätigt…',
  'register.haveAccount': 'Schon ein Konto? Anmelden',
  'register.wrongAddress': 'Falsche Adresse? Zurück',

  'account.noAccount': 'Kein Konto verknüpft',
  'account.noAccountWarn':
    'Alles, was du erfasst hast, liegt nur auf diesem Handy. Wenn du es verlierst, deine Browserdaten löschst oder die App neu installierst, ist alles endgültig weg.',
  'account.pitch':
    'Ein Konto schützt deine Daten, falls du dein Handy verlierst. Es synchronisiert im Hintergrund und du kannst dich auf einem anderen Gerät anmelden. Alles, was schon auf diesem Handy ist, kommt mit.',
  'account.linked': 'Konto verknüpft',
  'account.linkedNote':
    'Deine Daten werden automatisch im Hintergrund synchronisiert — dieses Handy zu verlieren heißt also nicht, deine Einträge zu verlieren.',
  'account.details': 'Details',
  'account.nameNote':
    'Dein Name gehört zu deinem Profil, nicht zu deinem Konto — ändere ihn in den Einstellungen, er funktioniert mit und ohne Konto. Deine E-Mail-Adresse zu ändern geht noch nicht: das braucht eine Bestätigung an beide Adressen, und die ist noch nicht eingerichtet.',
  'account.session': 'Sitzung',
  'account.logOut': 'Abmelden',
  'account.logOutTitle': 'Abmelden?',
  'account.logOutMessage':
    'Deine Daten bleiben auf diesem Gerät. Du kannst dich jederzeit wieder anmelden, um sie erneut zu synchronisieren.',
  'account.changePassword': 'Passwort ändern',
  'account.passwordChanged': 'Passwort geändert.',
  'account.savePassword': 'Passwort speichern',

    'adopt.checking': 'Dein Konto wird geprüft…',
  'adopt.working': 'Deine Daten werden sortiert…',
  'adopt.failedTitle': 'Dein Konto konnte nicht geprüft werden',
  'adopt.failedLead':
    'Es wurde nichts geändert. Deine Daten liegen unverändert auf diesem Gerät.',
  'adopt.tryAgain': 'Erneut versuchen',
  'adopt.logOutInstead': 'Stattdessen abmelden',
  'adopt.failedFoot':
    'Deine Daten bleiben auf diesem Gerät. Es wurde nichts an das Konto gesendet.',
  'adopt.errCheck': 'Dein Konto war nicht erreichbar',
  'adopt.errGeneric': 'Etwas ist schiefgelaufen',

  'adopt.title': 'Zwei Datensätze',
  'adopt.lead':
    'Auf diesem Gerät liegen Daten, und im Konto, in das du dich gerade angemeldet hast, auch. Wähle, was behalten wird.',
  'adopt.colDevice': 'Gerät',
  'adopt.colAccount': 'Konto',
  'adopt.entries': '{n} Eintrag|{n} Einträge',
  'adopt.unknownDate': 'einem unbekannten Datum',

  'adopt.keepBoth': 'Beide behalten',
  'adopt.keepBothNote':
    'Nichts geht verloren. Was auf beiden Seiten liegt, erscheint doppelt — die Dubletten kannst du danach löschen.',
  'adopt.goalsNote':
    'Deine Tagesziele wurden auf diesem Gerät zuletzt am {local} bearbeitet, die des Kontos am {account} — die des Kontos ersetzen deine.',
  'adopt.keepLocal': 'Nur die von diesem Gerät',
  'adopt.keepLocalNote':
    'Die {entries} des Kontos werden entfernt und durch das ersetzt, was auf diesem Gerät liegt. Vorher wird eine Sicherung heruntergeladen.',
  'adopt.keepAccount': 'Nur die des Kontos',
  'adopt.keepAccountNote':
    'Die {entries} auf diesem Gerät werden gelöscht. Vorher wird eine Sicherung heruntergeladen, aber das lässt sich in der App nicht rückgängig machen.',
  'adopt.eraseTitle': 'Daten dieses Geräts löschen?',
  'adopt.eraseMessage':
    'Alles, was auf diesem Gerät erfasst wurde, wird gelöscht und durch die Daten des Kontos ersetzt. Vorher wird eine Sicherungsdatei heruntergeladen, aber das lässt sich in der App nicht rückgängig machen.',
  'adopt.eraseConfirm': 'Löschen und ersetzen',

  'adopt.table.foods': 'Essen',
  'adopt.table.logEntries': 'Mahlzeiten-Einträge',
  'adopt.table.measurements': 'Gewichts-Einträge',
  'adopt.table.customExercises': 'Eigene Übungen',
  'adopt.table.routines': 'Trainingspläne',
  'adopt.table.routineExercises': 'Plan-Übungen',
  'adopt.table.workouts': 'Einheiten',
  'adopt.table.workoutSets': 'Erfasste Sätze',
  'adopt.table.careRoutines': 'Routinen',
  'adopt.table.careSteps': 'Routine-Schritte',
  'adopt.table.careDoneLog': 'Routine-Tage',
  'adopt.table.careStepDone': 'Abgehakte Schritte',

  'sections.meals.title': 'Mahlzeiten',
  'sections.meals.blurb': 'Kalorien, Makros und deine Lebensmittel',
  'sections.meals.today': 'Heute',
  // 'Essen', not 'Lebensmittel' — correct but far too long for a four-tab bar.
  'sections.meals.foods': 'Essen',
  'sections.meals.goals': 'Ziele',
  'sections.meals.charts': 'Diagramme',

  'sections.body.title': 'Körper',
  'sections.body.blurb': 'Gewicht und Maße im Zeitverlauf',
  'sections.body.weight': 'Gewicht',

  'sections.workouts.title': 'Training',
  'sections.workouts.blurb': 'Übungen, Pläne und Kraftfortschritt',
  'sections.workouts.log': 'Trainieren',
  // 'Pläne', not 'Routinen' — English collides with the Routines section and
  // German would inherit the collision. Also what German lifters actually say.
  'sections.workouts.routines': 'Pläne',
  'sections.workouts.progress': 'Fortschritt',

  'sections.routines.title': 'Routinen',
  'sections.routines.blurb': 'Haut, Haare und tägliche Gewohnheiten',
  'sections.routines.today': 'Heute',
  'sections.routines.manage': 'Verwalten',

  'hub.track': 'Tracken',
  'hub.soon': 'Bald',
  'hub.daysLogged': 'Tage erfasst',
  // 'Einheit(en)', not 'Training(s)' — sessions is the natural German unit,
  // and it stays distinct from the section name.
  'hub.workout': 'Einheit',
  'hub.workouts': 'Einheiten',
  'hub.routinesLabel': 'Routinen',
  'hub.noAccount': 'Kein Konto verknüpft — deine Daten liegen nur auf diesem Gerät',
  'hub.morning': 'Guten Morgen',
  // German has no common 'Guten Nachmittag'.
  'hub.afternoon': 'Guten Tag',
  'hub.evening': 'Guten Abend',

  'layout.home': 'Startseite',
  'layout.account': 'Konto',
  'layout.settings': 'Einstellungen',
}

export default de