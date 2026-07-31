import { useState } from 'react'
import { saveName } from '../../data/profile'
import { TextField } from '../../components/TextField'
import { Button } from '../../components/ui'

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
      <h1>Welcome to Upkeep</h1>
      <p className="muted">What should we call you?</p>

      <TextField label="Your name" value={name} onChange={setName} placeholder="Ash" />

      <Button variant="primary" block onClick={handleContinue} disabled={!valid}>
        Continue
      </Button>
    </div>
  )
}