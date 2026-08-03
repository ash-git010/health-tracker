import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useLiveQuery } from 'dexie-react-hooks'
import { ChevronLeft, ChevronRight, Plus, X } from 'lucide-react'
import { getEntriesForDate, deleteEntry, sumEntries, MEALS, type Meal } from '../../data/log'
import { getGoals, macroGramsFromGoals } from '../../data/goals'
import { todayISO, addDays, formatDay } from '../../data/dates'
import { Card, Fab } from '../../components/ui'

export function TodayScreen() {
  const [date, setDate] = useState(todayISO())
  const navigate = useNavigate()

  const entries = useLiveQuery(() => getEntriesForDate(date), [date])
  const goals = useLiveQuery(() => getGoals(), [])

  const totals = sumEntries(entries ?? [])
  const targets = goals ? macroGramsFromGoals(goals) : null
  const proteinMet = goals ? totals.protein >= goals.minProteinGrams : true

  const eaten = Math.round(totals.kcal)
  const remaining = goals ? goals.dailyCalories - eaten : 0
  const over = remaining < 0

  function addTo(meal: Meal) {
    navigate('/meals/today/add', { state: { meal, date } })
  }

  return (
    <div style={{ paddingBottom: '4rem' }}>
      <div className="row" style={{ marginBottom: '1rem' }}>
        <button
          className="icon-btn"
          aria-label="Previous day"
          onClick={() => setDate(addDays(date, -1))}
        >
          <ChevronLeft size={20} />
        </button>
        <h2 className="grow" style={{ textAlign: 'center', margin: 0 }}>
          {formatDay(date)}
        </h2>
        <button
          className="icon-btn"
          aria-label="Next day"
          disabled={date >= todayISO()}
          style={{ opacity: date >= todayISO() ? 0.3 : 1 }}
          onClick={() => setDate(addDays(date, 1))}
        >
          <ChevronRight size={20} />
        </button>
      </div>

      {goals && (
        <Card style={{ marginBottom: '1.5rem' }}>
          <div className="row" style={{ alignItems: 'flex-end' }}>
            <div className="grow">
              <div className="faint">Eaten</div>
              <div className="row" style={{ alignItems: 'baseline', gap: '0.35rem' }}>
                <span className="stat">{eaten}</span>
                <span className="stat-unit">/ {goals.dailyCalories} kcal</span>
              </div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div className="faint">{over ? 'Over' : 'Left'}</div>
              <div className={over ? 'stat-sm warn' : 'stat-sm'} style={{ fontSize: '1.5rem' }}>
                {Math.abs(remaining)}
              </div>
            </div>
          </div>

          <div className="progress-track" style={{ margin: '0.875rem 0 1.125rem' }}>
            <div
              className="progress-fill"
              style={{
                width: `${Math.min(100, (eaten / goals.dailyCalories) * 100)}%`,
                background: over ? 'var(--warn)' : 'var(--accent)',
              }}
            />
          </div>

          {targets && (
            <div>
              <MacroRow label="Protein" value={totals.protein} target={targets.protein} />
              <MacroRow label="Carbs" value={totals.carbs} target={targets.carbs} />
              <MacroRow label="Fat" value={totals.fat} target={targets.fat} />
            </div>
          )}

          {goals.minProteinGrams > 0 && (
            <p
              className={proteinMet ? 'faint' : 'warn'}
              style={{ margin: '0.75rem 0 0' }}
            >
              {proteinMet
                ? `Protein minimum met · ${goals.minProteinGrams}g`
                : `${Math.round(goals.minProteinGrams - totals.protein)}g below your protein minimum`}
            </p>
          )}
        </Card>
      )}

      {MEALS.map((meal) => {
        const mealEntries = (entries ?? []).filter((e) => e.meal === meal)
        const mealTotal = sumEntries(mealEntries)

        return (
          <div key={meal} style={{ marginBottom: '1.125rem' }}>
            <div className="row" style={{ marginBottom: '0.25rem' }}>
              <h3 className="grow" style={{ margin: 0 }}>
                {meal}
              </h3>
              {mealEntries.length > 0 && (
                <span className="muted num">{Math.round(mealTotal.kcal)} kcal</span>
              )}
              <button
                className="icon-btn"
                aria-label={`Add to ${meal}`}
                onClick={() => addTo(meal)}
                style={{ marginRight: '-0.5rem' }}
              >
                <Plus size={18} />
              </button>
            </div>

            {mealEntries.length === 0 ? (
              <p className="faint" style={{ margin: 0 }}>
                Nothing logged
              </p>
            ) : (
              mealEntries.map((e) => (
                <div key={e.id} className="list-item">
                  <div className="grow" style={{ minWidth: 0 }}>
                    <div
                      style={{
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                      }}
                    >
                      {e.foodName}
                    </div>
                    <span className="faint">
                      {e.amount}
                      {e.unit}
                    </span>
                  </div>
                  <span className="num" style={{ fontWeight: 600 }}>
                    {Math.round(e.kcal)}
                  </span>
                  <button
                    className="icon-btn"
                    aria-label={`Remove ${e.foodName}`}
                    onClick={() => e.id && deleteEntry(e.id)}
                  >
                    <X size={16} />
                  </button>
                </div>
              ))
            )}
          </div>
        )
      })}

      <Fab label="Add food" onClick={() => addTo('snack')}>
        <Plus size={26} />
      </Fab>
    </div>
  )
}

function MacroRow({ label, value, target }: { label: string; value: number; target: number }) {
  const pct = target > 0 ? Math.min(100, (value / target) * 100) : 0
  return (
    <div style={{ marginBottom: '0.7rem' }}>
      <div className="row" style={{ fontSize: '0.8125rem', marginBottom: '0.3rem' }}>
        <span className="grow muted">{label}</span>
        <span className="faint num">
          {Math.round(value)} / {target}g
        </span>
      </div>
      <div className="progress-track" style={{ height: '4px' }}>
        <div className="progress-fill" style={{ width: `${pct}%` }} />
      </div>
    </div>
  )
}