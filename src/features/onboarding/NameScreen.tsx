import { useState } from 'react'
import { saveName } from '../../data/profile'
import { TextField } from '../../components/TextField'
import { Button } from '../../components/ui'
import { t } from '../../data/i18n'

export function NameScreen({ onDone }: { onDone: () => void }) {
  const [name, setName] = useState('')
  const valid = name.trim().length > 0

  async function handleContinue() {
    if (!valid) return
    await saveName(name)
    onDone()
  }

  return (
    <div className="stack" style={{ padding: '1.5rem 1rem' }}>
      <h1>{t('name.title')}</h1>
      <p className="muted">{t('name.lead')}</p>

      <TextField
        label={t('name.label')}
        value={name}
        onChange={setName}
        placeholder={t('name.placeholder')}
      />

      <Button variant="primary" block onClick={handleContinue} disabled={!valid}>
        {t('common.continue')}
      </Button>
    </div>
  )
}