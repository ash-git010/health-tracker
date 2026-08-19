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
}

export type TKey = keyof typeof en
export default en