const FEEDBACK_URL = 'https://upkeep-feedback.aswin010pk.workers.dev'

export interface FeedbackInput {
  kind: 'bug' | 'suggestion'
  title: string
  details: string
}

export async function sendFeedback(input: FeedbackInput): Promise<string> {
  const context = [
    `v${APP_VERSION}`,
    navigator.userAgent.slice(0, 120),
  ].join(' · ')

  const res = await fetch(FEEDBACK_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ ...input, context }),
  })

  const data = await res.json()
  if (!res.ok || !data.ok) throw new Error(data.error ?? 'Could not send')
  return data.url as string
}

export const APP_VERSION = '0.7'