import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Plus, Copy } from 'lucide-react'
import {
  getProgram,
  getProgramDays,
  createProgram,
  updateProgram,
  deleteProgram,
  setProgramDays,
  definedWeekCount,
  type ProgramDayInput,
} from '../../data/programs'
import { listRoutines } from '../../data/routines'
import { TextField } from '../../components/TextField'
import { OptionSheet } from '../../components/OptionSheet'
import { Button, Card, Empty, ScreenHeader } from '../../components/ui'
import { useConfirm } from '../../components/DialogProvider'
import { useLiveQuery } from 'dexie-react-hooks'
import { t } from '../../data/i18n'
import type { Routine } from '../../data/types'

const DAYS_PER_WEEK = 7

type WeekDraft = {
  week: number
  days: (string | undefined)[]
}

function blankWeek(weekNumber: number): WeekDraft {
  return { week: weekNumber, days: Array<string | undefined>(DAYS_PER_WEEK).fill(undefined) }
}

export function ProgramFormScreen() {
  const { id } = useParams()
  const programId = id
  const navigate = useNavigate()
  const confirm = useConfirm()
  const routines = useLiveQuery(() => listRoutines(), [])

  const [loading, setLoading] = useState(!!programId)
  const [name, setName] = useState('')
  const [notes, setNotes] = useState('')
  const [repeats, setRepeats] = useState(false)
  const [weeks, setWeeks] = useState<WeekDraft[]>([blankWeek(1)])
  const [dayPicker, setDayPicker] = useState<{ week: number; dayIndex: number } | null>(null)
  const [copyFrom, setCopyFrom] = useState<{ week: number; dayIndex: number } | null>(null)
  const [copyTargets, setCopyTargets] = useState<Set<string>>(new Set())
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!programId) return
    Promise.all([getProgram(programId), getProgramDays(programId)]).then(([program, programDays]) => {
      setName(program?.name ?? '')
      setNotes(program?.notes ?? '')
      setRepeats(program?.repeats ?? false)

      const weekCount = Math.max(1, definedWeekCount(programDays))
      const nextWeeks: WeekDraft[] = Array.from({ length: weekCount }, (_, i) => blankWeek(i + 1))
      for (const day of programDays) {
        const target = nextWeeks[day.week - 1]
        if (target) target.days[day.dayIndex - 1] = day.routineId
      }
      setWeeks(nextWeeks)
      setLoading(false)
    })
  }, [programId])

  if (loading || routines === undefined) return <Empty>{t('programs.form.loading')}</Empty>

  function routineName(routineId: string | undefined): string {
    if (!routineId) return t('programs.form.restDay')
    return routines?.find((r) => r.id === routineId)?.name ?? t('programs.form.restDay')
  }

  function assignDay(week: number, dayIndex: number, routineId: string | undefined) {
    setWeeks((prev) =>
      prev.map((w) =>
        w.week === week
          ? { ...w, days: w.days.map((d, i) => (i === dayIndex - 1 ? routineId : d)) }
          : w
      )
    )
  }

  function addWeek() {
    setWeeks((prev) => [...prev, blankWeek(prev.length + 1)])
  }

  function removeLastWeek() {
    setWeeks((prev) => (prev.length > 1 ? prev.slice(0, -1) : prev))
  }

  function toggleTarget(key: string) {
    setCopyTargets((prev) => {
      const next = new Set(prev)
      if (next.has(key)) next.delete(key)
      else next.add(key)
      return next
    })
  }

  function applyCopy() {
    if (!copyFrom) return
    const source = weeks.find((w) => w.week === copyFrom.week)?.days[copyFrom.dayIndex - 1]
    for (const key of copyTargets) {
      const [weekStr, dayStr] = key.split(':')
      assignDay(Number(weekStr), Number(dayStr), source)
    }
    setCopyFrom(null)
    setCopyTargets(new Set())
  }

  async function handleSave() {
    if (saving) return
    if (!name.trim()) {
      setError(t('programs.form.errName'))
      return
    }

    setError(null)
    setSaving(true)

    const finalId = programId ?? (await createProgram(name.trim()))
    await updateProgram(finalId, {
      name: name.trim(),
      notes: notes.trim() || undefined,
      repeats,
    })

    const dayInputs: ProgramDayInput[] = weeks.flatMap((w) =>
      w.days.map((routineId, i) => ({ week: w.week, dayIndex: i + 1, routineId }))
    )
    await setProgramDays(finalId, dayInputs)

    setSaving(false)
    navigate('/workouts/routines')
  }

  async function handleDelete() {
    if (!programId) return
    const ok = await confirm({
      title: t('programs.form.deleteTitle'),
      message: t('programs.form.deleteMessage'),
      confirmLabel: t('programs.form.deleteConfirm'),
      destructive: true,
    })
    if (!ok) return
    await deleteProgram(programId)
    navigate('/workouts/routines')
  }

  const activeDay = dayPicker ? weeks.find((w) => w.week === dayPicker.week) : undefined

  return (
    <div className="stack" style={{ paddingBottom: '2rem' }}>
      <ScreenHeader
        title={programId ? t('programs.form.editTitle') : t('programs.form.newTitle')}
        onBack={() => navigate('/workouts/routines')}
      />

      <TextField
        label={t('programs.form.name')}
        value={name}
        onChange={(v) => {
          setError(null)
          setName(v)
        }}
        placeholder={t('programs.form.namePlaceholder')}
      />

      <label className="field">
        <span className="field-label">{t('programs.form.notes')}</span>
        <textarea
          value={notes}
          placeholder={t('programs.form.notesPlaceholder')}
          rows={2}
          onChange={(e) => setNotes(e.target.value)}
        />
      </label>

      <label className="toggle-row">
        <span>
          <span className="toggle-row-title">{t('programs.form.repeatsTitle')}</span>
          <span className="muted">{t('programs.form.repeatsHint')}</span>
        </span>
        <input type="checkbox" checked={repeats} onChange={(e) => setRepeats(e.target.checked)} />
      </label>

      <h3 style={{ marginTop: '1.25rem' }}>{t('programs.form.scheduleHeading')}</h3>

      {weeks.map((week) => (
        <Card key={week.week} style={{ marginBottom: '0.75rem' }}>
          <div className="row" style={{ marginBottom: '0.5rem' }}>
            <strong className="grow">{t('programs.form.weekLabel', { n: week.week })}</strong>
          </div>

          {week.days.map((routineId, i) => (
            <div key={i} className="row" style={{ padding: '0.375rem 0' }}>
              <button
                className="btn-plain grow"
                style={{ display: 'block', textAlign: 'left' }}
                onClick={() => setDayPicker({ week: week.week, dayIndex: i + 1 })}
              >
                <span className="faint">{t('programs.form.dayLabel', { n: i + 1 })}</span>
                {' — '}
                <span>{routineName(routineId)}</span>
              </button>
              <button
                className="icon-btn"
                aria-label={t('programs.form.copyDayAria', { n: i + 1 })}
                onClick={() => setCopyFrom({ week: week.week, dayIndex: i + 1 })}
              >
                <Copy size={15} />
              </button>
            </div>
          ))}
        </Card>
      ))}

      <div className="row">
        <Button onClick={addWeek}>
          <Plus size={14} /> {t('programs.form.addWeek')}
        </Button>
        {weeks.length > 1 && (
          <Button variant="ghost" onClick={removeLastWeek}>
            {t('programs.form.removeLastWeek')}
          </Button>
        )}
      </div>

      {error && (
        <p className="danger" style={{ margin: 0 }}>
          {error}
        </p>
      )}

      <div className="form-actions">
        {programId && (
          <Button variant="ghost" className="btn-warn" onClick={handleDelete}>
            {t('common.delete')}
          </Button>
        )}
        <span className="grow">
          <Button variant="primary" block onClick={handleSave} disabled={saving}>
            {saving ? t('programs.form.saving') : t('programs.form.save')}
          </Button>
        </span>
      </div>

      {dayPicker && activeDay && (
        <OptionSheet
          title={t('programs.form.dayLabel', { n: dayPicker.dayIndex })}
          onClose={() => setDayPicker(null)}
          options={[
            {
              label: t('programs.form.restDay'),
              active: activeDay.days[dayPicker.dayIndex - 1] === undefined,
              onSelect: () => {
                assignDay(dayPicker.week, dayPicker.dayIndex, undefined)
                setDayPicker(null)
              },
            },
            ...(routines ?? []).map((r: Routine) => ({
              label: r.name,
              active: activeDay.days[dayPicker.dayIndex - 1] === r.id,
              onSelect: () => {
                assignDay(dayPicker.week, dayPicker.dayIndex, r.id)
                setDayPicker(null)
              },
            })),
          ]}
        />
      )}

      {copyFrom && (
        <div
          className="sheet-backdrop"
          onClick={() => {
            setCopyFrom(null)
            setCopyTargets(new Set())
          }}
        >
          <div className="sheet" onClick={(e) => e.stopPropagation()}>
            <div className="sheet-title">{t('programs.form.copyToTitle')}</div>

            <div style={{ padding: '0 1rem' }}>
              {weeks.map((w) => (
                <div key={w.week} style={{ marginBottom: '0.75rem' }}>
                  <div className="faint" style={{ marginBottom: '0.25rem' }}>
                    {t('programs.form.weekLabel', { n: w.week })}
                  </div>
                  <div className="chip-row">
                    {w.days.map((_, i) => {
                      const key = `${w.week}:${i + 1}`
                      const isSource = w.week === copyFrom.week && i + 1 === copyFrom.dayIndex
                      if (isSource) return null
                      return (
                        <button
                          key={key}
                          className={`chip${copyTargets.has(key) ? ' active' : ''}`}
                          onClick={() => toggleTarget(key)}
                        >
                          {t('programs.form.dayLabel', { n: i + 1 })}
                        </button>
                      )
                    })}
                  </div>
                </div>
              ))}
            </div>

            <div className="form-actions" style={{ padding: '0.75rem 1rem' }}>
              <Button
                variant="ghost"
                onClick={() => {
                  setCopyFrom(null)
                  setCopyTargets(new Set())
                }}
              >
                {t('common.cancel')}
              </Button>
              <span className="grow">
                <Button variant="primary" block onClick={applyCopy}>
                  {t('programs.form.copyConfirm')}
                </Button>
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
