import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useLiveQuery } from 'dexie-react-hooks'
import { ChevronUp, ChevronDown, X, Plus } from 'lucide-react'
import {
  getCareRoutine,
  getSteps,
  createCareRoutine,
  updateCareRoutine,
  deleteCareRoutine,
  setSteps,
  routineKinds,
  DEFAULT_KINDS,
  TIMES,
  type CareStepInput,
} from '../../data/careRoutines'
import { TextField } from '../../components/TextField'
import { Button, Card, Empty, ScreenHeader } from '../../components/ui'
import { useConfirm } from '../../components/DialogProvider'
import type { TimeOfDay } from '../../data/types'

export function CareRoutineFormScreen() {
  const { id } = useParams()
  const routineId = id
  const navigate = useNavigate()
  const confirm = useConfirm()

  const [loading, setLoading] = useState(!!routineId)
  const [name, setName] = useState('')
  const [kind, setKind] = useState('Skin')
  const [customKind, setCustomKind] = useState(false)
  const [timeOfDay, setTimeOfDay] = useState<TimeOfDay>('morning')
  const [steps, setStepList] = useState<CareStepInput[]>([])
  const [saving, setSaving] = useState(false)

  const kinds = useLiveQuery(() => routineKinds(), []) ?? DEFAULT_KINDS

  useEffect(() => {
    if (!routineId) return
    Promise.all([getCareRoutine(routineId), getSteps(routineId)]).then(([routine, list]) => {
      if (routine) {
        setName(routine.name)
        setKind(routine.kind)
        setTimeOfDay(routine.timeOfDay)
      }
      setStepList(list.map((s) => ({ name: s.name, product: s.product, notes: s.notes })))
      setLoading(false)
    })
  }, [routineId])

  if (loading) return <Empty>Loading…</Empty>

  const canSave = name.trim().length > 0 && kind.trim().length > 0

  function updateStep(index: number, changes: Partial<CareStepInput>) {
    setStepList((prev) => prev.map((s, i) => (i === index ? { ...s, ...changes } : s)))
  }

  function move(index: number, dir: -1 | 1) {
    setStepList((prev) => {
      const next = [...prev]
      const target = index + dir
      if (target < 0 || target >= next.length) return prev
      ;[next[index], next[target]] = [next[target], next[index]]
      return next
    })
  }

  async function handleSave() {
    if (!canSave || saving) return
    setSaving(true)

    const cleanSteps = steps
      .filter((s) => s.name.trim())
      .map((s) => ({
        name: s.name.trim(),
        product: s.product?.trim() || undefined,
        notes: s.notes?.trim() || undefined,
      }))

    const cleanKind = kind.trim()
    const finalId =
      routineId ?? (await createCareRoutine({ name: name.trim(), kind: cleanKind, timeOfDay }))

    if (routineId) {
      await updateCareRoutine(routineId, { name: name.trim(), kind: cleanKind, timeOfDay })
    }

    await setSteps(finalId, cleanSteps)
    navigate('/routines/manage')
  }

  async function handleDelete() {
    if (!routineId) return
    const ok = await confirm({
      title: 'Delete this routine?',
      message: 'Its steps and completion history will be removed.',
      confirmLabel: 'Delete',
      destructive: true,
    })
    if (!ok) return
    await deleteCareRoutine(routineId)
    navigate('/routines/manage')
  }

  return (
    <div className="stack">
      <ScreenHeader
        title={routineId ? 'Edit routine' : 'New routine'}
        onBack={() => navigate('/routines/manage')}
      />

      <TextField label="Name" value={name} onChange={setName} placeholder="Morning skincare" />

      <label className="field">
        <span className="field-label">Type</span>
        {customKind ? (
          <span className="row">
            <input
              type="text"
              value={kind}
              autoFocus
              placeholder="Nails, teeth, supplements…"
              onChange={(e) => setKind(e.target.value)}
            />
            <Button
              size="sm"
              variant="ghost"
              onClick={() => {
                setKind(DEFAULT_KINDS[0])
                setCustomKind(false)
              }}
            >
              Cancel
            </Button>
          </span>
        ) : (
          <select
            value={kinds.includes(kind) ? kind : DEFAULT_KINDS[0]}
            onChange={(e) => {
              if (e.target.value === '__new__') {
                setKind('')
                setCustomKind(true)
              } else {
                setKind(e.target.value)
              }
            }}
          >
            {kinds.map((k) => (
              <option key={k} value={k}>
                {k}
              </option>
            ))}
            <option value="__new__">New type…</option>
          </select>
        )}
      </label>

      <label className="field">
        <span className="field-label">When</span>
        <select value={timeOfDay} onChange={(e) => setTimeOfDay(e.target.value as TimeOfDay)}>
          {TIMES.map((t) => (
            <option key={t.value} value={t.value}>
              {t.label}
            </option>
          ))}
        </select>
      </label>

      <h3 style={{ marginTop: '1.25rem' }}>Steps</h3>

      {steps.length === 0 && <Empty>No steps yet.</Empty>}

      {steps.map((step, i) => (
        <Card key={i} style={{ marginBottom: '0.5rem' }}>
          <div className="row" style={{ marginBottom: '0.5rem' }}>
            <span className="faint" style={{ width: '1.25rem' }}>
              {i + 1}
            </span>
            <span className="grow" />
            <button
              className="icon-btn"
              aria-label="Move step up"
              disabled={i === 0}
              style={{ opacity: i === 0 ? 0.25 : 1 }}
              onClick={() => move(i, -1)}
            >
              <ChevronUp size={16} />
            </button>
            <button
              className="icon-btn"
              aria-label="Move step down"
              disabled={i === steps.length - 1}
              style={{ opacity: i === steps.length - 1 ? 0.25 : 1 }}
              onClick={() => move(i, 1)}
            >
              <ChevronDown size={16} />
            </button>
            <button
              className="icon-btn"
              aria-label="Remove step"
              onClick={() => setStepList((prev) => prev.filter((_, j) => j !== i))}
            >
              <X size={16} />
            </button>
          </div>

          <input
            type="text"
            value={step.name}
            placeholder="Cleanser"
            onChange={(e) => updateStep(i, { name: e.target.value })}
            style={{ marginBottom: '0.5rem' }}
          />
          <input
            type="text"
            value={step.product ?? ''}
            placeholder="Product (optional)"
            onChange={(e) => updateStep(i, { product: e.target.value })}
          />
        </Card>
      ))}

      <Button block onClick={() => setStepList((prev) => [...prev, { name: '' }])}>
        <Plus size={16} /> Add step
      </Button>

      <div className="form-actions">
        {routineId && (
          <Button variant="ghost" className="btn-warn" onClick={handleDelete}>
            Delete
          </Button>
        )}
        <span className="grow">
          <Button variant="primary" block onClick={handleSave} disabled={!canSave || saving}>
            {saving ? 'Saving…' : 'Save routine'}
          </Button>
        </span>
      </div>
    </div>
  )
}