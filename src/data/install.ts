/**
 * Install prompt handling.
 *
 * Chrome fires `beforeinstallprompt` once per page load, early — usually
 * before React has mounted, and always before the user has navigated to the
 * install screen. Left unhandled it is consumed by the browser's own mini
 * infobar and cannot be recovered, so the listener is registered at startup
 * from main.tsx and the event is held here until something asks for it.
 *
 * Safari implements none of this. Every iOS browser is WebKit underneath, so
 * there is no programmatic install path on iPhone or iPad at all — that route
 * is manual instructions only.
 */

export type InstallPlatform = 'ios' | 'android' | 'desktop'

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>
}

let deferred: BeforeInstallPromptEvent | null = null
let started = false

const listeners = new Set<() => void>()

function emit(): void {
  for (const listener of listeners) listener()
}

/**
 * Called once from main.tsx, before React renders. Idempotent, and never torn
 * down — same reasoning as startAutoSync: the app does not unmount, and a
 * `started` guard is simpler than unsubscribing.
 */
export function startInstallWatch(): void {
  if (started) return
  started = true

  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault()
    deferred = e as BeforeInstallPromptEvent
    emit()
  })

  window.addEventListener('appinstalled', () => {
    deferred = null
    emit()
  })
}

/** True when a real install button can be shown. False on every iOS browser. */
export function canPromptInstall(): boolean {
  return deferred !== null
}

/** Subscribe to availability changes. Returns an unsubscribe function. */
export function onInstallChange(fn: () => void): () => void {
  listeners.add(fn)
  return () => {
    listeners.delete(fn)
  }
}

/**
 * Fires the browser's install sheet.
 *
 * The event is single-use — Chrome rejects a second prompt() on the same
 * object — so it is cleared before use rather than after, which keeps the
 * button from being tappable twice while the sheet is open.
 */
export async function promptInstall(): Promise<'accepted' | 'dismissed' | 'unavailable'> {
  if (!deferred) return 'unavailable'

  const event = deferred
  deferred = null
  emit()

  await event.prompt()
  const { outcome } = await event.userChoice
  return outcome
}

/** True when running from the home screen rather than a browser tab. */
export function isInstalled(): boolean {
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    // iOS never matched the standard media query; this is its own flag.
    (navigator as Navigator & { standalone?: boolean }).standalone === true
  )
}

export function detectPlatform(): InstallPlatform {
  const ua = navigator.userAgent
  // iPadOS 13+ reports itself as a Mac. Touch points are the only reliable tell.
  const iPad = navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1

  if (/iPhone|iPad|iPod/i.test(ua) || iPad) return 'ios'
  if (/Android/i.test(ua)) return 'android'
  return 'desktop'
}

if (import.meta.env.DEV) {
  ;(window as unknown as Record<string, unknown>).upkeepInstall = {
    canPrompt: canPromptInstall,
    isInstalled,
    platform: detectPlatform,
    supported: () => 'onbeforeinstallprompt' in window,
  }
}