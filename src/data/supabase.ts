import { createClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL
const key = import.meta.env.VITE_SUPABASE_ANON_KEY

// Fail loudly at startup rather than with a confusing network error later.
// A missing VITE_ prefix or an unset variable both land here.
if (!url || !key) {
  throw new Error(
    'Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY. ' +
      'Check .env.local exists and restart the dev server.'
  )
}

export const supabase = createClient(url, key, {
  auth: {
    // Keep the session in localStorage and refresh it automatically, so a
    // returning user is still signed in without doing anything.
    persistSession: true,
    autoRefreshToken: true,
  },
})