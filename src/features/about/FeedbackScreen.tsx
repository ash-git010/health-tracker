import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { sendFeedback } from '../../data/feedback'
import { TextField } from '../../components/TextField'
import { Button, Card, ScreenHeader } from '../../components/ui'

export function FeedbackScreen() {
  const navigate = useNavigate()
  const [kind, setKind] = useState<'bug' | 'suggestion'>('bug')
  const [title, setTitle] = useState('')
  const [details, setDetails] = useState('')
  const [sending, setSending] = useState(false)
  const [sentUrl, setSentUrl] = useState('')
  const [error, setError] = useState('')

  const canSend = title.trim().length >= 5 && !sending

  async function handleSend() {
    if (!canSend) return
    setSending(true)
    setError('')
    try {
      const url = await sendFeedback({ kind, title, details })
      setSentUrl(url)
    } catch (err) {
      console.error('Feedback failed:', err)
      setError('Could not send that. Check your connection and try again.')
    }
    setSending(false)
  }

  if (sentUrl) {
    return (
      <div className="stack">
        <ScreenHeader
          title="Thanks"
          action={
            <Button size="sm" onClick={() => navigate('/settings')}>
              Back
            </Button>
          }
        />
        <Card>
          <p style={{ margin: 0 }}>Sent. You can follow it here:</p>
          <p className="muted" style={{ margin: '0.5rem 0 0', wordBreak: 'break-all' }}>
            <a href={sentUrl} target="_blank" rel="noreferrer">
              {sentUrl}
            </a>
          </p>
        </Card>
      </div>
    )
  }

  return (
    <div className="stack">
      <ScreenHeader
        title="Report a problem"
        action={
          <Button size="sm" onClick={() => navigate('/settings')}>
            Back
          </Button>
        }
      />

      <div className="row">
        <Button variant={kind === 'bug' ? 'primary' : 'default'} onClick={() => setKind('bug')}>
          Something's broken
        </Button>
        <Button
          variant={kind === 'suggestion' ? 'primary' : 'default'}
          onClick={() => setKind('suggestion')}
        >
          An idea
        </Button>
      </div>

      <TextField
        label="Short summary"
        value={title}
        onChange={setTitle}
        placeholder={kind === 'bug' ? 'Scan button does nothing' : 'Add a water tracker'}
      />

      <label className="field">
        <span className="field-label">Details (optional)</span>
        <textarea
          value={details}
          onChange={(e) => setDetails(e.target.value)}
          rows={5}
          placeholder="What happened, and what did you expect?"
        />
      </label>

      <p className="warn">
        This creates a public post on GitHub that anyone can read. Don't include
        personal details.
      </p>

      {error && <p className="warn">{error}</p>}

      <Button variant="primary" block onClick={handleSend} disabled={!canSend}>
        {sending ? 'Sending…' : 'Send'}
      </Button>
    </div>
  )
}