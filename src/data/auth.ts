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
  | 'wrong-password'
  | 'same-password'
  | 'invalid-code'
  | 'rate-limited'
  | 'offline'
  | 'unknown'

export type AuthResult =
  | { ok: true; userId: string; email: string }
  | { ok: false; reason: AuthFailure; message: string }

/**
 * For calls that succeed without producing a user — requesting a reset code
 * being the only one so far. Deliberately carries no data on success: the
 * whole point is that we learn nothing about whether the address exists.
 */
export type SimpleResult =
  | { ok: true }
  | { ok: false; reason: AuthFailure; message: string }

/**
 * Minimum length for a password being set now. Above Supabase's own floor of 6.
 *
 * Lives here rather than in a screen because it is account policy, not layout,
 * and three screens now need it. LoginScreen deliberately does NOT apply it —
 * it checks presence only, so accounts created under the old minimum still log
 * in. Validate what exists, not what current policy would require.
 */
export const MIN_PASSWORD = 8

/** Length of the recovery code Supabase puts in `{{ .Token }}`. */
export const RESET_CODE_LENGTH = 8

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

  // These two must be tested before the loose checks further down. Supabase's
  // rate-limit message is "email rate limit exceeded", which contains "email"
  // and would otherwise be reported as a malformed address; the expired-token
  // message contains neither "password" nor "email" and would fall through to
  // 'unknown'.
  if (
    m.includes('rate limit') ||
    m.includes('for security purposes') ||
    m.includes('too many')
  ) {
    return 'rate-limited'
  }
  if (m.includes('token') || m.includes('otp') || m.includes('expired')) {
    return 'invalid-code'
  }

  if (m.includes('already registered') || m.includes('already been registered')) {
    return 'email-taken'
  }
  if (m.includes('invalid login credentials')) return 'invalid-credentials'
  if (m.includes('should be different')) return 'same-password'
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
    case 'wrong-password':
      return 'That is not your current password.'
    case 'same-password':
      return 'The new password must be different from the old one.'
    case 'invalid-code':
      return 'That code is wrong or has expired. Request a new one.'
    case 'rate-limited':
      return 'Too many attempts. Wait a minute and try again.'
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

  // No session check here, deliberately. With confirmation ON every signup
  // returns a user and no session, so testing for that would reject every
  // legitimate registration as an existing account.
  //
  // The cost is that an already-registered email is now indistinguishable from
  // a new one — Supabase obfuscates it on purpose, so that the endpoint cannot
  // be used to test whether someone uses Upkeep. Nobody gets told; the code
  // screen offers a way to log in instead.
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

/**
 * Change the account password.
 *
 * Supabase's updateUser({ password }) does NOT require the current password —
 * a live session is enough. On a phone that means anyone holding it unlocked
 * could take the account permanently. So we re-authenticate first and only
 * update if that succeeds.
 *
 * signInWithPassword with the wrong password fails without disturbing the
 * existing session, so a failed attempt leaves the user signed in as they were.
 */
export async function changePassword(
  currentPassword: string,
  newPassword: string
): Promise<AuthResult> {
  const user = await getCurrentUser()
  if (!user) {
    return { ok: false, reason: 'unknown', message: 'You are not signed in.' }
  }

  const { error: reauthError } = await supabase.auth.signInWithPassword({
    email: user.email,
    password: currentPassword,
  })

  if (reauthError) {
    const reason = classify(reauthError.message)
    // Anything credential-shaped here means the current password was wrong.
    // A network failure is still a network failure and should say so.
    if (reason === 'invalid-credentials' || reason === 'unknown') {
      return { ok: false, reason: 'wrong-password', message: friendly('wrong-password') }
    }
    return { ok: false, reason, message: friendly(reason) }
  }

  const { data, error } = await supabase.auth.updateUser({ password: newPassword })

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
 * Verify the code emailed after signup. Creates the session that signUp did not.
 */
export async function confirmSignUp(email: string, code: string): Promise<AuthResult> {
  const { data, error } = await supabase.auth.verifyOtp({
    email: email.trim(),
    token: code.replace(/\D/g, ''),
    type: 'signup',
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
 * Re-send the signup code. Same silence as requestPasswordReset: this reports
 * success for an address that is already confirmed, so it reveals nothing.
 */
export async function resendSignUpCode(email: string): Promise<SimpleResult> {
  const { error } = await supabase.auth.resend({ type: 'signup', email: email.trim() })

  if (error) {
    const reason = classify(error.message)
    return { ok: false, reason, message: friendly(reason) }
  }

  return { ok: true }
}

/**
 * Send a recovery code to an email address.
 *
 * Succeeds whether or not the address has an account — Supabase will not say,
 * deliberately, because an endpoint that distinguishes the two lets anyone test
 * whether a given person uses Upkeep. Callers must not imply a code was sent to
 * a real account; say "if that address has an account" and mean it.
 *
 * The code itself is `{{ .Token }}` in the Reset Password template. The
 * template carries no link, so this needs no redirect URL: an emailed link
 * would open the system browser rather than the installed PWA, stranding the
 * user in a tab while the app on their home screen knew nothing about it.
 */
export async function requestPasswordReset(email: string): Promise<SimpleResult> {
  const { error } = await supabase.auth.resetPasswordForEmail(email.trim())

  if (error) {
    const reason = classify(error.message)
    return { ok: false, reason, message: friendly(reason) }
  }

  return { ok: true }
}

/**
 * Verify a recovery code and set a new password.
 *
 * verifyOtp creates a real session on success, so by the time the password is
 * updated the user is already signed in — which is what we want: they finish
 * the flow inside the app rather than being bounced back to log in again.
 *
 * Note the consequence if updateUser then fails (reusing the old password is
 * the likely case): the session is live but the password is unchanged. The
 * user is signed in and can simply try a different one. Nothing is broken, but
 * it is why the screen keeps them on the form rather than sending them back.
 */
export async function resetPasswordWithCode(
  email: string,
  code: string,
  newPassword: string
): Promise<AuthResult> {
  const { error: verifyError } = await supabase.auth.verifyOtp({
    email: email.trim(),
    token: code.replace(/\D/g, ''),
    type: 'recovery',
  })

  if (verifyError) {
    const reason = classify(verifyError.message)
    return { ok: false, reason, message: friendly(reason) }
  }

  const { data, error } = await supabase.auth.updateUser({ password: newPassword })

  if (error) {
    const reason = classify(error.message)
    return { ok: false, reason, message: friendly(reason) }
  }

  if (!data.user) {
    return { ok: false, reason: 'unknown', message: friendly('unknown') }
  }

  return { ok: true, userId: data.user.id, email: data.user.email ?? '' }
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
    changePassword,
    confirmSignUp,
    resendSignUpCode,
    requestPasswordReset,
    resetPasswordWithCode,
    getCurrentUser,
    isSignedIn,
  }
}