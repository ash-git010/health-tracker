import { APP_VERSION } from './changelog'

const FEEDBACK_URL = 'https://upkeep-feedback.aswin010pk.workers.dev'

export interface FeedbackInput {
  kind: 'bug' | 'suggestion'
  title: string
  details: string
}

interface FeedbackResponse {
  ok?: boolean
  url?: string
  error?: string
}

/**
 * Throws with a message meant to be shown to the user as-is.
 *
 * Three failures worth telling apart: the request never left (offline, Worker
 * unreachable), the server answered with something that isn't JSON (a
 * Cloudflare error page), and the server refused for a stated reason (rate
 * limit, title too short). The last one carries text worth reading, so it must
 * survive up to the screen rather than being flattened into a generic line.
 */
export async function sendFeedback(input: FeedbackInput): Promise<string> {
  const context = [
    `v${APP_VERSION}`,
    navigator.userAgent.slice(0, 120),
  ].join(' · ')

  let res: Response
  try {
    res = await fetch(FEEDBACK_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...input, context }),
    })
  } catch {
    throw new Error('Could not reach the server. Check your connection and try again.')
  }

  // Previously unguarded: a non-JSON body threw a SyntaxError that surfaced as
  // a connection problem, which it isn't.
  let data: FeedbackResponse | null = null
  try {
    data = (await res.json()) as FeedbackResponse
  } catch {
    data = null
  }

  if (!res.ok || !data?.ok || !data.url) {
    throw new Error(data?.error ?? 'Could not send that. Try again in a moment.')
  }

  return data.url
}