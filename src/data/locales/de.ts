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
}

export default de