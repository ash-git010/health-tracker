import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { sendFeedback } from '../../data/feedback'
import { TextField } from '../../components/TextField'
import { Button, Card, ScreenHeader } from '../../components/ui'
import { t } from '../../data/i18n'

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
      setError(err instanceof Error ? err.message : t('feedback.genericError'))
    }
    setSending(false)
  }

  if (sentUrl) {
    return (
      <div className="stack">
        <ScreenHeader
          title={t('feedback.thanksTitle')}
          action={
            <Button size="sm" onClick={() => navigate('/settings')}>
              {t('common.back')}
            </Button>
          }
        />
        <Card>
          <p style={{ margin: 0 }}>{t('feedback.sentIntro')}</p>
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
        title={t('settings.feedback')}
        action={
          <Button size="sm" onClick={() => navigate('/settings')}>
            {t('common.back')}
          </Button>
        }
      />

      <div className="row">
        <Button variant={kind === 'bug' ? 'primary' : 'default'} onClick={() => setKind('bug')}>
          {t('feedback.bugOption')}
        </Button>
        <Button
          variant={kind === 'suggestion' ? 'primary' : 'default'}
          onClick={() => setKind('suggestion')}
        >
          {t('feedback.ideaOption')}
        </Button>
      </div>

      <TextField
        label={t('feedback.summaryLabel')}
        value={title}
        onChange={setTitle}
        placeholder={kind === 'bug' ? t('feedback.bugPlaceholder') : t('feedback.ideaPlaceholder')}
      />

      <label className="field">
        <span className="field-label">{t('feedback.detailsLabel')}</span>
        <textarea
          value={details}
          onChange={(e) => setDetails(e.target.value)}
          rows={5}
          placeholder={t('feedback.detailsPlaceholder')}
        />
      </label>

      <p className="warn">{t('feedback.publicWarning')}</p>

      {error && <p className="warn">{error}</p>}

      <Button variant="primary" block onClick={handleSend} disabled={!canSend}>
        {sending ? t('feedback.sending') : t('feedback.send')}
      </Button>
    </div>
  )
}