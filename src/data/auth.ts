import { supabase } from './supabase'

/**
 * Auth plumbing. No UI, no sync, no data adoption — those come later.
 *
 * Everything here returns a result object rather than throwing. Screens need
 * to tell "wrong password" apart from "you're offline" apart from "that email
 * already has an account", and a thrown Error makes that awkward to do well.
 */

export type AuthFailure =
  | 'email-taken'
  | 'invalid-credentials'
  | 'invalid-email'
  | 'weak-password'
  | 'offline'
  | 'unknown'

export type AuthResult =
  | { ok: true; userId: string; email: string }
  | { ok: false; reason: AuthFailure; message: string }

export interface CurrentUser {
  id: string
  email: string
  name?: string
}

/**
 * Supabase surfaces most problems as a message string rather than a stable
 * code, so match on the text. Kept in one place: if a message changes upstream,
 * this is the only function to fix.
 */
function classify(message: string): AuthFailure {
  const m = message.toLowerCase()
  if (m.includes('already registered') || m.includes('already been registered')) {
    return 'email-taken'
  }
  if (m.includes('invalid login credentials')) return 'invalid-credentials'
  if (m.includes('password')) return 'weak-password'
  if (m.includes('email')) return 'invalid-email'
  if (m.includes('fetch') || m.includes('network')) return 'offline'
  return 'unknown'
}

function friendly(reason: AuthFailure): string {
  switch (reason) {
    case 'email-taken':
      return 'That email already has an account. Log in instead.'
    case 'invalid-credentials':
      return 'Email or password is wrong.'
    case 'invalid-email':
      return 'That email address does not look right.'
    case 'weak-password':
      return 'Password needs to be at least 6 characters.'
    case 'offline':
      return 'No connection. Your data is safe on this device — try again later.'
    case 'unknown':
      return 'Something went wrong. Try again.'
  }
}

/**
 * Create an account. Email confirmation is off, so a successful signup returns
 * a live session immediately and the user is logged in.
 *
 * `name` is stored on the auth user as a convenience copy. The real home for it
 * is the local profile row, which gets pushed up during data adoption.
 */
export async function signUp(
  email: string,
  password: string,
  name: string
): Promise<AuthResult> {
  const { data, error } = await supabase.auth.signUp({
    email: email.trim(),
    password,
    options: { data: { name: name.trim() } },
  })

  if (error) {
    const reason = classify(error.message)
    return { ok: false, reason, message: friendly(reason) }
  }

  // Defensive: with confirmation ON, Supabase returns a user and no session
  // for an already-registered email rather than erroring, to avoid revealing
  // who has an account. Confirmation is off now, but this costs nothing and
  // stops a silent dead-end if that setting is ever flipped back.
  if (data.user && !data.session) {
    return {
      ok: false,
      reason: 'email-taken',
      message: friendly('email-taken'),
    }
  }

  if (!data.user) {
    return { ok: false, reason: 'unknown', message: friendly('unknown') }
  }

  return { ok: true, userId: data.user.id, email: data.user.email ?? '' }
}

export async function signIn(email: string, password: string): Promise<AuthResult> {
  const { data, error } = await supabase.auth.signInWithPassword({
    email: email.trim(),
    password,
  })

  if (error) {
    const reason = classify(error.message)
    return { ok: false, reason, message: friendly(reason) }
  }

  if (!data.user) {
    return { ok: false, reason: 'unknown', message: friendly('unknown') }
  }

  return { ok: true, userId: data.user.id, email: data.user.email ?? '' }
}

/**
 * Sign out. Local Dexie data is deliberately left alone — the user may well
 * sign back in, and wiping a phone's data on logout would be a catastrophic
 * default for an app whose whole premise is local-first.
 */
export async function signOut(): Promise<void> {
  await supabase.auth.signOut()
}

export async function getCurrentUser(): Promise<CurrentUser | null> {
  const { data } = await supabase.auth.getSession()
  const user = data.session?.user
  if (!user) return null

  return {
    id: user.id,
    email: user.email ?? '',
    name: (user.user_metadata?.name as string | undefined) ?? undefined,
  }
}

export async function isSignedIn(): Promise<boolean> {
  return (await getCurrentUser()) !== null
}

/**
 * Subscribe to login/logout. Returns an unsubscribe function, so a React
 * effect can clean up by returning it directly.
 */
export function onAuthChange(callback: (user: CurrentUser | null) => void): () => void {
  const { data } = supabase.auth.onAuthStateChange((_event, session) => {
    const user = session?.user
    callback(
      user
        ? {
            id: user.id,
            email: user.email ?? '',
            name: (user.user_metadata?.name as string | undefined) ?? undefined,
          }
        : null
    )
  })

  return () => data.subscription.unsubscribe()
}

// Development only — lets you exercise all of this from the browser console
// before any screens exist. Vite strips this branch from production builds.
if (import.meta.env.DEV) {
  ;(window as unknown as Record<string, unknown>).upkeepAuth = {
    signUp,
    signIn,
    signOut,
    getCurrentUser,
    isSignedIn,
  }
}