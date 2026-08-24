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
  kindLabel,
  DEFAULT_KINDS,
  times,
  type CareStepInput,
} from '../../data/careRoutines'
import { TextField } from '../../components/TextField'
import { Button, Card, Empty, ScreenHeader } from '../../components/ui'
import { useConfirm } from '../../components/DialogProvider'
import { t } from '../../data/i18n'
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

  if (loading) return <Empty>{t('common.loading')}</Empty>

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
      title: t('care.deleteTitle'),
      message: t('care.deleteMessage'),
      confirmLabel: t('common.delete'),
      destructive: true,
    })
    if (!ok) return
    await deleteCareRoutine(routineId)
    navigate('/routines/manage')
  }

  return (
    <div className="stack">
      <ScreenHeader
        title={routineId ? t('care.editTitle') : t('care.newRoutine')}
        onBack={() => navigate('/routines/manage')}
      />

      <TextField
        label={t('care.nameLabel')}
        value={name}
        onChange={setName}
        placeholder={t('care.namePlaceholder')}
      />

      <label className="field">
        <span className="field-label">{t('care.typeLabel')}</span>
        {customKind ? (
          <span className="row">
            <input
              type="text"
              value={kind}
              autoFocus
              placeholder={t('care.newTypePlaceholder')}
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
              {t('common.cancel')}
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
                {kindLabel(k)}
              </option>
            ))}
            <option value="__new__">{t('care.newTypeOption')}</option>
          </select>
        )}
      </label>

      <label className="field">
        <span className="field-label">{t('care.whenLabel')}</span>
        <select value={timeOfDay} onChange={(e) => setTimeOfDay(e.target.value as TimeOfDay)}>
          {times().map((time) => (
            <option key={time.value} value={time.value}>
              {time.label}
            </option>
          ))}
        </select>
      </label>

      <h3 style={{ marginTop: '1.25rem' }}>{t('care.stepsHeading')}</h3>

      {steps.length === 0 && <Empty>{t('care.noStepsYet')}</Empty>}

      {steps.map((step, i) => (
        <Card key={i} style={{ marginBottom: '0.5rem' }}>
          <div className="row" style={{ marginBottom: '0.5rem' }}>
            <span className="faint" style={{ width: '1.25rem' }}>
              {i + 1}
            </span>
            <span className="grow" />
            <button
              className="icon-btn"
              aria-label={t('care.moveStepUp')}
              disabled={i === 0}
              style={{ opacity: i === 0 ? 0.25 : 1 }}
              onClick={() => move(i, -1)}
            >
              <ChevronUp size={16} />
            </button>
            <button
              className="icon-btn"
              aria-label={t('care.moveStepDown')}
              disabled={i === steps.length - 1}
              style={{ opacity: i === steps.length - 1 ? 0.25 : 1 }}
              onClick={() => move(i, 1)}
            >
              <ChevronDown size={16} />
            </button>
            <button
              className="icon-btn"
              aria-label={t('care.removeStep')}
              onClick={() => setStepList((prev) => prev.filter((_, j) => j !== i))}
            >
              <X size={16} />
            </button>
          </div>

          <input
            type="text"
            value={step.name}
            placeholder={t('care.stepNamePlaceholder')}
            onChange={(e) => updateStep(i, { name: e.target.value })}
            style={{ marginBottom: '0.5rem' }}
          />
          <input
            type="text"
            value={step.product ?? ''}
            placeholder={t('care.stepProductPlaceholder')}
            onChange={(e) => updateStep(i, { product: e.target.value })}
          />
        </Card>
      ))}

      <Button block onClick={() => setStepList((prev) => [...prev, { name: '' }])}>
        <Plus size={16} /> {t('care.addStep')}
      </Button>

      <div className="form-actions">
        {routineId && (
          <Button variant="ghost" className="btn-warn" onClick={handleDelete}>
            {t('common.delete')}
          </Button>
        )}
        <span className="grow">
          <Button variant="primary" block onClick={handleSave} disabled={!canSave || saving}>
            {saving ? t('care.saving') : t('care.saveRoutine')}
          </Button>
        </span>
      </div>
    </div>
  )
}